import { useEffect, useRef, useState } from 'react'
import { LandingWorld } from './three/landing'
import { ParkourGame } from './three/parkour'
import { CHANNEL_URL, SUBSCRIBE_URL, videos, youtubeEmbedUrl, youtubeWatchUrl, type VideoCategory } from './data/videos'

type View = 'landing' | 'hub' | 'parkour' | 'videos' | 'creator' | 'secret'
const SECRET_KEY = 'roukverse-secret-found'

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch { return false }
}

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [lowGraphics, setLowGraphics] = useState(false)
  const [secretFound, setSecretFound] = useState(() => {
    try { return localStorage.getItem(SECRET_KEY) === '1' } catch { return false }
  })
  const [secretFlash, setSecretFlash] = useState(false)
  const [parkourHud, setParkourHud] = useState({ time: 0, checkpoint: 0, finished: false })
  const [category, setCategory] = useState<VideoCategory | 'All'>('All')
  const [featuredId, setFeaturedId] = useState('')
  const landingRef = useRef<HTMLCanvasElement>(null)
  const parkourRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<ParkourGame | null>(null)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const hasWebGL = webglAvailable()

  // Landing world — recreated when low-graphics or view changes to landing/hub
  useEffect(() => {
    if (!hasWebGL || (view !== 'landing' && view !== 'hub') || !landingRef.current) return
    let world: LandingWorld | null = null
    try {
      world = new LandingWorld(landingRef.current, {
        lowGraphics, reducedMotion,
        onSecretFound: () => {
          setSecretFound(true)
          setSecretFlash(true)
          try { localStorage.setItem(SECRET_KEY, '1') } catch { /* storage unavailable */ }
          setTimeout(() => setSecretFlash(false), 4000)
        },
        onPortal: (dest) => setView(dest === 'parkour' ? 'parkour' : dest === 'videos' ? 'videos' : 'creator'),
      })
    } catch { /* fall through to 2D fallback below */ }
    return () => world?.dispose()
  }, [view, lowGraphics, hasWebGL, reducedMotion])

  // Parkour game
  useEffect(() => {
    if (view !== 'parkour' || !hasWebGL || !parkourRef.current) return
    let game: ParkourGame | null = null
    try {
      game = new ParkourGame(parkourRef.current, { onHud: setParkourHud }, lowGraphics)
      gameRef.current = game
    } catch { /* fallback message shown in parkour view */ }
    return () => { game?.dispose(); gameRef.current = null }
  }, [view, hasWebGL, lowGraphics])

  const resetSecret = () => {
    try { localStorage.removeItem(SECRET_KEY) } catch { /* ignore */ }
    setSecretFound(false)
  }

  const nav = (v: View) => setView(v)
  const filtered = category === 'All' ? videos : videos.filter(v => v.category === category)

  return (
    <div className="app">
      <header className="topbar" aria-label="Main navigation">
        <button className="brand" onClick={() => nav('landing')}>ROUKVERSE</button>
        <nav className="menu">
          <button onClick={() => nav('hub')}>Universe</button>
          <button onClick={() => nav('parkour')}>Parkour Realm</button>
          <button onClick={() => nav('videos')}>Video Vault</button>
          <button onClick={() => nav('creator')}>Creator Zone</button>
          <button onClick={() => nav('secret')}>Secret Dimension</button>
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer">YouTube Portal ↗</a>
        </nav>
        <label className="lowgfx">
          <input type="checkbox" checked={lowGraphics} onChange={e => setLowGraphics(e.target.checked)} />
          Low graphics
        </label>
      </header>

      {view === 'landing' && (
        <main className="landing">
          {hasWebGL ? <canvas ref={landingRef} className="scene" aria-label="Interactive 3D floating voxel island" /> : <div className="fallback2d" role="img" aria-label="2D fallback: floating voxel island illustration">◆ ROUKVERSE ◆<p>WebGL is unavailable in this browser, so this is the 2D fallback. Navigation below still works.</p></div>}
          <div className="hero">
            <div className="logo">ROUKVERSE</div>
            <p className="tagline">BEYOND THE BLOCKS.</p>
            <p className="sub">The immersive 3D home of ROUKMARCO Y — Minecraft PE parkour, videos, and a hidden dimension.</p>
            <div className="cta-row">
              <button className="btn primary" onClick={() => nav('hub')}>ENTER THE UNIVERSE</button>
              <a className="btn secondary" href={CHANNEL_URL} target="_blank" rel="noreferrer">WATCH ON YOUTUBE</a>
            </div>
            <p className="hint">Tip: in the 3D world, click a glowing portal to travel, and look closely for a small emerald artifact.</p>
          </div>
          {secretFlash && <div className="achievement" role="status">🏆 ROUKVERSE ACHIEVEMENT UNLOCKED — Emerald Artifact Found! The Secret Dimension is open.</div>}
        </main>
      )}

      {view === 'hub' && (
        <main className="hub">
          {hasWebGL ? <canvas ref={landingRef} className="scene small" aria-label="Interactive 3D world" /> : <div className="fallback2d">2D fallback — navigation below still works.</div>}
          <h1>Choose your destination</h1>
          <p className="sub">Mouse, touch, and keyboard navigation are supported. The menu above is always available as an accessible fallback.</p>
          <div className="cards">
            <button onClick={() => nav('parkour')}><strong>PARKOUR REALM</strong><span>Play the voxel parkour level — WASD, jump, checkpoints, timer.</span></button>
            <button onClick={() => nav('videos')}><strong>VIDEO VAULT</strong><span>Explore the channel video collection.</span></button>
            <button onClick={() => nav('creator')}><strong>CREATOR ZONE</strong><span>Meet ROUKMARCO Y.</span></button>
            <button onClick={() => nav('secret')}><strong>SECRET DIMENSION {secretFound ? '— UNLOCKED ✓' : '— ???'}</strong><span>{secretFound ? 'The emerald artifact has been found.' : 'A rare emerald artifact is hidden in the world. Find it in the 3D scene.'}</span></button>
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer"><strong>YOUTUBE PORTAL ↗</strong><span>Open the actual ROUKMARCO Y channel.</span></a>
          </div>
          {secretFound && <button className="btn secondary" onClick={resetSecret}>Reset secret discovery</button>}
        </main>
      )}

      {view === 'parkour' && (
        <main className="parkour">
          <h1>Parkour Realm</h1>
          <div className="hud" aria-live="polite">
            <span>Time: {parkourHud.time.toFixed(1)}s</span>
            <span>Checkpoint: {parkourHud.checkpoint ? 'Reached' : 'Start'}</span>
            {parkourHud.finished && <span className="win">🎉 FINISHED! Portal reached in {parkourHud.time.toFixed(1)}s</span>}
            <button onClick={() => gameRef.current?.restart()}>Restart</button>
            <button onClick={() => nav('hub')}>Back to Universe</button>
          </div>
          {hasWebGL ? <canvas ref={parkourRef} className="scene game" aria-label="Playable 3D parkour game" /> : <p>WebGL is unavailable, so the 3D parkour game cannot run here. Try a browser with WebGL enabled.</p>}
          <div className="controls">
            <p><strong>Desktop:</strong> WASD or arrow keys to move, Space / W to jump. Fall and you respawn at your last checkpoint.</p>
            <div className="touch" aria-label="Mobile touch controls">
              <button onTouchStart={() => { if (gameRef.current) gameRef.current.joystick.z = -1 }} onTouchEnd={() => { if (gameRef.current) gameRef.current.joystick.z = 0 }}>▲ Forward</button>
              <button onTouchStart={() => { if (gameRef.current) gameRef.current.joystick.x = -1 }} onTouchEnd={() => { if (gameRef.current) gameRef.current.joystick.x = 0 }}>◀ Left</button>
              <button onTouchStart={() => { if (gameRef.current) gameRef.current.joystick.x = 1 }} onTouchEnd={() => { if (gameRef.current) gameRef.current.joystick.x = 0 }}>Right ▶</button>
              <button onTouchStart={() => { if (gameRef.current) gameRef.current.joystick.z = 1 }} onTouchEnd={() => { if (gameRef.current) gameRef.current.joystick.z = 0 }}>▼ Back</button>
              <button className="jump" onTouchStart={() => { if (gameRef.current) gameRef.current.jumpQueued = true }}>JUMP</button>
            </div>
          </div>
        </main>
      )}

      {view === 'videos' && (
        <main className="videos">
          <h1>Video Vault</h1>
          <p className="sub">Channel: <a href={CHANNEL_URL} target="_blank" rel="noreferrer">youtube.com/@roukmarcoy_07</a> — no subscriber or view counts are claimed here.</p>
          <a className="btn primary" href={SUBSCRIBE_URL} target="_blank" rel="noreferrer">SUBSCRIBE on YouTube</a>
          <div className="filters" role="group" aria-label="Filter videos by category">
            {(['All', 'Parkour', 'Challenges', 'Survival', 'Shorts'] as const).map(c => (
              <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          {featuredId && <div className="featured"><iframe title="Featured ROUKMARCO Y video" src={youtubeEmbedUrl(featuredId)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
          <div className="cards video-cards">
            {filtered.map((v, i) => (
              <article key={i} className="video-card">
                <div className="thumb">{v.sample ? 'CONFIGURE VIDEO ID' : '▶ PLAY'}</div>
                <strong>{v.category}</strong>
                <p>{v.sample ? 'Sample layout card — not a verified channel video. Add a real video ID in src/data/videos.ts to replace it.' : v.note}</p>
                {v.id ? <><button onClick={() => setFeaturedId(v.id)}>Watch here</button> <a href={youtubeWatchUrl(v.id)} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></> : <a href={CHANNEL_URL} target="_blank" rel="noreferrer">Open channel ↗</a>}
              </article>
            ))}
          </div>
          <p className="hint">To feature a real video: add its YouTube ID to <code>src/data/videos.ts</code>, rebuild, and redeploy. No titles or stats are fabricated in this gallery.</p>
        </main>
      )}

      {view === 'creator' && (
        <main className="creator">
          <h1>Creator Zone</h1>
          <p className="sub">ROUKMARCO Y — Minecraft PE creator. This page makes no claims about subscriber counts, views, or analytics, because none were verified.</p>
          <p>ROUKVERSE is built around parkour, challenges, and survival-style Minecraft PE content, with a playable parkour world and a hidden secret dimension for visitors who explore.</p>
          <a className="btn primary" href={CHANNEL_URL} target="_blank" rel="noreferrer">WATCH ON YOUTUBE</a>
          <a className="btn secondary" href={SUBSCRIBE_URL} target="_blank" rel="noreferrer">SUBSCRIBE</a>
        </main>
      )}

      {view === 'secret' && (
        <main className="secret">
          <h1>Secret Dimension</h1>
          {secretFound ? (
            <div className="chamber">
              <div className="emerald">◆</div>
              <h2>Secret Chamber Unlocked</h2>
              <p>🏆 ROUKVERSE ACHIEVEMENT: Emerald Artifact Found</p>
              <p>Your discovery is saved in this browser (localStorage) until you reset it.</p>
              <button className="btn secondary" onClick={resetSecret}>Reset discovery</button>
            </div>
          ) : (
            <p>The chamber is sealed. Find the small glowing emerald artifact in the 3D world on the landing or Universe screen and click it — it triggers a particle burst and unlocks this room.</p>
          )}
        </main>
      )}

      <footer>
        <p>ROUKVERSE — Beyond the Blocks. Original voxel-inspired art only; no Minecraft logos or proprietary assets are used. No audio autoplays.</p>
        <p>GitHub: <a href="https://github.com/Yashpandey-web" target="_blank" rel="noreferrer">Yashpandey-web</a> · YouTube: <a href={CHANNEL_URL} target="_blank" rel="noreferrer">@roukmarcoy_07</a></p>
      </footer>
    </div>
  )
}
