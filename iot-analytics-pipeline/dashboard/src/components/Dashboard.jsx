import React, { useEffect, useState, useRef, useCallback } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

const API = 'http://localhost:5000'

function useInterval(cb, ms) {
  const ref = useRef(cb)
  useEffect(() => { ref.current = cb }, [cb])
  useEffect(() => {
    if (!ms) return
    const id = setInterval(() => ref.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}

const ALERT_META = {
  OK:                 { color: '#00f5a0', glow: '#00f5a022', icon: '◉', label: 'Normal',        severity: 0 },
  WARNING_BATTERY:    { color: '#ff9f43', glow: '#ff9f4322', icon: '▲', label: 'Low Battery',   severity: 1 },
  WARNING_HUMIDITY:   { color: '#ffd32a', glow: '#ffd32a22', icon: '▲', label: 'High Humidity', severity: 1 },
  CRITICAL_TEMP_HIGH: { color: '#ff3f6c', glow: '#ff3f6c22', icon: '⬟', label: 'Temp Critical', severity: 2 },
  CRITICAL_TEMP_LOW:  { color: '#a55eea', glow: '#a55eea22', icon: '⬟', label: 'Frost Alert',   severity: 2 },
}

const DEVICE_PALETTE = ['#00f5a0','#00d2ff','#a55eea','#ff9f43','#ff3f6c']

function downloadCSV(data, filename) {
  if (!data.length) return
  const h = Object.keys(data[0])
  const csv = [h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename })
  a.click()
}

function downloadJSON(data, filename) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})), download: filename })
  a.click()
}

// ── Particle canvas background ────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = canvas.offsetWidth
    let H = canvas.height = canvas.offsetHeight
    const particles = Array.from({length:60}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
      r: Math.random()*1.5+.5, o: Math.random()*.4+.1
    }))
    let raf
    function draw() {
      ctx.clearRect(0,0,W,H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x<0) p.x=W; if (p.x>W) p.x=0
        if (p.y<0) p.y=H; if (p.y>H) p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle = `rgba(0,245,160,${p.o})`; ctx.fill()
      })
      particles.forEach((a,i) => particles.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x,a.y-b.y)
        if (d<120) { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y)
          ctx.strokeStyle=`rgba(0,245,160,${.15*(1-d/120)})`; ctx.stroke() }
      }))
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />
}

// ── Animated number ───────────────────────────────────────────────────────────
function AnimNum({ value, decimals=1, suffix='' }) {
  const [disp, setDisp] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const start = prev.current, end = parseFloat(value)||0
    prev.current = end
    let s = null, dur = 600
    const step = ts => {
      if (!s) s = ts
      const p = Math.min((ts-s)/dur,1)
      setDisp(+(start + (end-start) * (p < .5 ? 2*p*p : -1+(4-2*p)*p)).toFixed(decimals))
      if (p<1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <>{disp.toFixed(decimals)}{suffix}</>
}

// ── Gauge ring ────────────────────────────────────────────────────────────────
function GaugeRing({ value, max=100, color='#00f5a0', size=80, label }) {
  const pct = Math.min(value/max,1)
  const r=30, circ=2*Math.PI*r
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="6"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition:'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }}/>
        <text x="36" y="40" textAnchor="middle" fill={color} fontSize="13" fontFamily="'JetBrains Mono',monospace" fontWeight="700">
          {Math.round(pct*100)}%
        </text>
      </svg>
      <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:4, letterSpacing:1, textTransform:'uppercase' }}>{label}</div>
    </div>
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color='#00f5a0', height=40 }) {
  if (!data.length) return <div style={{ height }} />
  const vals = data.map(d=>d.value||d.temperature||0)
  const mn=Math.min(...vals), mx=Math.max(...vals), range=mx-mn||1
  const W=160, H=height, pts=vals.map((v,i)=>`${(i/(vals.length-1))*W},${H-((v-mn)/range)*(H-4)-2}`)
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Toast notifications ───────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type='info') => {
    const id = Date.now()
    setToasts(t => [...t.slice(-2), { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x=>x.id!==id)), 4000)
  }, [])
  return { toasts, add }
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:'rgba(6,11,23,.95)', border:'1px solid rgba(0,245,160,.3)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'rgba(255,255,255,.5)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontFamily:'JetBrains Mono,monospace' }}>
          {p.name}: {typeof p.value==='number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ token, onLogout }) {
  const [readings,   setReadings]   = useState([])
  const [alerts,     setAlerts]     = useState([])
  const [stats,      setStats]      = useState([])
  const [timeseries, setTimeseries] = useState([])
  const [tab,        setTab]        = useState('overview')
  const [live,       setLive]       = useState(true)
  const [filter,     setFilter]     = useState('ALL')
  const [pulse,      setPulse]      = useState(false)
  const { toasts, add: addToast }   = useToasts()
  const prevAlertCount = useRef(0)

  const fetchAll = useCallback(async () => {
    try {
      const [r,a,s,t] = await Promise.all([
        fetch(API+'/data?limit=60').then(x=>x.json()),
        fetch(API+'/data/alerts?limit=30').then(x=>x.json()),
        fetch(API+'/data/stats').then(x=>x.json()),
        fetch(API+'/data/timeseries?limit=50').then(x=>x.json()),
      ])
      if (Array.isArray(r)) setReadings(r)
      if (Array.isArray(a)) {
        if (a.length > prevAlertCount.current) {
          const newest = a[0]
          addToast(`${newest?.device_id}: ${(ALERT_META[newest?.alert]||{}).label||newest?.alert}`, newest?.alert?.startsWith('CRITICAL')?'critical':'warning')
          setPulse(true); setTimeout(()=>setPulse(false),1000)
        }
        prevAlertCount.current = a.length
        setAlerts(a)
      }
      if (Array.isArray(s)) setStats(s)
      if (Array.isArray(t)) setTimeseries(t.map(d=>({ ...d, time:new Date(d.timestamp*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}) })))
    } catch(e) {}
  }, [token])

  useEffect(()=>{ fetchAll() },[fetchAll])
  useInterval(fetchAll, live ? 2000 : null)

  const avgTemp    = readings.length ? (readings.reduce((s,r)=>s+r.temperature,0)/readings.length).toFixed(1) : '--'
  const avgHumid   = readings.length ? (readings.reduce((s,r)=>s+r.humidity,0)/readings.length).toFixed(1) : '--'
  const avgBatt    = readings.length ? (readings.reduce((s,r)=>s+r.battery_pct,0)/readings.length).toFixed(1) : '--'
  const devOnline  = new Set(readings.map(r=>r.device_id)).size
  const critCount  = alerts.filter(a=>a.alert.startsWith('CRITICAL')).length
  const warnCount  = alerts.filter(a=>a.alert.startsWith('WARNING')).length
  const healthPct  = readings.length ? Math.round((readings.filter(r=>r.alert==='OK').length/readings.length)*100) : 100

  const filteredReadings = filter==='ALL' ? readings : readings.filter(r=>r.device_id===filter)
  const deviceIds = [...new Set(readings.map(r=>r.device_id))].sort()

  const tabs = [
    { id:'overview',   icon:'⬡', label:'Overview'   },
    { id:'analytics',  icon:'◈', label:'Analytics'  },
    { id:'devices',    icon:'◉', label:'Devices'    },
    { id:'alerts',     icon:'⬟', label:'Alerts'     },
    { id:'download',   icon:'↓', label:'Export'     },
  ]

  const S = { /* styles shorthand */
    card: { background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:'20px 24px', backdropFilter:'blur(12px)', position:'relative', overflow:'hidden' },
    mono: { fontFamily:"'JetBrains Mono',monospace" },
    label: { fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.35)', marginBottom:6 },
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#060b17', color:'#e8eaf0', fontFamily:"'Outfit',sans-serif", position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(0,245,160,.2);border-radius:2px}
        .nav-btn:hover{background:rgba(0,245,160,.08)!important}
        .nav-btn.active{background:rgba(0,245,160,.12)!important;color:#00f5a0!important;border-left:2px solid #00f5a0!important}
        .trow:hover td{background:rgba(0,245,160,.03)!important}
        .dl-btn:hover{opacity:.85!important;transform:translateY(-1px)}
        .chip:hover{background:rgba(0,245,160,.15)!important}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,245,160,.1)}50%{box-shadow:0 0 40px rgba(0,245,160,.3)}}
        @keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2);opacity:0}}
        .blink-pulse{animation:ping .8s ease-out}
      `}</style>

      <ParticleField />

      {/* Toast notifications */}
      <div style={{ position:'fixed', top:20, right:20, zIndex:1000, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type==='critical'?'rgba(255,63,108,.15)':'rgba(255,159,67,.15)',
            border:`1px solid ${t.type==='critical'?'rgba(255,63,108,.4)':'rgba(255,159,67,.4)'}`,
            borderRadius:10, padding:'10px 16px', fontSize:12, backdropFilter:'blur(12px)',
            animation:'fadeSlide .3s ease', color:'#fff', maxWidth:280 }}>
            <span style={{ ...S.mono, color: t.type==='critical'?'#ff3f6c':'#ff9f43' }}>
              {t.type==='critical'?'⬟ CRITICAL':'▲ WARNING'}
            </span>
            <div style={{ color:'rgba(255,255,255,.7)', marginTop:2 }}>{t.msg}</div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside style={{ width:220, background:'rgba(6,11,23,.8)', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', padding:'24px 0', flexShrink:0, backdropFilter:'blur(20px)', zIndex:10, position:'relative' }}>
        <div style={{ padding:'0 20px 28px', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:3, color:'#00f5a0' }}>IOT<span style={{ color:'rgba(255,255,255,.9)' }}>PULSE</span></div>
          <div style={{ fontSize:10, letterSpacing:2, color:'rgba(255,255,255,.3)', marginTop:4 }}>NEURAL COMMAND CENTER</div>
        </div>

        <div style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2 }}>
          {tabs.map(t2 => (
            <button key={t2.id} className={`nav-btn ${tab===t2.id?'active':''}`}
              onClick={() => setTab(t2.id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'transparent',
                border:'none', borderLeft:'2px solid transparent', borderRadius:'0 8px 8px 0',
                color:'rgba(255,255,255,.45)', cursor:'pointer', fontSize:13, fontFamily:'Outfit,sans-serif',
                transition:'all .15s', textAlign:'left', width:'100%' }}>
              <span style={{ fontSize:14, width:18, textAlign:'center' }}>{t2.icon}</span>
              <span>{t2.label}</span>
              {t2.id==='alerts' && alerts.length>0 && (
                <span style={{ marginLeft:'auto', background: critCount>0?'#ff3f6c':'#ff9f43',
                  color:'#fff', borderRadius:20, padding:'1px 8px', fontSize:10, fontWeight:700,
                  ...(pulse && t2.id==='alerts' ? {animation:'glow .5s ease'} : {}) }}>
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding:'16px 12px', borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <div style={{ padding:'8px 12px', background:'rgba(0,245,160,.05)', border:'1px solid rgba(0,245,160,.15)', borderRadius:10, marginBottom:8 }}>
            <div style={{ ...S.label }}>System Health</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, height:4, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${healthPct}%`, background: healthPct>80?'#00f5a0':healthPct>50?'#ff9f43':'#ff3f6c', borderRadius:2, transition:'width .6s ease' }}/>
              </div>
              <span style={{ ...S.mono, fontSize:11, color:'#00f5a0' }}>{healthPct}%</span>
            </div>
          </div>

          <button onClick={()=>setLive(l=>!l)}
            style={{ width:'100%', background: live?'rgba(0,245,160,.08)':'rgba(255,255,255,.04)',
              border:`1px solid ${live?'rgba(0,245,160,.3)':'rgba(255,255,255,.1)'}`,
              color: live?'#00f5a0':'rgba(255,255,255,.4)', borderRadius:8, padding:'8px 12px',
              cursor:'pointer', fontSize:11, fontFamily:'JetBrains Mono,monospace', letterSpacing:1,
              display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginBottom:8, transition:'all .2s' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'currentColor',
              boxShadow: live?'0 0 8px currentColor':'none', flexShrink:0, transition:'all .2s',
              ...(live?{animation:'ping 1.5s ease-in-out infinite'}:{}) }}/>
            {live?'STREAMING LIVE':'STREAM PAUSED'}
          </button>

          <button onClick={onLogout}
            style={{ width:'100%', background:'transparent', border:'1px solid rgba(255,63,108,.2)',
              color:'rgba(255,63,108,.7)', borderRadius:8, padding:'8px 12px', cursor:'pointer', fontSize:12,
              fontFamily:'Outfit,sans-serif', transition:'all .2s' }}
            onMouseEnter={e=>{e.target.style.background='rgba(255,63,108,.08)'; e.target.style.color='#ff3f6c'}}
            onMouseLeave={e=>{e.target.style.background='transparent'; e.target.style.color='rgba(255,63,108,.7)'}}>
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflowY:'auto', position:'relative', zIndex:5 }}>
        <div style={{ padding:'28px 32px' }}>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:700, margin:0, letterSpacing:-0.5 }}>
                {tabs.find(t2=>t2.id===tab)?.label}
              </h1>
              <p style={{ color:'rgba(255,255,255,.35)', fontSize:12, margin:'4px 0 0', ...S.mono }}>
                {new Date().toLocaleString()} · {devOnline} nodes active · {readings.length} data points
              </p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {deviceIds.map((d,i) => (
                <button key={d} className="chip"
                  onClick={() => setFilter(filter===d?'ALL':d)}
                  style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer',
                    fontFamily:'JetBrains Mono,monospace', border:`1px solid ${filter===d ? DEVICE_PALETTE[i%5]+'aa' : 'rgba(255,255,255,.12)'}`,
                    background: filter===d ? DEVICE_PALETTE[i%5]+'20' : 'rgba(255,255,255,.04)',
                    color: filter===d ? DEVICE_PALETTE[i%5] : 'rgba(255,255,255,.45)', transition:'all .15s' }}>
                  {d}
                </button>
              ))}
              {filter!=='ALL' && <button onClick={()=>setFilter('ALL')}
                style={{ padding:'5px 10px', borderRadius:20, fontSize:11, cursor:'pointer', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.5)' }}>
                ✕ Clear
              </button>}
            </div>
          </div>

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {tab==='overview' && <>
            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              {[
                { label:'Avg Temperature', value:avgTemp, unit:'°C', color:'#00f5a0', sub:`${readings.filter(r=>r.temperature>70).length} above threshold`, icon:'◈' },
                { label:'Avg Humidity',    value:avgHumid, unit:'%', color:'#00d2ff', sub:`${readings.filter(r=>r.humidity>85).length} high readings`, icon:'◉' },
                { label:'Active Alerts',   value:alerts.length, unit:'', color: alerts.length>0?'#ff3f6c':'#00f5a0', sub:`${critCount} critical · ${warnCount} warnings`, icon:'⬟' },
                { label:'Avg Battery',     value:avgBatt, unit:'%',  color:'#ff9f43', sub:`${readings.filter(r=>r.battery_pct<25).length} low battery`, icon:'▲' },
              ].map((k,i) => (
                <div key={i} style={{ ...S.card, animation:`fadeSlide .4s ease ${i*.08}s both` }}>
                  <div style={{ position:'absolute', top:-20, right:-20, fontSize:80, opacity:.04, lineHeight:1 }}>{k.icon}</div>
                  <div style={{ ...S.label }}>{k.label}</div>
                  <div style={{ fontSize:36, fontWeight:700, color:k.color, ...S.mono, lineHeight:1.1, marginBottom:4 }}>
                    {k.value !== '--' ? <AnimNum value={parseFloat(k.value)||0} decimals={1} suffix={k.unit}/> : '--'}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{k.sub}</div>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${k.color}44, transparent)` }}/>
                </div>
              ))}
            </div>

            {/* Alert banner */}
            {critCount > 0 && (
              <div style={{ background:'rgba(255,63,108,.08)', border:'1px solid rgba(255,63,108,.25)', borderRadius:12, padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:16, animation:'fadeSlide .3s ease' }}>
                <span style={{ fontSize:20, color:'#ff3f6c' }}>⬟</span>
                <div style={{ flex:1 }}>
                  <span style={{ color:'#ff3f6c', fontWeight:600, fontSize:13 }}>CRITICAL ALERT</span>
                  <span style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginLeft:12 }}>
                    {critCount} sensor{critCount>1?'s':''} reporting critical conditions — immediate attention required
                  </span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {alerts.filter(a=>a.alert.startsWith('CRITICAL')).slice(0,3).map((a,i)=>(
                    <span key={i} style={{ ...S.mono, fontSize:11, background:'rgba(255,63,108,.15)', border:'1px solid rgba(255,63,108,.3)', borderRadius:6, padding:'3px 8px', color:'#ff3f6c' }}>
                      {a.device_id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Live feed + gauges */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:20, marginBottom:20 }}>
              <div style={{ ...S.card }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>Live Feed
                    <span style={{ ...S.mono, fontSize:11, color:'rgba(255,255,255,.3)', marginLeft:12 }}>{filteredReadings.length} records</span>
                  </div>
                  <button onClick={()=>downloadCSV(filteredReadings,'feed-'+Date.now()+'.csv')}
                    style={{ ...S.mono, fontSize:11, padding:'5px 12px', background:'rgba(0,245,160,.08)', border:'1px solid rgba(0,245,160,.2)', borderRadius:6, color:'#00f5a0', cursor:'pointer' }}>
                    ↓ CSV
                  </button>
                </div>
                <div style={{ maxHeight:360, overflowY:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                        {['Device','Location','Temp °C','Humidity %','Battery %','Status'].map(h=>(
                          <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'rgba(255,255,255,.3)', fontSize:10, letterSpacing:1, textTransform:'uppercase', fontWeight:500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReadings.map((r,i)=>{
                        const meta = ALERT_META[r.alert]||ALERT_META.OK
                        const devIdx = deviceIds.indexOf(r.device_id)
                        return (
                          <tr key={i} className="trow" style={{ borderBottom:'1px solid rgba(255,255,255,.03)', borderLeft:`2px solid ${r.alert!=='OK'?meta.color:'transparent'}`, transition:'all .1s' }}>
                            <td style={{ padding:'8px 10px', ...S.mono, fontSize:11, color: DEVICE_PALETTE[devIdx%5]||'#00f5a0' }}>{r.device_id}</td>
                            <td style={{ padding:'8px 10px', color:'rgba(255,255,255,.5)' }}>{r.location}</td>
                            <td style={{ padding:'8px 10px', ...S.mono, color: r.temperature>70?'#ff3f6c':r.temperature<5?'#a55eea':'rgba(255,255,255,.85)', fontWeight: r.temperature>70||r.temperature<5?'700':'400' }}>{r.temperature?.toFixed(1)}</td>
                            <td style={{ padding:'8px 10px', ...S.mono, color: r.humidity>85?'#ffd32a':'rgba(255,255,255,.85)' }}>{r.humidity?.toFixed(1)}</td>
                            <td style={{ padding:'8px 10px', ...S.mono, color: r.battery_pct<25?'#ff9f43':'rgba(255,255,255,.85)' }}>{r.battery_pct?.toFixed(1)}</td>
                            <td style={{ padding:'8px 10px' }}>
                              <span style={{ fontSize:10, letterSpacing:.5, padding:'3px 8px', borderRadius:20,
                                background: meta.glow, border:`1px solid ${meta.color}55`,
                                color: meta.color, ...S.mono, whiteSpace:'nowrap' }}>
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gauge panel */}
              <div style={{ ...S.card, display:'flex', flexDirection:'column', gap:20, justifyContent:'center', alignItems:'center' }}>
                <GaugeRing value={parseFloat(avgTemp)||0} max={100} color="#00f5a0" label="Temp Index" />
                <GaugeRing value={parseFloat(avgHumid)||0} max={100} color="#00d2ff" label="Humidity" />
                <GaugeRing value={parseFloat(avgBatt)||0}  max={100} color="#ff9f43" label="Avg Battery" />
              </div>
            </div>
          </>}

          {/* ── ANALYTICS ─────────────────────────────────────────────────── */}
          {tab==='analytics' && <>
            <div style={{ ...S.card, marginBottom:20 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Temperature Stream
                <span style={{ ...S.mono, fontSize:10, color:'rgba(255,255,255,.3)', marginLeft:12 }}>Real-time · 2s refresh</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5a0" stopOpacity={.35}/>
                      <stop offset="95%" stopColor="#00f5a0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false}/>
                  <XAxis dataKey="time" tick={{ fill:'rgba(255,255,255,.3)', fontSize:10, fontFamily:'JetBrains Mono,monospace' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="temperature" stroke="#00f5a0" fill="url(#tGrad)" strokeWidth={2} dot={false} name="Temp °C"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <div style={{ ...S.card }}>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Humidity Trend</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={timeseries}>
                    <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false}/>
                    <XAxis dataKey="time" tick={{ fill:'rgba(255,255,255,.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'rgba(255,255,255,.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Line type="monotone" dataKey="humidity" stroke="#00d2ff" strokeWidth={2} dot={false} name="Humidity %"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...S.card }}>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Battery Levels</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={timeseries}>
                    <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false}/>
                    <XAxis dataKey="time" tick={{ fill:'rgba(255,255,255,.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'rgba(255,255,255,.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Line type="monotone" dataKey="battery_pct" stroke="#ff9f43" strokeWidth={2} dot={false} name="Battery %"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar chart */}
            <div style={{ ...S.card }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Device Performance Radar</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={stats.map(s => ({ device:s.device_id, temp:Math.min(s.avg_temp||0,100), humidity:s.avg_humidity||0, battery:s.avg_battery||70, alerts:Math.min((s.alert_count||0)*10,100), readings:Math.min((s.reading_count||0)/2,100) }))}>
                  <PolarGrid stroke="rgba(255,255,255,.08)"/>
                  <PolarAngleAxis dataKey="device" tick={{ fill:'rgba(255,255,255,.4)', fontSize:11, fontFamily:'JetBrains Mono,monospace' }}/>
                  <Radar name="Temp" dataKey="temp" stroke="#00f5a0" fill="#00f5a0" fillOpacity={.15}/>
                  <Radar name="Humidity" dataKey="humidity" stroke="#00d2ff" fill="#00d2ff" fillOpacity={.1}/>
                  <Tooltip content={<ChartTooltip/>}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>}

          {/* ── DEVICES ───────────────────────────────────────────────────── */}
          {tab==='devices' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, marginBottom:20 }}>
              {stats.map((s,i) => {
                const color = DEVICE_PALETTE[i%5]
                const lastReading = readings.find(r=>r.device_id===s.device_id)
                const sparkData = timeseries.filter(t=>!t.device_id||t.device_id===s.device_id).slice(-20)
                return (
                  <div key={s.device_id} style={{ ...S.card, borderTop:`2px solid ${color}`, animation:`fadeSlide .4s ease ${i*.1}s both` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ ...S.mono, fontSize:13, color, fontWeight:700 }}>{s.device_id}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>{s.location}</div>
                      </div>
                      {lastReading && (
                        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:20,
                          background:(ALERT_META[lastReading.alert]||ALERT_META.OK).glow,
                          border:`1px solid ${(ALERT_META[lastReading.alert]||ALERT_META.OK).color}55`,
                          color:(ALERT_META[lastReading.alert]||ALERT_META.OK).color, ...S.mono }}>
                          {(ALERT_META[lastReading.alert]||ALERT_META.OK).icon} {(ALERT_META[lastReading.alert]||ALERT_META.OK).label}
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom:12, opacity:.7 }}>
                      <Sparkline data={sparkData.map(d=>({value:d.temperature}))} color={color} height={36}/>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                      {[
                        { label:'Avg Temp', value:`${s.avg_temp?.toFixed(1)||'--'}°C`, color:'#00f5a0' },
                        { label:'Max Temp', value:`${s.max_temp?.toFixed(1)||'--'}°C`, color: (s.max_temp||0)>70?'#ff3f6c':'rgba(255,255,255,.6)' },
                        { label:'Readings', value:s.reading_count, color:'rgba(255,255,255,.6)' },
                        { label:'Avg Humid', value:`${s.avg_humidity?.toFixed(1)||'--'}%`, color:'#00d2ff' },
                        { label:'Min Temp', value:`${s.min_temp?.toFixed(1)||'--'}°C`, color:'rgba(255,255,255,.6)' },
                        { label:'Alerts',   value:s.alert_count||0, color:(s.alert_count||0)>0?'#ff3f6c':'#00f5a0' },
                      ].map((m,j)=>(
                        <div key={j} style={{ background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 10px' }}>
                          <div style={{ ...S.label, marginBottom:2 }}>{m.label}</div>
                          <div style={{ ...S.mono, fontSize:13, color:m.color, fontWeight:600 }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bar comparison */}
            <div style={{ ...S.card }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Device Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats} barGap={4}>
                  <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false}/>
                  <XAxis dataKey="device_id" tick={{ fill:'rgba(255,255,255,.4)', fontSize:11, fontFamily:'JetBrains Mono,monospace' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="avg_temp"     fill="#00f5a0" radius={[4,4,0,0]} name="Avg Temp (°C)"/>
                  <Bar dataKey="avg_humidity" fill="#00d2ff" radius={[4,4,0,0]} name="Avg Humidity (%)"/>
                  <Bar dataKey="alert_count"  fill="#ff3f6c" radius={[4,4,0,0]} name="Alert Count"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>}

          {/* ── ALERTS ────────────────────────────────────────────────────── */}
          {tab==='alerts' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
              {[
                { label:'Total Alerts', value:alerts.length, color:'#e8eaf0', icon:'⬡' },
                { label:'Critical',     value:critCount,     color:'#ff3f6c',  icon:'⬟' },
                { label:'Warnings',     value:warnCount,     color:'#ff9f43',  icon:'▲' },
              ].map((k,i)=>(
                <div key={i} style={{ ...S.card, textAlign:'center', borderTop:`2px solid ${k.color}55` }}>
                  <div style={{ fontSize:40, marginBottom:4 }}>{k.icon}</div>
                  <div style={{ fontSize:36, fontWeight:700, color:k.color, ...S.mono }}>{k.value}</div>
                  <div style={{ ...S.label, marginTop:4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>Alert Log
                  <span style={{ ...S.mono, fontSize:10, color:'rgba(255,255,255,.3)', marginLeft:12 }}>Last {alerts.length} events</span>
                </div>
                <button onClick={()=>downloadCSV(alerts,'alerts-'+Date.now()+'.csv')}
                  style={{ ...S.mono, fontSize:11, padding:'5px 12px', background:'rgba(255,63,108,.08)', border:'1px solid rgba(255,63,108,.25)', borderRadius:6, color:'#ff3f6c', cursor:'pointer' }}>
                  ↓ Export
                </button>
              </div>

              {alerts.length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,.3)' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>◉</div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>All systems nominal</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {alerts.map((a,i)=>{
                    const meta = ALERT_META[a.alert]||ALERT_META.OK
                    const isCrit = a.alert.startsWith('CRITICAL')
                    return (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr 1fr 100px 100px 160px', alignItems:'center', gap:12,
                        padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,.02)',
                        border:`1px solid ${meta.color}22`, borderLeft:`3px solid ${meta.color}`,
                        animation:`fadeSlide .3s ease ${i*.03}s both` }}>
                        <div style={{ ...S.mono, fontSize:10, color:'rgba(255,255,255,.3)' }}>
                          {new Date(a.timestamp*1000).toLocaleTimeString()}
                        </div>
                        <div style={{ ...S.mono, fontSize:12, color: DEVICE_PALETTE[deviceIds.indexOf(a.device_id)%5]||'#00f5a0' }}>{a.device_id}</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>{a.location}</div>
                        <div style={{ ...S.mono, fontSize:12, color: a.temperature>70?'#ff3f6c':a.temperature<5?'#a55eea':'rgba(255,255,255,.7)', fontWeight:700 }}>{a.temperature?.toFixed(1)}°C</div>
                        <div style={{ ...S.mono, fontSize:12, color:'rgba(255,255,255,.7)' }}>{a.humidity?.toFixed(1)}%</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:meta.glow,
                            border:`1px solid ${meta.color}55`, color:meta.color, ...S.mono, whiteSpace:'nowrap' }}>
                            {meta.icon} {meta.label}
                          </span>
                          <span style={{ fontSize:10, fontWeight:700, color: isCrit?'#ff3f6c':'#ff9f43', ...S.mono }}>
                            {isCrit?'CRIT':'WARN'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>}

          {/* ── EXPORT ────────────────────────────────────────────────────── */}
          {tab==='download' && <>
            <div style={{ ...S.card, marginBottom:20, background:'rgba(0,245,160,.04)', borderColor:'rgba(0,245,160,.15)' }}>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>Data Export Center</div>
              <div style={{ color:'rgba(255,255,255,.4)', fontSize:13 }}>Download sensor data in your preferred format. All data is current as of {new Date().toLocaleTimeString()}.</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:20 }}>
              {[
                { label:'Live Readings', count:readings.length, color:'#00f5a0', icon:'◈', data:readings, name:'readings' },
                { label:'Alert Log',     count:alerts.length,   color:'#ff3f6c', icon:'⬟', data:alerts,   name:'alerts'   },
                { label:'Device Stats',  count:stats.length,    color:'#a55eea', icon:'◉', data:stats,    name:'stats'    },
                { label:'Time Series',   count:timeseries.length,color:'#ff9f43',icon:'▲', data:timeseries,name:'timeseries'},
              ].map((d,i)=>(
                <div key={i} style={{ ...S.card, borderTop:`2px solid ${d.color}55` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{d.label}</div>
                      <div style={{ ...S.mono, fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>{d.count.toLocaleString()} records</div>
                    </div>
                    <span style={{ fontSize:28, color:d.color, opacity:.5 }}>{d.icon}</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    {['CSV','JSON'].map(fmt=>(
                      <button key={fmt} className="dl-btn"
                        onClick={()=> fmt==='CSV' ? downloadCSV(d.data, d.name+'-'+Date.now()+'.csv') : downloadJSON(d.data, d.name+'-'+Date.now()+'.json')}
                        style={{ flex:1, padding:'10px', background:`${d.color}10`, border:`1px solid ${d.color}33`,
                          color:d.color, borderRadius:8, cursor:'pointer', fontSize:12, fontFamily:'JetBrains Mono,monospace',
                          fontWeight:600, transition:'all .15s', letterSpacing:.5 }}>
                        ↓ {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, border:'1px solid rgba(0,210,255,.2)', background:'rgba(0,210,255,.04)' }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>◈ Full System Export</div>
              <div style={{ color:'rgba(255,255,255,.4)', fontSize:12, marginBottom:16 }}>
                Export all datasets in a single comprehensive JSON file — readings, alerts, device stats, time series, and system metadata.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="dl-btn"
                  onClick={()=>downloadJSON({readings,alerts,stats,timeseries,meta:{exported_at:new Date().toISOString(),total_readings:readings.length,total_alerts:alerts.length,devices_online:devOnline,system_health:healthPct}},'iotpulse-full-'+Date.now()+'.json')}
                  style={{ flex:1, padding:'14px', background:'rgba(0,210,255,.1)', border:'1px solid rgba(0,210,255,.3)',
                    color:'#00d2ff', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'JetBrains Mono,monospace',
                    fontWeight:700, letterSpacing:1, transition:'all .15s' }}>
                  ↓ DOWNLOAD FULL EXPORT (.JSON)
                </button>
                <button className="dl-btn"
                  onClick={()=>{
                    const all=[...readings,...alerts,...stats]
                    downloadCSV(all,'iotpulse-combined-'+Date.now()+'.csv')
                  }}
                  style={{ flex:1, padding:'14px', background:'rgba(0,245,160,.08)', border:'1px solid rgba(0,245,160,.25)',
                    color:'#00f5a0', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'JetBrains Mono,monospace',
                    fontWeight:700, letterSpacing:1, transition:'all .15s' }}>
                  ↓ DOWNLOAD COMBINED (.CSV)
                </button>
              </div>
            </div>
          </>}

        </div>
      </main>
    </div>
  )
}
