import * as THREE from 'three'
import { stepPhysics, type Platform, type PlayerState } from '../game/physics'

export type ParkourCallbacks = {
  onHud: (hud: { time: number; checkpoint: number; finished: boolean }) => void
}

// Genuinely playable voxel parkour: WASD/arrows, jump, AABB platform
// collision (see src/game/physics.ts), checkpoints, fall respawn,
// timer, finish portal, restart, and mobile touch controls via callbacks
// from the React UI (joystick vector + jump flag).
export const PLATFORMS: Platform[] = [
  { x: 0, y: 0, z: 0, w: 4, d: 4 },
  { x: 0, y: 0.8, z: -5, w: 3, d: 3 },
  { x: 3.5, y: 1.6, z: -8, w: 3, d: 3 },
  { x: 0, y: 2.4, z: -11, w: 3, d: 3 },
  { x: -3.5, y: 3.2, z: -14, w: 3, d: 3 },
  { x: 0, y: 4.0, z: -17, w: 3, d: 3 },
  { x: 3.5, y: 4.8, z: -20, w: 3, d: 3 },
  { x: 0, y: 5.6, z: -23, w: 4, d: 4 },
]
const CHECKPOINTS = [2, 5] // platform indexes that are checkpoints

export class ParkourGame {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private playerMesh: THREE.Mesh
  private player: PlayerState = { x: 0, y: 1, z: 0, vy: 0, grounded: true }
  private keys = new Set<string>()
  private raf = 0
  private clock = new THREE.Clock()
  private disposed = false
  private startTime: number | null = null
  private elapsed = 0
  private finished = false
  private checkpointIndex = 0
  private respawn: PlayerState = { x: 0, y: 1, z: 0, vy: 0, grounded: true }
  joystick = { x: 0, z: 0 }
  jumpQueued = false

  constructor(private canvas: HTMLCanvasElement, private cb: ParkourCallbacks, lowGraphics: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowGraphics })
    this.renderer.setPixelRatio(lowGraphics ? 1 : Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight)
    this.scene.background = new THREE.Color(0x05070f)
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.02)
    this.camera = new THREE.PerspectiveCamera(65, (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight), 0.1, 200)
    this.scene.add(new THREE.AmbientLight(0x8899ff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 1.2)
    dir.position.set(6, 12, 4)
    this.scene.add(dir)

    const colors = [0x2fae5a, 0x3a9e5a, 0xd4a017, 0x00bcd4, 0x2fae5a, 0x00e676, 0xd4a017, 0x2fae5a]
    PLATFORMS.forEach((p, i) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(p.w, 0.8, p.d),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.85 }),
      )
      mesh.position.set(p.x, p.y - 0.4, p.z)
      this.scene.add(mesh)
      if (CHECKPOINTS.includes(i)) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 2.4, 10),
          new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 1.4 }),
        )
        pillar.position.set(p.x, p.y + 1.2, p.z)
        this.scene.add(pillar)
      }
    })
    // Finish portal
    const finish = PLATFORMS[PLATFORMS.length - 1]
    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.3, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 1.8 }),
    )
    portal.position.set(finish.x, finish.y + 1.6, finish.z)
    this.scene.add(portal)

    this.playerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 0.35 }),
    )
    this.scene.add(this.playerMesh)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('resize', this.onResize)
    this.animate()
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault()
    this.keys.add(k)
    if ((k === ' ' || k === 'arrowup' || k === 'w') && this.player.grounded) this.jumpQueued = true
  }
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()) }
  private onResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  restart() {
    this.player = { x: 0, y: 1, z: 0, vy: 0, grounded: true }
    this.respawn = { ...this.player }
    this.checkpointIndex = 0
    this.startTime = null
    this.elapsed = 0
    this.finished = false
    this.cb.onHud({ time: 0, checkpoint: 0, finished: false })
  }

  private animate = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.animate)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    if (!this.finished) {
      let mx = 0, mz = 0
      if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1
      if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1
      if (this.keys.has('w') || this.keys.has('arrowup')) mz -= 1
      if (this.keys.has('s') || this.keys.has('arrowdown')) mz += 1
      mx += this.joystick.x
      mz += this.joystick.z
      const len = Math.hypot(mx, mz)
      if (len > 1) { mx /= len; mz /= len }
      if ((mx || mz) && this.startTime === null) this.startTime = performance.now()
      if (this.jumpQueued && this.player.grounded) {
        this.player.vy = 11.5
        this.player.grounded = false
      }
      this.jumpQueued = false
      stepPhysics(this.player, PLATFORMS, dt, mx, mz)
      if (this.player.y < -12) {
        this.player = { ...this.respawn }
      }
      // Checkpoints and finish
      PLATFORMS.forEach((p, i) => {
        if (CHECKPOINTS.includes(i) && Math.abs(this.player.x - p.x) < 1.5 && Math.abs(this.player.z - p.z) < 1.5 && Math.abs(this.player.y - p.y) < 1.2) {
          if (i > this.checkpointIndex) {
            this.checkpointIndex = i
            this.respawn = { x: p.x, y: p.y + 1, z: p.z, vy: 0, grounded: true }
          }
        }
      })
      const finish = PLATFORMS[PLATFORMS.length - 1]
      if (Math.abs(this.player.x - finish.x) < 1.6 && Math.abs(this.player.z - finish.z) < 1.6 && this.player.y > finish.y + 0.5 && this.player.y < finish.y + 3.5) {
        this.finished = true
      }
      if (this.startTime !== null && !this.finished) this.elapsed = (performance.now() - this.startTime) / 1000
      if (this.finished) this.elapsed = this.startTime ? (performance.now() - this.startTime) / 1000 : this.elapsed
      this.cb.onHud({ time: this.elapsed, checkpoint: this.checkpointIndex, finished: this.finished })
    }
    this.playerMesh.position.set(this.player.x, this.player.y + 0.6, this.player.z)
    // Third-person follow camera
    this.camera.position.set(this.player.x, this.player.y + 5, this.player.z + 9)
    this.camera.lookAt(this.player.x, this.player.y + 1, this.player.z)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }
}
