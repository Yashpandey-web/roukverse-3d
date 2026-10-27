// Pure, testable parkour physics helpers — no DOM, no Three.js.
// A platform is an axis-aligned box; the player is a point with a half-size
// used for landing checks. Keeping this logic pure lets us unit-test it
// without a browser (see scripts/test-physics.mjs after build, and the
// test notes in README.md).
export type Platform = { x: number; y: number; z: number; w: number; d: number }
export type PlayerState = { x: number; y: number; z: number; vy: number; grounded: boolean }

export const GRAVITY = -28
export const JUMP_VELOCITY = 11.5
export const MOVE_SPEED = 7

export function isAbovePlatform(p: PlayerState, plat: Platform, half = 0.4): boolean {
  return (
    p.x >= plat.x - plat.w / 2 - half &&
    p.x <= plat.x + plat.w / 2 + half &&
    p.z >= plat.z - plat.d / 2 - half &&
    p.z <= plat.z + plat.d / 2 + half
  )
}

// One physics step. Returns true if the player just landed.
export function stepPhysics(p: PlayerState, platforms: Platform[], dt: number, moveX: number, moveZ: number): boolean {
  const prevY = p.y
  p.x += moveX * MOVE_SPEED * dt
  p.z += moveZ * MOVE_SPEED * dt
  p.vy += GRAVITY * dt
  p.y += p.vy * dt
  p.grounded = false
  if (p.vy <= 0) {
    for (const plat of platforms) {
      // Crossed the platform top this frame, while horizontally over it.
      if (prevY >= plat.y && p.y <= plat.y && isAbovePlatform(p, plat)) {
        p.y = plat.y
        p.vy = 0
        p.grounded = true
        return true
      }
    }
  }
  return false
}

export function hasFallen(p: PlayerState): boolean {
  return p.y < -12
}
