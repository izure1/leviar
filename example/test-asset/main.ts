import { World } from '../../src/index.js'

// ─── 스프라이트 시트 생성 (12프레임 × 80×80) ──────────────
function generateSpriteSheet(): string {
  const FRAMES = 12
  const FW = 80
  const FH = 80

  const c = document.createElement('canvas')
  c.width = FW * FRAMES
  c.height = FH
  const ctx = c.getContext('2d')!

  for (let i = 0; i < FRAMES; i++) {
    const hue = (i / FRAMES) * 360
    ctx.fillStyle = `hsl(${hue}, 60%, 25%)`
    ctx.fillRect(i * FW, 0, FW, FH)

    ctx.fillStyle = `hsl(${hue}, 90%, 65%)`
    ctx.beginPath()
    ctx.arc(i * FW + FW / 2, FH / 2, 26, 0, Math.PI * 2)
    ctx.fill()

    const eyeX = i * FW + FW / 2 + Math.round(Math.cos((i / FRAMES) * Math.PI * 2) * 6)
    const eyeY = FH / 2 - 8
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(eyeX - 6, eyeY, 5, 0, Math.PI * 2)
    ctx.arc(eyeX + 6, eyeY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(eyeX - 6, eyeY + 1, 2, 0, Math.PI * 2)
    ctx.arc(eyeX + 6, eyeY + 1, 2, 0, Math.PI * 2)
    ctx.fill()

    const smile = Math.sin((i / FRAMES) * Math.PI * 2 + Math.PI) * 6
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(i * FW + FW / 2, FH / 2 + 6, 8, 0 + smile * 0.05, Math.PI - smile * 0.05)
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${i}`, i * FW + FW / 2, FH - 6)
  }

  return c.toDataURL('image/png')
}

// ─── 단색 이미지 생성 ──────────────────────────────────────
function generateColorImage(color: string, w: number, h: number): string {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  for (let x = -h; x < w; x += 20) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + h, h)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, w - 4, h - 4)
  return c.toDataURL('image/png')
}

// ─── 월드 & 로더 설정 ─────────────────────────────────────
const world = new World()
const camera = world.createCamera()
camera.transform.position.z = -100

const loader = world.createLoader()
const manager = world.createSpriteManager()

const spriteSheetUrl = generateSpriteSheet()
const imgRedUrl = generateColorImage('#c0392b', 160, 120)
const imgBlueUrl = generateColorImage('#2980b9', 200, 150)

await loader.load({
  'sprite-sheet': spriteSheetUrl,
  'img-red': imgRedUrl,
  'img-blue': imgBlueUrl,
})

manager.create({ name: 'spin', src: 'sprite-sheet', frameWidth: 80, frameHeight: 80, frameRate: 12, loop: true, start: 0, end: 12 })
manager.create({ name: 'slow-spin', src: 'sprite-sheet', frameWidth: 80, frameHeight: 80, frameRate: 4, loop: true, start: 0, end: 12 })

function label(text: string, x: number, y: number, z: number) {
  world.createText({
    attribute: { text },
    style: { color: '#888', fontSize: 13, fontFamily: 'monospace' },
    transform: { position: { x, y, z } },
  })
}

label('① LveImage (img-red, 160×120)', -500, -250, 300)
world.createImage({ attribute: { src: 'img-red' }, style: { width: 160, height: 120 }, transform: { position: { x: -420, y: -180, z: 300 } } })

label('② LveImage (auto size)', -500, -30, 300)
world.createImage({ attribute: { src: 'img-blue' }, transform: { position: { x: -420, y: 40, z: 300 } } })

label('③ Placeholder (no src)', -500, 160, 300)
world.createImage({ style: { width: 100, height: 100 }, transform: { position: { x: -450, y: 230, z: 300 } } })

label('④ Sprite (spin 12fps)', 50, -250, 300)
const sprFast = world.createSprite({ attribute: { src: 'sprite-sheet' }, style: { width: 100, height: 100 }, transform: { position: { x: 100, y: -180, z: 300 } } })
sprFast.play('spin', manager)

label('⑤ Sprite (slow-spin 4fps)', 50, -30, 300)
const sprSlow = world.createSprite({ attribute: { src: 'sprite-sheet' }, style: { width: 120, height: 120 }, transform: { position: { x: 110, y: 60, z: 300 } } })
sprSlow.play('slow-spin', manager)

label('⑥ 원경 (z=600)', 250, 200, 300)
world.createImage({ attribute: { src: 'img-red' }, style: { width: 200, height: 150 }, transform: { position: { x: 350, y: 280, z: 600 } } })

window.addEventListener('mousemove', (e) => {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  camera.transform.position.x = (e.clientX - cx) * 0.1
  camera.transform.position.y = (e.clientY - cy) * 0.1
})

world.start()
