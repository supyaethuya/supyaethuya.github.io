import { useEffect, useRef } from "react";

const CHARS =
  "ကခဂဃငစဆဇဈညဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠအဣဤဥဦဧဩဪ၀၁၂၃၄၅၆၇၈၉"

/*
    This component is for the background animation of the characters falling from the top-left side of the webpage
    Applying the physics theory of a rock, which in this case is the character, falling into ocean, which is the webpage.
    Need to make it more responsive wit the collision.
*/
export default function HomeBackgroundSimple() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext("2d")

    let w = 0
    let h = 0
    const dpr = window.devicePixelRatio || 1

    const pieces = []
    const maxPieces = 460

    // This functions is for making the components as obstacles
    let obstacles = []

    function readObstacles() {
     const els = document.querySelectorAll("[data-rock]")
     obstacles = Array.from(els).map((el) => el.getBoundingClientRect())
    }

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    readObstacles()
    window.addEventListener("resize", resize)

    function randChar() {
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    }

    function spawn() {
      if (pieces.length >= maxPieces) return
      const size = 18 + Math.random() * 42
      const r = size * 0.55

      const fromLeft = Math.random() < 0.5
      const x = fromLeft ? 20 + Math.random() * 60     // top-left region
                : w - (20 + Math.random() * 60)       // top-right region

      pieces.push({
        ch: randChar(),
        x: x, // for the whole reagion, Math.random() * w
        y: -50 - Math.random() * 120,
        vx: 0.4 + Math.random() * 0.8, // slight push right so bottom fills first
        vy: 0,
        ang: (Math.random() - 0.5) * Math.PI * 2,
        vang: (Math.random() - 0.5) * 0.06,
        size,
        r,
      })
    }

    let spawnCount = 0
    const spawnTimer = setInterval(() => {
      spawn()
      spawnCount++
      // after some pieces, stop pushing right so left stacks upward
      if (spawnCount > 120) {
        for (const p of pieces) p.vx *= 0.2
      }
    }, 80)


    function resolveCollisions() {
        // Spatial hashing so we don't do slow O(n^2) checks
        const cell = 80 // size of hash cell (can tweak)
        const buckets = new Map()

        function key(cx, cy) {
            return `${cx},${cy}`
        }

        // Put pieces into buckets
        for (const p of pieces) {
            const cx = Math.floor(p.x / cell)
            const cy = Math.floor(p.y / cell)
            const k = key(cx, cy)
            if (!buckets.has(k)) buckets.set(k, [])
            buckets.get(k).push(p)
        }

        // Check collisions inside each bucket + neighbor buckets
        const neighborOffsets = [
            [0, 0],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
        ]

        for (const [k, list] of buckets.entries()) {
            const [cxStr, cyStr] = k.split(",")
            const cx = Number(cxStr)
            const cy = Number(cyStr)

            for (const [ox, oy] of neighborOffsets) {
            const nk = key(cx + ox, cy + oy)
            const otherList = buckets.get(nk)
            if (!otherList) continue

            for (let i = 0; i < list.length; i++) {
                const a = list[i]
                for (let j = 0; j < otherList.length; j++) {
                const b = otherList[j]
                if (a === b) continue

                // Avoid double-resolving when comparing same bucket
                if (k === nk && j <= i) continue

                const dx = b.x - a.x
                const dy = b.y - a.y
                const dist2 = dx * dx + dy * dy
                const minDist = a.r + b.r

                if (dist2 > 0 && dist2 < minDist * minDist) {
                    const dist = Math.sqrt(dist2)
                    const overlap = (minDist - dist)

                    // Push apart (split the correction)
                    const nx = dx / dist
                    const ny = dy / dist

                    const push = overlap * 0.5
                    a.x -= nx * push
                    a.y -= ny * push
                    b.x += nx * push
                    b.y += ny * push

                    // Kill bounce: damp velocities along the collision normal
                    const avn = a.vx * nx + a.vy * ny
                    const bvn = b.vx * nx + b.vy * ny
                    const damp = 0.6 // higher = more "water/rock" feel

                    a.vx -= avn * nx * damp
                    a.vy -= avn * ny * damp
                    b.vx -= bvn * nx * damp
                    b.vy -= bvn * ny * damp

                    // Extra drag when touching
                    a.vx *= 0.98
                    a.vy *= 0.98
                    b.vx *= 0.98
                    b.vy *= 0.98
                }
                }
            }
            }
        }
    }
    // This function is for making the obstacles collide with the characters
    function resolveObstacleCollisions() {
        // add a little padding so letters don't visually touch the UI
        const pad = 8

        for (const p of pieces) {
            for (const r of obstacles) {
            const left = r.left - pad
            const right = r.right + pad
            const top = r.top - pad
            const bottom = r.bottom + pad

            // closest point on rectangle to circle center
            const closestX = Math.max(left, Math.min(p.x, right))
            const closestY = Math.max(top, Math.min(p.y, bottom))

            const dx = p.x - closestX
            const dy = p.y - closestY
            const dist2 = dx * dx + dy * dy

            if (dist2 > 0 && dist2 < p.r * p.r) {
                const dist = Math.sqrt(dist2)
                const overlap = p.r - dist
                const nx = dx / dist
                const ny = dy / dist

                // push the character out of the UI rectangle
                p.x += nx * overlap
                p.y += ny * overlap

                // remove “bounce” (underwater rock)
                const vn = p.vx * nx + p.vy * ny
                p.vx -= vn * nx * 0.85
                p.vy -= vn * ny * 0.85

                // extra drag when touching UI
                p.vx *= 0.97
                p.vy *= 0.97
            }
            }
        }
    }
    // Simple “rock in water” update:
    // gravity + heavy drag + floor & wall settle, no bounce
    function step() {
      // background
      ctx.fillStyle = "#242424"
      ctx.fillRect(0, 0, w, h)

      for (const p of pieces) {
        // gravity
        p.vy += 0.18

        // underwater drag
        p.vx *= 0.985
        p.vy *= 0.985

        // integrate
        p.x += p.vx
        p.y += p.vy

        // rotate slowly, then settle
        p.ang += p.vang
        p.vang *= 0.99

        // collide with floor (no bounce)
        const floorY = h - 10
        if (p.y > floorY) {
          p.y = floorY
          p.vy = 0
          p.vx *= 0.95
          p.vang *= 0.9
        }

        // collide with walls (no bounce)
        const leftX = 10
        const rightX = w - 10
        if (p.x < leftX) {
          p.x = leftX
          p.vx = 0
        } else if (p.x > rightX) {
          p.x = rightX
          p.vx = 0
        }

        // draw
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.ang)
        ctx.fillStyle = "white"
        ctx.font = `${Math.floor(p.size)}px system-ui, Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(p.ch, 0, 0)
        ctx.restore()
      }

      // prevent overlaps (do a few passes for tighter packing)
      for (let k = 0; k < 2; k++) resolveCollisions()
    
      // keep obstacle rectangles up to date (in case layout changes)
      readObstacles()
      // collide with UI (run a couple passes for stronger separation)
      for (let k = 0; k < 2; k++) resolveObstacleCollisions()
    
      requestAnimationFrame(step)
    }

    const raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(spawnTimer)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}