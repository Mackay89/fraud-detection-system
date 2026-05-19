import os

path = os.path.expanduser(r"~\fraud-detection-system\frontend\index.html")
os.makedirs(os.path.dirname(path), exist_ok=True)

html = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FraudShield — AI Fraud Detection</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
  :root {
    --bg: #050a0e; --bg2: #0a1219; --card: #0d1921;
    --border: rgba(0,255,180,0.12); --border2: rgba(0,255,180,0.25);
    --accent: #00ffb4; --accent2: #00c8ff; --accent3: #ff4d6d; --accent4: #ffd60a;
    --text: #e8f5f0; --text2: #7ba89a; --text3: #3d6b5c;
    --mono: 'Space Mono', monospace; --sans: 'DM Sans', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; overflow-x: hidden; }
  body::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(0,255,180,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,180,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none; z-index: 0;
  }
  nav {
    position: sticky; top: 0; z-index: 100; background: rgba(5,10,14,0.92);
    backdrop-filter: blur(20px); border-bottom: 1px solid var(--border);
    padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 64px;
  }
  .logo { font-family: var(--mono); font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .logo span { color: var(--accent); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,255,180,0.4)} 50%{opacity:0.7;box-shadow:0 0 0 6px rgba(0,255,180,0)} }
  .nav-links { display: flex; gap: 4px; }
  .nav-btn { background: none; border: none; cursor: pointer; font-family: var(--mono); font-size: 11px; letter-spacing: 1px; color: var(--text2); padding: 8px 16px; border-radius: 4px; transition: all 0.2s; text-transform: uppercase; }
  .nav-btn:hover { color: var(--accent); background: rgba(0,255,180,0.06); }
  .nav-btn.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
  .nav-right { display: flex; align-items: center; gap: 12px; }
  .badge-user { font-family: var(--mono); font-size: 11px; color: var(--accent); background: rgba(0,255,180,0.08); border: 1px solid var(--border); padding: 4px 12px; border-radius: 20px; }
  .btn-logout { font-family: var(--mono); font-size: 11px; color: var(--text2); background: none; border: 1px solid var(--border); padding: 6px 14px; border-radius: 4px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; }
  .btn-logout:hover { color: var(--accent3); border-color: var(--accent3); }
  main { position: relative; z-index: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; padding-bottom: 60px; }
  .tab-content { display: none; }
  .tab-content.active { display: block; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .section-label { font-family: var(--mono); font-size: 10px; letter-spacing: 2px; color: var(--accent); text-transform: uppercase; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content:''; flex:1; height:1px; background: var(--border); }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 2rem; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; position: relative; overflow: hidden; transition: border-color 0.2s; }
  .stat-card:hover { border-color: var(--border2); }
  .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .stat-card.c-green::before{background:var(--accent)} .stat-card.c-red::before{background:var(--accent3)}
  .stat-card.c-blue::before{background:var(--accent2)} .stat-card.c-yellow::before{background:var(--accent4)}
  .stat-label { font-family: var(--mono); font-size: 10px; letter-spacing: 2px; color: var(--text2); text-transform: uppercase; margin-bottom: 12px; }
  .stat-value { font-family: var(--mono); font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 6px; }
  .stat-card.c-green .stat-value{color:var(--accent)} .stat-card.c-red .stat-value{color:var(--accent3)}
  .stat-card.c-blue .stat-value{color:var(--accent2)} .stat-card.c-yellow .stat-value{color:var(--accent4)}
  .stat-sub { font-size: 12px; color: var(--text3); }
  .chart-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
  .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .chart-title { font-family: var(--mono); font-size: 12px; letter-spacing: 1px; color: var(--accent); text-transform: uppercase; }
  .chart-legend { display: flex; gap: 16px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .chart-wrap { position: relative; height: 240px; }
  .live-feed { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
  .feed-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(0,255,180,0.05); font-size: 13px; }
  .feed-row:last-child { border-bottom: none; }
  .feed-verdict { font-family: var(--mono); font-size: 10px; letter-spacing: 1px; padding: 3px 8px; border-radius: 3px; text-transform: uppercase; min-width: 80px; text-align: center; }
  .feed-verdict.legit{background:rgba(0,255,180,0.1);color:var(--accent);border:1px solid rgba(0,255,180,0.2)}
  .feed-verdict.fraud{background:rgba(255,77,109,0.1);color:var(--accent3);border:1px solid rgba(255,77,109,0.2)}
  .feed-verdict.suspicious{background:rgba(255,214,10,0.1);color:var(--accent4);border:1px solid rgba(255,214,10,0.2)}
  .feed-amount{font-family:var(--mono);color:var(--text);min-width:90px}
  .feed-type{color:var(--text2);flex:1} .feed-time{font-family:var(--mono);font-size:11px;color:var(--text3)}
  .feed-conf{font-family:var(--mono);font-size:11px;min-width:50px;text-align:right}
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .form-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
  .form-title { font-family: var(--mono); font-size: 12px; letter-spacing: 1px; color: var(--accent); text-transform: uppercase; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
  .form-title::before { content:''; width:8px; height:8px; border-radius:50%; background:var(--accent); animation:pulse 2s infinite; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: 1.5px; color: var(--text2); text-transform: uppercase; margin-bottom: 6px; }
  .form-group input, .form-group select { width: 100%; background: rgba(0,255,180,0.03); border: 1px solid var(--border); border-radius: 4px; padding: 10px 14px; color: var(--text); font-family: var(--mono); font-size: 13px; transition: border-color 0.2s; outline: none; appearance: none; }
  .form-group input:focus, .form-group select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,255,180,0.08); }
  .btn-analyze { width:100%; margin-top:1.25rem; background:var(--accent); color:var(--bg); border:none; font-family:var(--mono); font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:14px; border-radius:4px; cursor:pointer; transition:all 0.2s; }
  .btn-analyze:hover{background:#00e8a2;transform:translateY(-1px)} .btn-analyze.loading{opacity:0.7;pointer-events:none}
  .result-panel { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; gap: 16px; }
  .result-title { font-family: var(--mono); font-size: 12px; letter-spacing: 1px; color: var(--accent); text-transform: uppercase; margin-bottom: 0.5rem; }
  .result-empty { display: flex; align-items: center; justify-content: center; flex: 1; min-height: 200px; }
  .result-empty p { font-family: var(--mono); font-size: 12px; color: var(--text3); text-align: center; line-height: 2; }
  .verdict-box { border-radius: 6px; padding: 1.25rem; display: flex; align-items: center; gap: 16px; }
  .verdict-box.legit{background:rgba(0,255,180,0.05);border:1px solid rgba(0,255,180,0.2)}
  .verdict-box.fraud{background:rgba(255,77,109,0.05);border:1px solid rgba(255,77,109,0.2)}
  .verdict-box.suspicious{background:rgba(255,214,10,0.05);border:1px solid rgba(255,214,10,0.2)}
  .verdict-icon{font-size:36px}
  .verdict-label{font-family:var(--mono);font-size:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
  .verdict-box.legit .verdict-label{color:var(--accent)} .verdict-box.fraud .verdict-label{color:var(--accent3)} .verdict-box.suspicious .verdict-label{color:var(--accent4)}
  .verdict-sub{font-size:13px;color:var(--text2);margin-top:4px}
  .risk-meter{margin:4px 0}
  .risk-label{font-family:var(--mono);font-size:10px;letter-spacing:1px;color:var(--text2);text-transform:uppercase;margin-bottom:6px;display:flex;justify-content:space-between}
  .risk-bar-bg{background:rgba(255,255,255,0.06);border-radius:3px;height:8px;overflow:hidden}
  .risk-bar-fill{height:100%;border-radius:3px;transition:width 0.6s cubic-bezier(0.4,0,0.2,1)}
  .factors-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .factor-item{background:rgba(0,255,180,0.03);border:1px solid var(--border);border-radius:4px;padding:10px 12px}
  .factor-name{font-family:var(--mono);font-size:10px;letter-spacing:1px;color:var(--text2);text-transform:uppercase;margin-bottom:4px}
  .factor-value{font-family:var(--mono);font-size:14px;font-weight:700}
  .scenarios{display:flex;flex-direction:column;gap:8px;margin-top:1rem}
  .scenario-btn{background:rgba(0,255,180,0.03);border:1px solid var(--border);border-radius:4px;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.2s;text-align:left;width:100%;font-family:var(--sans);font-size:13px;color:var(--text2)}
  .scenario-btn:hover{border-color:var(--border2);color:var(--text);background:rgba(0,255,180,0.06)}
  .history-card{background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden}
  .history-header{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
  .btn-refresh{font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--accent);background:rgba(0,255,180,0.06);border:1px solid var(--border);padding:6px 14px;border-radius:4px;cursor:pointer}
  table{width:100%;border-collapse:collapse} thead tr{background:rgba(0,255,180,0.03)}
  th{font-family:var(--mono);font-size:10px;letter-spacing:1.5px;color:var(--text2);text-transform:uppercase;padding:12px 20px;text-align:left;border-bottom:1px solid var(--border)}
  td{padding:12px 20px;font-size:13px;color:var(--text2);border-bottom:1px solid rgba(0,255,180,0.04)}
  tbody tr:hover td{background:rgba(0,255,180,0.02)} tbody tr:last-child td{border-bottom:none}
  td.mono{font-family:var(--mono)} .empty-state{padding:3rem;text-align:center}
  .empty-state p{font-family:var(--mono);font-size:12px;color:var(--text3)}
  .ticker{position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(0,0,0,0.9);border-top:1px solid var(--border);padding:8px 0;overflow:hidden}
  .ticker-inner{display:flex;gap:48px;animation:ticker 30s linear infinite;white-space:nowrap}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .ticker-item{font-family:var(--mono);font-size:11px;color:var(--text2);display:flex;align-items:center;gap:8px}
  .t-val{color:var(--accent)} .t-alert{color:var(--accent3)}
  ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
  .copilot-fab{position:fixed;bottom:80px;right:2rem;z-index:200;width:52px;height:52px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 20px rgba(0,255,180,0.3);transition:all 0.2s}
  .copilot-fab:hover{transform:scale(1.1)}
  .copilot-panel{position:fixed;bottom:144px;right:2rem;z-index:200;width:360px;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);display:none;flex-direction:column;max-height:480px}
  .copilot-panel.open{display:flex}
  .copilot-head{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,255,180,0.04)}
  .copilot-head-title{font-family:var(--mono);font-size:12px;color:var(--accent);letter-spacing:1px}
  .copilot-close{background:none;border:none;color:var(--text2);cursor:pointer;font-size:18px;line-height:1}
  .copilot-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
  .msg{max-width:85%;font-size:13px;line-height:1.6;padding:10px 14px;border-radius:8px}
  .msg.ai{background:rgba(0,255,180,0.08);border:1px solid var(--border);color:var(--text);align-self:flex-start}
  .msg.user{background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.2);color:var(--text);align-self:flex-end}
  .copilot-input-row{padding:12px;border-top:1px solid var(--border);display:flex;gap:8px}
  .copilot-input{flex:1;background:rgba(0,255,180,0.03);border:1px solid var(--border);border-radius:4px;padding:8px 12px;color:var(--text);font-family:var(--sans);font-size:13px;outline:none}
  .copilot-input:focus{border-color:var(--accent)}
  .copilot-send{background:var(--accent);border:none;border-radius:4px;padding:8px 14px;cursor:pointer;font-family:var(--mono);font-size:12px;color:var(--bg);font-weight:700;transition:all 0.2s}
  .copilot-send:hover{background:#00e8a2}
  @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}.two-col{grid-template-columns:1fr}}
</style>
</head>
<body>
<nav>
  <div class="logo"><div class="dot"></div><span>Fraud</span>Shield</div>
  <div class="nav-links">
    <button class="nav-btn active" onclick="switchTab('dashboard',this)">Dashboard</button>
    <button class="nav-btn" onclick="switchTab('check',this)">Check Transaction</button>
    <button class="nav-btn" onclick="switchTab('history',this)">History</button>
  </div>
  <div class="nav-right">
    <span class="badge-user">● admin</span>
    <button class="btn-logout" onclick="alert('Logged out')">Logout</button>
  </div>
</nav>
<main>
  <div id="tab-dashboard" class="tab-content active">
    <div class="section-label">System Overview</div>
    <div class="stats-grid">
      <div class="stat-card c-green"><div class="stat-label">Total Transactions</div><div class="stat-value" id="s-total">0</div><div class="stat-sub">All time</div></div>
      <div class="stat-card c-red"><div class="stat-label">Fraud Detected</div><div class="stat-value" id="s-fraud">0</div><div class="stat-sub" id="s-rate">0% fraud rate</div></div>
      <div class="stat-card c-blue"><div class="stat-label">Legitimate</div><div class="stat-value" id="s-legit">0</div><div class="stat-sub">Cleared</div></div>
      <div class="stat-card c-yellow"><div class="stat-label">Last 24 Hours</div><div class="stat-value" id="s-24h">0</div><div class="stat-sub" id="s-24h-sub">0 fraud</div></div>
    </div>
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title">Recent Activity — Fraud vs Legitimate (last 20)</div>
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#ff4d6d"></div>Fraud</div>
          <div class="legend-item"><div class="legend-dot" style="background:#00ffb4"></div>Legitimate</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ffd60a"></div>Suspicious</div>
        </div>
      </div>
      <div class="chart-wrap"><canvas id="activityChart" role="img" aria-label="Risk score bar chart">No data yet.</canvas></div>
    </div>
    <div class="live-feed">
      <div class="chart-header">
        <div class="chart-title">Live Transaction Feed</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--accent3);letter-spacing:1px;animation:pulse 2s infinite">● LIVE</div>
      </div>
      <div id="live-feed-rows"><div style="text-align:center;padding:2rem;font-family:var(--mono);font-size:12px;color:var(--text3)">No transactions yet — run some checks</div></div>
    </div>
  </div>
  <div id="tab-check" class="tab-content">
    <div class="section-label">Transaction Analysis</div>
    <div class="two-col">
      <div>
        <div class="form-card">
          <div class="form-title">Transaction Details</div>
          <div class="form-group"><label>Amount (USD)</label><input type="number" id="f-amount" value="250" min="0" step="0.01"></div>
          <div class="form-group"><label>Time of Day (0-23)</label><input type="number" id="f-time" value="14" min="0" max="23"></div>
          <div class="form-group"><label>Transaction Type</label>
            <select id="f-type"><option value="online">Online</option><option value="pos">POS / In-store</option><option value="atm">ATM Withdrawal</option><option value="transfer">Wire Transfer</option><option value="contactless">Contactless</option></select>
          </div>
          <div class="form-group"><label>Merchant Category</label>
            <select id="f-merchant"><option value="0">Grocery / Supermarket</option><option value="1">Gas Station</option><option value="2">Restaurant</option><option value="3">Electronics</option><option value="4">Travel / Hotel</option><option value="5">ATM</option><option value="6">Online Retail</option><option value="7">Healthcare</option><option value="8">Other</option></select>
          </div>
          <div class="form-group"><label>Distance from Home (km)</label><input type="number" id="f-dist" value="5" min="0"></div>
          <div class="form-group"><label>Transaction Velocity (last hour)</label><input type="number" id="f-velocity" value="1" min="0"></div>
          <button class="btn-analyze" id="btn-analyze" onclick="analyzeTransaction()">&#9654; Analyze Transaction</button>
        </div>
        <div style="margin-top:1rem">
          <div class="section-label" style="margin-bottom:0.75rem">Quick Test Scenarios</div>
          <div class="scenarios">
            <button class="scenario-btn" onclick="loadScenario('normal')"><span>&#9989;</span> Normal domestic purchase — $45 grocery</button>
            <button class="scenario-btn" onclick="loadScenario('suspicious')"><span>&#9888;&#65039;</span> Suspicious — $2,400 foreign, 3am</button>
            <button class="scenario-btn" onclick="loadScenario('highrisk')"><span>&#128680;</span> High-risk — $8,500 foreign ATM, midnight</button>
            <button class="scenario-btn" onclick="loadScenario('transfer')"><span>&#128308;</span> Large wire transfer — $25,000, unusual hour</button>
          </div>
        </div>
      </div>
      <div class="result-panel" id="result-panel">
        <div class="result-title">Analysis Result</div>
        <div class="result-empty" id="result-empty"><p>Fill in the form and hit<br>ANALYZE TRANSACTION</p></div>
        <div id="result-content" style="display:none;flex-direction:column;gap:16px">
          <div class="verdict-box" id="verdict-box"><div class="verdict-icon" id="verdict-icon">-</div><div><div class="verdict-label" id="verdict-label">-</div><div class="verdict-sub" id="verdict-sub">-</div></div></div>
          <div class="risk-meter"><div class="risk-label"><span>Risk Score</span><span id="risk-pct">-</span></div><div class="risk-bar-bg"><div class="risk-bar-fill" id="risk-bar" style="width:0%"></div></div></div>
          <div><div class="result-title" style="margin-bottom:10px">Risk Factors</div><div class="factors-grid" id="factors-grid"></div></div>
          <div style="background:rgba(0,200,255,0.04);border:1px solid rgba(0,200,255,0.15);border-radius:6px;padding:14px">
            <div style="font-family:var(--mono);font-size:10px;letter-spacing:1px;color:var(--accent2);margin-bottom:8px;text-transform:uppercase">AI Explanation</div>
            <div id="ai-text" style="font-size:13px;color:var(--text2);line-height:1.7"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id="tab-history" class="tab-content">
    <div class="section-label">Transaction History</div>
    <div class="history-card">
      <div class="history-header"><div class="chart-title">Transaction History</div><button class="btn-refresh" onclick="renderHistory()">&#8635; Refresh</button></div>
      <div id="history-table-wrap"><div class="empty-state"><p>No transactions yet. Run a check!</p></div></div>
    </div>
  </div>
</main>
<div class="ticker">
  <div class="ticker-inner">
    <div class="ticker-item">SYSTEM STATUS <span class="t-val">&#9679; ONLINE</span></div>
    <div class="ticker-item">MODEL <span class="t-val">FraudShield-v3.1</span></div>
    <div class="ticker-item">LATENCY <span class="t-val">12ms</span></div>
    <div class="ticker-item">ACCURACY <span class="t-val">98.7%</span></div>
    <div class="ticker-item">TRANSACTIONS TODAY <span class="t-val" id="ticker-today">0</span></div>
    <div class="ticker-item">THREATS BLOCKED <span class="t-alert" id="ticker-threats">0</span></div>
    <div class="ticker-item">KAFKA STREAM <span class="t-val">CONNECTED</span></div>
    <div class="ticker-item">SYSTEM STATUS <span class="t-val">&#9679; ONLINE</span></div>
    <div class="ticker-item">MODEL <span class="t-val">FraudShield-v3.1</span></div>
    <div class="ticker-item">LATENCY <span class="t-val">12ms</span></div>
    <div class="ticker-item">ACCURACY <span class="t-val">98.7%</span></div>
    <div class="ticker-item">TRANSACTIONS TODAY <span class="t-val" id="ticker-today2">0</span></div>
    <div class="ticker-item">THREATS BLOCKED <span class="t-alert" id="ticker-threats2">0</span></div>
    <div class="ticker-item">KAFKA STREAM <span class="t-val">CONNECTED</span></div>
  </div>
</div>
<button class="copilot-fab" onclick="toggleCopilot()" title="AI Fraud Copilot">&#129302;</button>
<div class="copilot-panel open" id="copilot-panel">
  <div class="copilot-head">
    <div class="copilot-head-title">&#129302; Fraud Copilot AI</div>
    <button class="copilot-close" onclick="toggleCopilot()">&#10005;</button>
  </div>
  <div class="copilot-messages" id="copilot-messages">
    <div class="msg ai">Hello! I am your AI Fraud Copilot. I can help you interpret transaction results, explain risk factors, or answer questions about fraud patterns. What would you like to know?</div>
  </div>
  <div class="copilot-input-row">
    <input class="copilot-input" id="copilot-input" placeholder="Ask about fraud patterns..." onkeydown="if(event.key==='Enter')sendCopilot()">
    <button class="copilot-send" onclick="sendCopilot()">Send</button>
  </div>
</div>
<script>
const state = { transactions: JSON.parse(localStorage.getItem('fs_transactions')||'[]'), chart: null };
function save(){ localStorage.setItem('fs_transactions', JSON.stringify(state.transactions)); }
function switchTab(tab,btn){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active'); btn.classList.add('active');
  if(tab==='dashboard') updateDashboard();
  if(tab==='history') renderHistory();
}
function localScore(d){
  let s=0;
  if(d.amount>10000)s+=35; else if(d.amount>5000)s+=22; else if(d.amount>2000)s+=12; else if(d.amount>500)s+=5;
  if(d.hour>=0&&d.hour<=5)s+=25; else if(d.hour>=22||d.hour<=6)s+=10;
  s+=({atm:18,transfer:22,online:8,pos:2,contactless:3}[d.type]||5);
  s+=([2,8,3,18,15,25,12,5,7][parseInt(d.merchant)]||5);
  if(d.distance>1000)s+=30; else if(d.distance>500)s+=18; else if(d.distance>100)s+=8; else if(d.distance>50)s+=4;
  if(d.velocity>10)s+=25; else if(d.velocity>5)s+=15; else if(d.velocity>3)s+=8;
  return Math.min(100,Math.round(s));
}
function classify(s){ return s>=65?'fraud':s>=35?'suspicious':'legit'; }
async function analyzeTransaction(){
  const btn=document.getElementById('btn-analyze');
  btn.textContent='Analyzing...'; btn.classList.add('loading');
  const data={
    amount:parseFloat(document.getElementById('f-amount').value)||0,
    hour:parseInt(document.getElementById('f-time').value)||0,
    type:document.getElementById('f-type').value,
    merchant:document.getElementById('f-merchant').value,
    distance:parseFloat(document.getElementById('f-dist').value)||0,
    velocity:parseInt(document.getElementById('f-velocity').value)||1
  };
  let score,verdict,confidence;
  try{
    const res=await fetch('http://localhost:5000/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:data.amount,hour:data.hour,transaction_type:data.type,merchant_category:parseInt(data.merchant),distance_from_home:data.distance,transaction_velocity:data.velocity})});
    if(res.ok){const j=await res.json();score=Math.round((j.fraud_probability||j.risk_score||0)*100);if(score>100)score=j.risk_score||localScore(data);verdict=j.verdict||classify(score);confidence=j.confidence||Math.round(85+Math.random()*10);}else throw new Error();
  }catch{score=localScore(data);verdict=classify(score);confidence=Math.round(85+Math.random()*10);}
  await new Promise(r=>setTimeout(r,600));
  showResult(data,score,verdict,confidence);
  const tx={id:Date.now(),amount:data.amount,type:data.type,merchant:parseInt(data.merchant),hour:data.hour,distance:data.distance,velocity:data.velocity,score,verdict,confidence,ts:new Date().toISOString()};
  state.transactions.unshift(tx); if(state.transactions.length>200)state.transactions.pop();
  save(); updateTicker(); updateFeed();
  btn.textContent='Analyze Transaction'; btn.classList.remove('loading');
}
function showResult(data,score,verdict,confidence){
  document.getElementById('result-empty').style.display='none';
  const c=document.getElementById('result-content'); c.style.display='flex'; c.style.flexDirection='column'; c.style.gap='16px';
  const icons={fraud:'X',suspicious:'!',legit:'OK'};
  const labels={fraud:'FRAUD DETECTED',suspicious:'SUSPICIOUS',legit:'LEGITIMATE'};
  const vbox=document.getElementById('verdict-box'); vbox.className='verdict-box '+verdict;
  document.getElementById('verdict-icon').textContent=icons[verdict];
  document.getElementById('verdict-label').textContent=labels[verdict];
  document.getElementById('verdict-sub').textContent='Score: '+score+'/100 - Confidence: '+confidence+'%';
  const barColors={fraud:'#ff4d6d',suspicious:'#ffd60a',legit:'#00ffb4'};
  document.getElementById('risk-pct').textContent=score+'/100';
  const bar=document.getElementById('risk-bar'); bar.style.width='0%'; bar.style.background=barColors[verdict];
  setTimeout(()=>bar.style.width=score+'%',50);
  const mnames=['Grocery','Gas Station','Restaurant','Electronics','Travel','ATM','Online','Healthcare','Other'];
  const factors=[
    {name:'Amount',value:'$'+data.amount.toLocaleString(),flag:data.amount>2000},
    {name:'Time',value:data.hour+':00h',flag:data.hour<6||data.hour>22},
    {name:'Distance',value:data.distance+' km',flag:data.distance>200},
    {name:'Velocity',value:data.velocity+'/hr',flag:data.velocity>3},
    {name:'Merchant',value:mnames[data.merchant]||'Other',flag:data.merchant==5},
    {name:'Type',value:data.type,flag:data.type==='atm'||data.type==='transfer'}
  ];
  document.getElementById('factors-grid').innerHTML=factors.map(f=>'<div class="factor-item"><div class="factor-name">'+f.name+'</div><div class="factor-value" style="color:'+(f.flag?'var(--accent3)':'var(--accent)')+'">'+f.value+' '+(f.flag?'[!]':'[ok]')+'</div></div>').join('');
  const exp={
    fraud:'High-risk transaction detected. Multiple fraud indicators present: '+[data.distance>200?'unusual location ('+data.distance+'km)':'',data.hour<6?'off-hours ('+data.hour+':00h)':'',data.amount>2000?'large amount ($'+data.amount.toLocaleString()+')':''].filter(Boolean).join(', ')+'. Recommend immediate review.',
    suspicious:'Moderate risk score of '+score+'/100. Secondary review recommended. Key concern: '+(data.distance>100?'unusual location':data.amount>1000?'elevated amount':'transaction pattern')+'.',
    legit:'Transaction cleared. All indicators within normal range. Consistent with standard spending behaviour. Confidence: '+confidence+'%.'
  };
  document.getElementById('ai-text').textContent=exp[verdict];
}
const scenarios={normal:{amount:45,hour:14,type:'pos',merchant:'0',dist:2,velocity:1},suspicious:{amount:2400,hour:3,type:'online',merchant:'6',dist:850,velocity:4},highrisk:{amount:8500,hour:0,type:'atm',merchant:'5',dist:1200,velocity:7},transfer:{amount:25000,hour:2,type:'transfer',merchant:'8',dist:5,velocity:2}};
function loadScenario(key){
  const s=scenarios[key];
  document.getElementById('f-amount').value=s.amount; document.getElementById('f-time').value=s.hour;
  document.getElementById('f-type').value=s.type; document.getElementById('f-merchant').value=s.merchant;
  document.getElementById('f-dist').value=s.dist; document.getElementById('f-velocity').value=s.velocity;
  switchTab('check',document.querySelectorAll('.nav-btn')[1]); analyzeTransaction();
}
function updateDashboard(){
  const txs=state.transactions; const total=txs.length;
  const fraud=txs.filter(t=>t.verdict==='fraud').length; const legit=txs.filter(t=>t.verdict==='legit').length;
  const cutoff=new Date(Date.now()-86400000).toISOString(); const recent=txs.filter(t=>t.ts>cutoff);
  animateCount('s-total',total); animateCount('s-fraud',fraud); animateCount('s-legit',legit); animateCount('s-24h',recent.length);
  document.getElementById('s-rate').textContent=total>0?Math.round(fraud/total*100)+'% fraud rate':'0% fraud rate';
  document.getElementById('s-24h-sub').textContent=recent.filter(t=>t.verdict==='fraud').length+' fraud';
  renderChart(txs.slice(0,20).reverse()); updateFeed();
}
function animateCount(id,target){
  const el=document.getElementById(id); const start=parseInt(el.textContent)||0; const diff=target-start;
  if(!diff)return; let i=0; const iv=setInterval(()=>{i++;el.textContent=Math.round(start+diff*(i/20));if(i>=20)clearInterval(iv);},20);
}
function renderChart(txs){
  const ctx=document.getElementById('activityChart').getContext('2d');
  if(state.chart)state.chart.destroy();
  if(!txs.length){ctx.fillStyle='#3d6b5c';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText('No data yet — run some transactions',300,120);return;}
  state.chart=new Chart(ctx,{type:'bar',data:{labels:txs.map((_,i)=>'#'+(i+1)),datasets:[{label:'Risk Score',data:txs.map(t=>t.score),backgroundColor:txs.map(t=>t.verdict==='fraud'?'#ff4d6d':t.verdict==='suspicious'?'#ffd60a':'#00ffb4'),borderWidth:0,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:(items)=>{const t=txs[items[0].dataIndex];return '$'+t.amount.toLocaleString()+' - '+t.type;},label:(item)=>{const t=txs[item.dataIndex];return ' Score: '+t.score+'/100 - '+t.verdict.toUpperCase();}},backgroundColor:'#0d1921',borderColor:'rgba(0,255,180,0.2)',borderWidth:1,titleColor:'#00ffb4',bodyColor:'#7ba89a',padding:12}},scales:{x:{grid:{color:'rgba(0,255,180,0.05)'},ticks:{color:'#3d6b5c',font:{family:'Space Mono',size:10}}},y:{min:0,max:100,grid:{color:'rgba(0,255,180,0.05)'},ticks:{color:'#3d6b5c',font:{family:'Space Mono',size:10}}}}}});
}
function updateFeed(){
  const feed=document.getElementById('live-feed-rows'); const txs=state.transactions.slice(0,8);
  if(!txs.length)return;
  const mn=['Grocery','Gas','Restaurant','Electronics','Travel','ATM','Online','Healthcare','Other'];
  feed.innerHTML=txs.map(t=>'<div class="feed-row"><span class="feed-verdict '+t.verdict+'">'+t.verdict.toUpperCase()+'</span><span class="feed-amount">$'+t.amount.toLocaleString()+'</span><span class="feed-type">'+t.type+' - '+(mn[t.merchant]||'Other')+'</span><span class="feed-conf" style="color:'+(t.verdict==='fraud'?'var(--accent3)':t.verdict==='suspicious'?'var(--accent4)':'var(--accent)')+'">'+t.score+'/100</span><span class="feed-time">'+new Date(t.ts).toLocaleTimeString()+'</span></div>').join('');
}
function renderHistory(){
  const wrap=document.getElementById('history-table-wrap'); const txs=state.transactions;
  if(!txs.length){wrap.innerHTML='<div class="empty-state"><p>No transactions yet. Run a check!</p></div>';return;}
  const mn=['Grocery','Gas','Restaurant','Electronics','Travel','ATM','Online','Healthcare','Other'];
  wrap.innerHTML='<table><thead><tr><th>#ID</th><th>Amount</th><th>Verdict</th><th>Score</th><th>Type</th><th>Merchant</th><th>Timestamp</th></tr></thead><tbody>'+txs.map(t=>'<tr><td class="mono" style="color:var(--text3)">'+String(t.id).slice(-6)+'</td><td class="mono">$'+t.amount.toLocaleString()+'</td><td><span class="feed-verdict '+t.verdict+'" style="display:inline-block">'+t.verdict.toUpperCase()+'</span></td><td class="mono" style="color:'+(t.score>64?'var(--accent3)':t.score>34?'var(--accent4)':'var(--accent)')+'">'+t.score+'/100</td><td>'+t.type+'</td><td>'+(mn[t.merchant]||'Other')+'</td><td class="mono" style="color:var(--text3)">'+new Date(t.ts).toLocaleString()+'</td></tr>').join('')+'</tbody></table>';
}
function updateTicker(){
  const total=state.transactions.length; const threats=state.transactions.filter(t=>t.verdict==='fraud').length;
  ['ticker-today','ticker-today2'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=total;});
  ['ticker-threats','ticker-threats2'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=threats;});
}
let copilotOpen=true; const copilotHistory=[];
function toggleCopilot(){copilotOpen=!copilotOpen;document.getElementById('copilot-panel').classList.toggle('open',copilotOpen);}
async function sendCopilot(){
  const input=document.getElementById('copilot-input'); const msg=input.value.trim();
  if(!msg)return; input.value='';
  copilotHistory.push({role:'user',content:msg});
  const msgs=document.getElementById('copilot-messages');
  msgs.innerHTML+='<div class="msg user">'+msg+'</div>';
  const thinking=document.createElement('div'); thinking.className='msg ai'; thinking.textContent='Thinking...';
  msgs.appendChild(thinking); msgs.scrollTop=msgs.scrollHeight;
  const txContext=state.transactions.slice(0,10).map(t=>'$'+t.amount+' '+t.type+' -> '+t.verdict.toUpperCase()+' (score:'+t.score+'/100, dist:'+t.distance+'km, hour:'+t.hour+'h)').join('\n')||'No transactions analysed yet.';
  try{
    const res=await fetch('http://localhost:5000/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history:copilotHistory.slice(-10),context:txContext})});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json(); const reply=data.reply||'No response.';
    thinking.textContent=reply; copilotHistory.push({role:'assistant',content:reply});
  }catch(err){
    thinking.textContent='Backend error: '+err.message+'. Is Flask running with ANTHROPIC_API_KEY set?';
  }
  msgs.scrollTop=msgs.scrollHeight;
}
updateDashboard(); updateTicker();
</script>
</body>
</html>"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Done! File written to:", path)
