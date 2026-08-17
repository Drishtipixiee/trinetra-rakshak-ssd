// ═══════════════════════════════════════════════════
//  REAL MEDIA FEEDS — Direct CDN URLs (CORS-safe)
//  Trinetra Rakshak 2.0
// ═══════════════════════════════════════════════════

// Direct Wikimedia Commons CDN endpoints (no redirect, CORS-safe)
// All videos are Creative Commons / Public Domain
export const REAL_MEDIA = {
  // Indian Railways freight locomotive footage
  borderCctv:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f9/FBI_St._Louis%3B_Hate_Crime_Surveillance_Footage.webm/FBI_St._Louis%3B_Hate_Crime_Surveillance_Footage.webm.480p.webm',

  // Security / perimeter checkpoint footage
  checkpointCctv:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3b/Chelyabinsk_meteor_security_camera_footage%2C_Yekaterinburg.webm/Chelyabinsk_meteor_security_camera_footage%2C_Yekaterinburg.webm.480p.webm',

  // Indian Railways - WAG9 electric locomotive (direct CDN)
  railwayIndia:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9a/WAG9_and_WAG5_electric_locomotives_with_freight_trains_and_WDM2A_diesel_bankers_-_Indian_Railways.webm/WAG9_and_WAG5_electric_locomotives_with_freight_trains_and_WDM2A_diesel_bankers_-_Indian_Railways.webm.480p.webm',

  // Train arriving at Aurangabad station
  railwayPlatform:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e7/Train_is_arriving_to_Aurangabad_Railway_Station%2C_Aurangabad%2C_India.webm/Train_is_arriving_to_Aurangabad_Railway_Station%2C_Aurangabad%2C_India.webm.480p.webm',

  // Narrow gauge railway — Gwalior to Sheopur
  railwayCorridor:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/26/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm.480p.webm',

  // Wildlife corridor footage (bear surveillance camera)
  wildlifeCorridor:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f4/Surveillance_camera_captures_bear_in_Franklin_County_for_first_time_in_nearly_20_years.webm/Surveillance_camera_captures_bear_in_Franklin_County_for_first_time_in_nearly_20_years.webm.480p.webm',

  // Aerial footage — India (mining/aerial recon simulation)
  miningAerial:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b8/A_Spiritual_Journey_-_The_India_100.webm/A_Spiritual_Journey_-_The_India_100.webm.480p.webm',

  // Night cityscape (mining night surveillance)
  miningNight:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/45/Night_landscape_of_Bhopal_city.webm/Night_landscape_of_Bhopal_city.webm.480p.webm',
};

// Backup URLs (fallbacks when primary fails)
export const REAL_MEDIA_BACKUP = {
  borderCctv: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3b/Chelyabinsk_meteor_security_camera_footage%2C_Yekaterinburg.webm/Chelyabinsk_meteor_security_camera_footage%2C_Yekaterinburg.webm.360p.webm',
  checkpointCctv: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3b/Chelyabinsk_meteor_security_camera_footage%2C_Yekaterinburg.webm/Chelyabinsk_meteor_security_camera_footage%2C_Yekaterinburg.webm.360p.webm',
  railwayIndia: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/26/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm.360p.webm',
  railwayPlatform: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/26/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm.360p.webm',
  railwayCorridor: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/26/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm/Narrow_gauge_railway_line_Gwalior_to_Sheopur.webm.360p.webm',
  wildlifeCorridor: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f4/Surveillance_camera_captures_bear_in_Franklin_County_for_first_time_in_nearly_20_years.webm/Surveillance_camera_captures_bear_in_Franklin_County_for_first_time_in_nearly_20_years.webm.360p.webm',
  miningAerial: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/45/Night_landscape_of_Bhopal_city.webm/Night_landscape_of_Bhopal_city.webm.360p.webm',
  miningNight: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/45/Night_landscape_of_Bhopal_city.webm/Night_landscape_of_Bhopal_city.webm.360p.webm',
};

export const MEDIA_CREDITS = {
  commons: 'Real public-domain / Creative Commons footage via Wikimedia Commons CDN',
  maps: 'Esri World Imagery and OpenStreetMap tiles for live GIS context',
};
