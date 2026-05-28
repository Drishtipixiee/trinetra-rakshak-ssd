import re

with open('backend/api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

NEW_HTML = '''ADMIN_DB_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Trinetra DB Viewer (Vercel)</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0b1121; color: #f8fafc; padding: 20px; }
    h1, h2 { color: #00b4d8; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #1a2035; }
    th { background: #00AEEF; color: #fff; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #334155; }
    tr:hover { background: #2a344a; }
    .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .demo-note { background: #334155; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; border-left: 4px solid #f59e0b; }
    .action-btn { background: #00AEEF; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px; }
    .action-btn:hover { background: #0096cc; }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>🛡️ Trinetra Rakshak - Master Database Viewer</h1>
      <div>
          <button class="action-btn" onclick="exportJSON()">📥 Export JSON</button>
          <button class="action-btn" onclick="sendTestAlert()">📧 Send Test Alert</button>
      </div>
  </div>
  
  <div id="action-result" style="color: #00D4AA; font-weight: bold; margin-bottom: 15px;"></div>

  <h2>Registered Personnel</h2>
  <table>
    <tr><th>ID</th><th>Officer ID</th><th>Role</th><th>Password Hash (Scrypt)</th></tr>
    {% for u in users %}
    <tr>
      <td>{{ u.id }}</td>
      <td><b>{{ u.username }}</b></td>
      <td>{{ u.role }}</td>
      <td style='font-family: monospace; font-size: 11px; color: #94a3b8;'>{{ u.password_hash }}</td>
    </tr>
    {% else %}
    <tr><td colspan="4" style="text-align:center; padding: 20px;">No personnel registered</td></tr>
    {% endfor %}
  </table>

  <h2>Audit Trail (Recent Logins)</h2>
  <table>
    <tr><th>ID</th><th>Officer ID</th><th>IP</th><th>Timestamp</th></tr>
    {% for a in audits %}
    <tr>
      <td>{{ a.id }}</td>
      <td>{{ a.officer_id }}</td>
      <td>{{ a.ip }}</td>
      <td>{{ a.timestamp.strftime('%Y-%m-%d %H:%M:%S') if a.timestamp else 'N/A' }}</td>
    </tr>
    {% else %}
    <tr><td colspan="4" style="text-align:center; padding: 20px;">No recent logins</td></tr>
    {% endfor %}
  </table>

  <h2>Live Incident Logs</h2>
  <table>
    <tr><th>ID</th><th>Timestamp</th><th>Type</th><th>Sector</th><th>Severity</th></tr>
    {% for inc in incidents %}
    <tr>
      <td>INC-{{ 1000 + inc.id }}</td>
      <td>{{ inc.timestamp.strftime('%Y-%m-%d %H:%M:%S.%f') if inc.timestamp else 'N/A' }}</td>
      <td>{{ inc.type }}</td>
      <td>{{ inc.sector }}</td>
      <td>{{ inc.severity }}</td>
    </tr>
    {% else %}
    <tr><td colspan="5" style="text-align:center; padding: 20px;">No incidents recorded</td></tr>
    {% endfor %}
  </table>
  
  <h2>Alert Recipients</h2>
  <table>
    <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th></tr>
    {% for r in recipients %}
    <tr>
      <td>{{ r.id }}</td>
      <td>{{ r.name }}</td>
      <td>{{ r.email }}</td>
      <td>{{ r.role }}</td>
      <td>{{ r.phone or '—' }}</td>
      <td>{{ 'ACTIVE' if r.active else 'INACTIVE' }}</td>
    </tr>
    {% else %}
    <tr><td colspan="6" style="text-align:center; padding: 20px;">No alert recipients configured</td></tr>
    {% endfor %}
  </table>

  <script>
    async function showResult(msg, ok) {
      const el = document.getElementById('action-result');
      el.style.color = ok ? '#00D4AA' : '#FF3B30';
      el.textContent = msg;
      setTimeout(() => { el.textContent = ''; }, 5000);
    }
    async function exportJSON() {
      window.open('/api/export-data', '_blank');
    }
    async function sendTestAlert() {
      const res = await fetch('/api/send-test-alert', { method: 'POST' });
      const data = await res.json();
      showResult(data.message, data.status === 'success');
    }
  </script>
</body>
</html>"""'''

pattern = r'ADMIN_DB_HTML = """(.*?)</html>"""'
new_content = re.sub(pattern, NEW_HTML, content, flags=re.DOTALL)

with open('backend/api/index.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("Successfully replaced ADMIN_DB_HTML")
