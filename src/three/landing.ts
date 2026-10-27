import * as THREE from 'three'

export type LandingOptions = {
  lowGraphics: boolean
  reducedMotion: boolean
  onSecretFound: () => void
  onPortal: (dest: string) => void
}

// Real-time Three.js landing world: floating voxel island, emerald portals,
// distant islands, particles, drifting cubes. Original procedural geometry
// only — no Minecraft assets, logos or textures are used.
export class LandingWorld {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private group = new THREE.Group()
  private particles: THREE.Points | null = null
  private portals: THREE.Mesh[] = []
  private artifact: THREE.Mesh | null = null
  private drifters: THREE.Mesh[] = []
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private raf = 0
  private clock = new THREE.Clock()
  private disposed = false
  private opts: LandingOptions
  private burst: THREE.Points | null = null
  private burstLife = 0

  constructor(private canvas: HTMLCanvasElement, opts: LandingOptions) {
    this.opts = opts
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.lowGraphics, alpha: false })
    this.renderer.setPixelRatio(opts.lowGraphics ? 1 : Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight)
    this.scene.background = new THREE.Color(0x05070f)
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.028)
    this.camera = new THREE.PerspectiveCamera(60, (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight), 0.1, 200)
    this.camera.position.set(0, 6, 18)

    const ambient = new THREE.AmbientLight(0x8899ff, 0.55)
    const dir = new THREE.DirectionalLight(0xffffff, 1.1)
    dir.position.set(8, 14, 6)
    const emerald = new THREE.PointLight(0x00e676, 60, 40)
    emerald.position.set(0, 3, 4)
    this.scene.add(ambient, dir, emerald)

    this.buildIsland()
    this.buildPortals()
    this.buildParticles()
    this.buildDrifters()
    this.scene.add(this.group)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('resize', this.onResize)
    this.animate()
  }

  private box(x: number, y: number, z: number, w: number, h: number, d: number, color: number, emissive = 0) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 1.2 : 0, roughness: 0.85, metalness: 0.05 }),
    )
    m.position.set(x, y, z)
    return m
  }

  private buildIsland() {
    const island = new THREE.Group()
    // Top grass layer, dirt/stone underneath — voxel blocks, original colours.
    const grass = 0x2fae5a, dirt = 0x6b4a2f, stone = 0x3a3f4a, gold = 0xd4a017
    for (let x = -3; x <= 3; x++) {
      for (let z = -2; z <= 2; z++) {
        island.add(this.box(x * 1.02, 0, z * 1.02, 1, 1, 1, grass))
        island.add(this.box(x * 1.02, -1.02, z * 1.02, 1, 1, 1, dirt))
      }
    }
    island.add(this.box(0, -2.1, 0, 4, 1, 3, stone))
    island.add(this.box(0, -3.1, 0, 2, 1, 2, stone))
    island.add(this.box(1.5, 0.6, -1, 0.9, 1.1, 0.9, gold, 0xd4a017))
    // Hidden emerald artifact — small, on the island edge, clickable.
    const art = this.box(-3.4, 0.7, 1.6, 0.55, 0.55, 0.55, 0x00e676, 0x00e676)
    art.name = 'secret-artifact'
    art.userData.isArtifact = true
    this.artifact = art
    island.add(art)
    // Distant floating islands
    const far1 = new THREE.Group()
    far1.add(this.box(0, 0, 0, 2, 1, 2, grass))
    far1.add(this.box(0, -1, 0, 1, 1, 1, stone))
    far1.position.set(-12, 4, -14)
    const far2 = far1.clone()
    far2.position.set(13, -1, -18)
    island.add(far1, far2)
    this.group.add(island)
  }

  private buildPortals() {
    const defs: Array<[number, number, number, string, number]> = [
      [-5.5, 2.5, -2, 'parkour', 0x00e676],
      [5.5, 2.5, -2, 'videos', 0x00bcd4],
      [0, 4.5, -6, 'creator', 0xd4a017],
    ]
    for (const [x, y, z, dest, color] of defs) {
      const portal = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.28, 12, 32),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.3 }),
      )
      portal.position.set(x, y, z)
      portal.userData.dest = dest
      this.portals.push(portal)
      this.group.add(portal)
    }
  }

  private buildParticles() {
    const count = this.opts.lowGraphics ? 180 : 650
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44
      pos[i * 3 + 1] = Math.random() * 18 - 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 6
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x7dffb0, size: 0.14, transparent: true, opacity: 0.85 }))
    this.scene.add(this.particles)
  }

  private buildDrifters() {
    for (let i = 0; i < (this.opts.lowGraphics ? 4 : 10); i++) {
      const c = this.box((Math.random() - 0.5) * 26, Math.random() * 10, -8 - Math.random() * 8, 0.7, 0.7, 0.7, [0x00e676, 0xd4a017, 0x00bcd4][i % 3], 0x00e676)
      this.drifters.push(c)
      this.scene.add(c)
    }
  }

  triggerBurst() {
    if (this.burst) this.scene.remove(this.burst)
    const count = 220
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -3.4 + (Math.random() - 0.5) * 2
      pos[i * 3 + 1] = 0.7 + (Math.random() - 0.5) * 2
      pos[i * 3 + 2] = 1.6 + (Math.random() - 0.5) * 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.burst = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x00ff88, size: 0.22, transparent: true, opacity: 1 }))
    this.scene.add(this.burst)
    this.burstLife = 1
  }

  private onPointerDown = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const targets = [...this.portals, ...(this.artifact ? [this.artifact] : [])]
    const hits = this.raycaster.intersectObjects(targets, false)
    if (!hits.length) return
    const hit = hits[0].object
    if (hit.userData.isArtifact) {
      this.triggerBurst()
      this.opts.onSecretFound()
    } else if (hit.userData.dest) {
      this.opts.onPortal(hit.userData.dest)
    }
  }

  private onResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private animate = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.animate)
    const t = this.clock.getElapsedTime()
    if (!this.opts.reducedMotion) {
      this.group.rotation.y = Math.sin(t * 0.08) * 0.25
      this.portals.forEach((p, i) => { p.rotation.y = t * 0.6 + i; p.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.04) })
      this.drifters.forEach((d, i) => { d.position.y += Math.sin(t + i) * 0.002; d.rotation.x += 0.005; d.rotation.y += 0.007 })
      if (this.particles) this.particles.rotation.y = t * 0.02
      if (this.artifact) this.artifact.rotation.y = t
    }
    if (this.burst && this.burstLife > 0) {
      this.burstLife -= 0.008
      const mat = this.burst.material as THREE.PointsMaterial
      mat.opacity = Math.max(0, this.burstLife)
      this.burst.scale.setScalar(1 + (1 - this.burstLife) * 2.2)
      if (this.burstLife <= 0) this.scene.remove(this.burst)
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }
}
