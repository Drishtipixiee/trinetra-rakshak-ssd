/**
 * Trinetra Rakshak 2.0 — Computer Vision Engine
 * 
 * Uses TensorFlow.js + COCO-SSD (80-class COCO model) for real-time
 * object detection on video frames directly in the browser.
 * 
 * Research basis:
 * - Redmon et al., "YOLO: Unified, Real-Time Object Detection" (CVPR 2016)
 * - TF.js COCO-SSD: Howard et al., Google MobileNet v2 backbone
 * 
 * Methodology:
 * - proximity  = derived from bounding box area relative to frame area (larger bbox = closer)
 * - velocity   = centroid displacement between consecutive frames (pixels/frame)
 * - visibility = detection confidence score (0-100%)
 * 
 * These three real inputs are fed to the backend Fuzzy Logic engine.
 * 
 * Limitations (documented for project report):
 * 1. COCO-SSD runs at ~10fps on CPU — sufficient for surveillance but not realtime tracking
 * 2. Model trained on western COCO dataset — may have lower confidence on Indian contexts
 * 3. Low-light performance degrades without IR-specific training data
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// ─── Singleton model cache ───────────────────────────────────────
let _model = null;
let _modelLoading = false;
let _modelLoadCallbacks = [];

/**
 * THREAT_CLASSES: COCO classes that are relevant to defence surveillance.
 * Maps COCO class → internal threat type for routing to the right module.
 */
export const THREAT_CLASSES = {
  // Border-Sentry relevant
  person: { module: 'BORDER-SENTRY', baseRisk: 55, label: 'PERSON' },
  backpack: { module: 'BORDER-SENTRY', baseRisk: 25, label: 'BACKPACK' },
  handbag: { module: 'BORDER-SENTRY', baseRisk: 20, label: 'SUSPICIOUS BAG' },
  suitcase: { module: 'BORDER-SENTRY', baseRisk: 30, label: 'LUGGAGE' },
  knife: { module: 'BORDER-SENTRY', baseRisk: 85, label: 'WEAPON (BLADE)' },
  scissors: { module: 'BORDER-SENTRY', baseRisk: 60, label: 'SHARP OBJECT' },

  // Track-Guard relevant (wildlife + vehicles on tracks)
  elephant: { module: 'TRACK-GUARD', baseRisk: 90, label: 'ELEPHANT' },
  horse: { module: 'TRACK-GUARD', baseRisk: 80, label: 'LARGE ANIMAL' },
  cow: { module: 'TRACK-GUARD', baseRisk: 70, label: 'CATTLE' },
  dog: { module: 'TRACK-GUARD', baseRisk: 40, label: 'STRAY ANIMAL' },
  cat: { module: 'TRACK-GUARD', baseRisk: 30, label: 'SMALL ANIMAL' },
  bird: { module: 'TRACK-GUARD', baseRisk: 20, label: 'BIRD' },
  car: { module: 'TRACK-GUARD', baseRisk: 85, label: 'VEHICLE ON TRACK' },
  truck: { module: 'TRACK-GUARD', baseRisk: 95, label: 'HEAVY VEHICLE' },
  bus: { module: 'TRACK-GUARD', baseRisk: 90, label: 'BUS ON TRACK' },
  motorcycle: { module: 'TRACK-GUARD', baseRisk: 65, label: 'MOTORCYCLE' },
  bicycle: { module: 'TRACK-GUARD', baseRisk: 50, label: 'BICYCLE' },

  // General surveillance
  cell_phone: { module: 'BORDER-SENTRY', baseRisk: 15, label: 'MOBILE DEVICE' },
  laptop: { module: 'BORDER-SENTRY', baseRisk: 25, label: 'ELECTRONIC DEVICE' },
};

/**
 * loadModel() — Load the COCO-SSD model once and cache it.
 * Returns a Promise that resolves to the loaded model.
 * Multiple callers get the same model via callback queuing.
 */
export async function loadModel(onProgress = null) {
  if (_model) return _model;

  if (_modelLoading) {
    return new Promise((resolve) => {
      _modelLoadCallbacks.push(resolve);
    });
  }

  _modelLoading = true;
  if (onProgress) onProgress(0.1, 'Initializing TensorFlow.js backend...');

  try {
    // Use WebGL backend for GPU acceleration when available
    await tf.setBackend('webgl');
    await tf.ready();
    if (onProgress) onProgress(0.3, 'TF.js backend ready. Loading COCO-SSD model...');

    _model = await cocoSsd.load({
      base: 'mobilenet_v2',  // Fastest variant — good for real-time on CPU
    });

    if (onProgress) onProgress(1.0, 'COCO-SSD Model LOADED — Real AI detection active');

    // Resolve all pending callers
    _modelLoadCallbacks.forEach(cb => cb(_model));
    _modelLoadCallbacks = [];
    _modelLoading = false;

    console.log('[TF.js] COCO-SSD model loaded successfully. Backend:', tf.getBackend());
    return _model;

  } catch (err) {
    _modelLoading = false;
    _modelLoadCallbacks = [];
    console.error('[TF.js] Failed to load COCO-SSD model:', err);
    throw err;
  }
}

/**
 * detectFrame() — Run inference on a single video/canvas frame.
 * 
 * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source - Media element
 * @param {number} minConfidence - Minimum confidence threshold (0-1), default 0.35
 * @returns {Promise<Array>} Array of normalized detection objects
 */
export async function detectFrame(source, minConfidence = 0.35) {
  if (!_model) throw new Error('Model not loaded. Call loadModel() first.');
  if (!source) return [];

  // Check video has content
  if (source.tagName === 'VIDEO' && (source.readyState < 2 || source.videoWidth === 0)) {
    return [];
  }

  try {
    const predictions = await _model.detect(source, 10, minConfidence);

    const frameW = source.videoWidth || source.width || source.offsetWidth || 640;
    const frameH = source.videoHeight || source.height || source.offsetHeight || 480;

    return predictions.map(pred => {
      const [bx, by, bw, bh] = pred.bbox;
      const confidence = Math.round(pred.score * 100);
      const cx = bx + bw / 2;
      const cy = by + bh / 2;
      const area = (bw * bh) / (frameW * frameH); // Normalized area [0,1]
      const classInfo = THREAT_CLASSES[pred.class] || { module: 'GENERAL', baseRisk: 30, label: pred.class.toUpperCase() };

      return {
        class: pred.class,
        label: classInfo.label,
        confidence,
        module: classInfo.module,
        baseRisk: classInfo.baseRisk,
        // Bbox in pixel coordinates
        x: bx, y: by, w: bw, h: bh,
        // Centroid (for velocity tracking)
        cx, cy,
        // Normalized bbox for canvas drawing (0-100 percent)
        xPct: (bx / frameW) * 100,
        yPct: (by / frameH) * 100,
        wPct: (bw / frameW) * 100,
        hPct: (bh / frameH) * 100,
        // Area fraction (for proximity estimation)
        areaPct: area * 100,
        frameW, frameH,
      };
    });

  } catch (err) {
    console.warn('[TF.js] Inference error:', err.message);
    return [];
  }
}

/**
 * estimateFuzzyInputs() — Derive fuzzy engine inputs from real TF.js detection output.
 * 
 * This is the bridge between computer vision and risk scoring.
 * 
 * @param {Array} detections - Current frame detections from detectFrame()
 * @param {Array} prevDetections - Previous frame detections (for velocity)
 * @returns {Object} { velocity, proximity, visibility } for fuzzy engine
 */
export function estimateFuzzyInputs(detections, prevDetections = []) {
  if (!detections || detections.length === 0) {
    return { velocity: 0, proximity: 500, visibility: 100 };
  }

  // Find highest-risk detection
  const primary = detections.reduce((best, d) => {
    const score = d.baseRisk * (d.confidence / 100);
    const bestScore = best.baseRisk * (best.confidence / 100);
    return score > bestScore ? d : best;
  }, detections[0]);

  // ── PROXIMITY: bbox area → distance estimate ──────────────────
  // Larger bounding box = object is closer to camera
  // areaPct: 0 (far) to 100 (fills frame)
  // Map to proximity: 0m (touching) to 500m (far away)
  const proximity = Math.max(0, 500 - primary.areaPct * 25);

  // ── VELOCITY: centroid displacement between frames ────────────
  // Find the matching detection from previous frame by class
  const prev = prevDetections.find(p => p.class === primary.class);
  let velocity = 0;
  if (prev && primary.frameW > 0) {
    const dx = primary.cx - prev.cx;
    const dy = primary.cy - prev.cy;
    const pixelDisp = Math.sqrt(dx * dx + dy * dy);
    // Scale: 100px/frame ≈ 70km/h (approximate for typical CCTV)
    velocity = Math.min(100, (pixelDisp / primary.frameW) * 700);
  }

  // ── VISIBILITY: confidence score directly maps to visibility ──
  // Low confidence = poor visibility / occlusion / dark conditions
  const visibility = primary.confidence;

  return {
    velocity: Math.round(velocity * 10) / 10,
    proximity: Math.round(proximity * 10) / 10,
    visibility: Math.round(visibility * 10) / 10,
    primaryClass: primary.class,
    primaryLabel: primary.label,
    primaryModule: primary.module,
    confidence: primary.confidence,
  };
}

/**
 * drawDetections() — Render real TF.js detection bboxes on a canvas.
 * 
 * Maintains the military-grade visual style from v1 (corner brackets, labels, risk bars)
 * but now draws data from REAL model output.
 * 
 * @param {HTMLCanvasElement} canvas
 * @param {Array} detections - From detectFrame()
 * @param {number} riskScore - From fuzzy engine (0-100)
 * @param {number} tick - Animation tick for effects
 */
export function drawDetections(canvas, detections, riskScore = 0, tick = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Subtle grid overlay
  ctx.strokeStyle = 'rgba(34,197,94,0.04)';
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx < W; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 60) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Draw each detection
  detections.forEach((det, idx) => {
    // Map bbox from original frame coordinates to canvas coordinates
    const scaleX = W / (det.frameW || W);
    const scaleY = H / (det.frameH || H);
    const x = det.x * scaleX;
    const y = det.y * scaleY;
    const w = det.w * scaleX;
    const h = det.h * scaleY;

    const risk = Math.min(100, det.baseRisk * (det.confidence / 100));
    const color = risk > 70 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#22c55e';
    const rgbStr = risk > 70 ? '239,68,68' : risk > 40 ? '245,158,11' : '34,197,94';

    // Glow zone
    const gradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h));
    gradient.addColorStop(0, `rgba(${rgbStr}, 0.08)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - w * 0.3, y - h * 0.3, w * 1.6, h * 1.6);

    // Main bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Corner brackets (military style)
    const cl = Math.min(w, h) * 0.22;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cl); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h - cl); ctx.lineTo(x, y + h); ctx.lineTo(x + cl, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();

    // Label badge
    const label = `${det.label || det.class.toUpperCase()} ${det.confidence}%`;
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    const textW = ctx.measureText(label).width + 10;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 20, textW, 18);
    ctx.fillStyle = risk > 70 ? '#fff' : '#000';
    ctx.fillText(label, x + 5, y - 6);

    // Risk bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y + h + 4, w, 5);
    ctx.fillStyle = color;
    ctx.fillRect(x, y + h + 4, w * (risk / 100), 5);

    // Target ID
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillStyle = `rgba(${rgbStr}, 0.7)`;
    ctx.fillText(`TGT-${String(idx + 1).padStart(2, '0')} | ${det.module}`, x, y + h + 18);

    // "REAL AI" badge for first detection
    if (idx === 0) {
      ctx.font = 'bold 9px "Share Tech Mono", monospace';
      ctx.fillStyle = `rgba(${rgbStr}, ${0.6 + Math.sin(tick * 0.15) * 0.2})`;
      ctx.fillText('● REAL COCO-SSD INFERENCE', x, y - 28);
    }
  });

  // Scan line effect
  const scanY = (tick * 3) % H;
  ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
  ctx.fillRect(0, scanY, W, 3);

  // Crosshairs
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);

  // Coordinates + model info
  ctx.font = '9px "Share Tech Mono", monospace';
  ctx.fillStyle = 'rgba(34,197,94,0.4)';
  ctx.fillText(
    `N23°37'12" E85°16'47" | TF.js COCO-SSD | MOBILENET_V2 | ${detections.length} OBJECT(S)`,
    8, H - 8
  );
}

/**
 * isModelLoaded() — Check if the COCO-SSD model has been loaded.
 */
export function isModelLoaded() {
  return _model !== null;
}

/**
 * getModelInfo() — Return info about the loaded model for display.
 */
export function getModelInfo() {
  return {
    loaded: _model !== null,
    backend: tf.getBackend(),
    model: 'COCO-SSD MobileNetV2',
    classes: 80,
    framework: `TensorFlow.js v${tf.version.tfjs}`,
  };
}
