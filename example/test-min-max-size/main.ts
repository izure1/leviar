import { World } from '../../src/index.js'

const world = new World()
const cam = world.createCamera({ transform: { position: { z: -100 } } })
world.camera = cam

// 에셋 미리 로드
await world.loader.load({
  'test': '../asset/image/berry.png'
})

const box = world.createRectangle({
  style: {
    width: 200,
    height: 200,
    minWidth: 100,
    maxWidth: 400,
    minHeight: 100,
    maxHeight: 400,
    color: '#13132a',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#c77dff',
  },
  transform: { position: { x: 100, y: 0, z: 0 } }
})

const text = world.createText({
  attribute: { text: '' },
  style: { textAlign: 'center' },
  transform: { position: { z: 0 } }
})
box.addChild(text)

// ─── Text: minWidth / maxWidth / minHeight / maxHeight ────────────────────────

function label(t: string, x: number, y: number) {
  world.createText({
    attribute: { text: t },
    style: { color: '#666', fontSize: 13, fontFamily: 'sans-serif' },
    transform: { position: { x, y, z: 0 } },
  })
}

// ① maxWidth → word-wrap 경계 (width 없이)
label('① maxWidth → word-wrap', -350, -250)
world.createRectangle({
  style: { color: '#13132a', width: 220, height: 80, borderColor: '#7ec8e3', borderWidth: 1 },
  transform: { position: { x: -350, y: -190, z: 0 } },
})
world.createText({
  attribute: { text: 'maxWidth wraps this long sentence automatically.' },
  style: { color: '#7ec8e3', fontSize: 15, fontFamily: 'sans-serif', maxWidth: 220, zIndex: 1 },
  transform: { position: { x: -350, y: -190, z: 0 } },
})

// ② minWidth → 짧은 텍스트도 최소 폭 보장, textAlign: center 동작 확인
label('② minWidth + center align', -350, -80)
world.createRectangle({
  style: { color: '#13132a', width: 200, height: 40, borderColor: '#f4a261', borderWidth: 1 },
  transform: { position: { x: -350, y: -35, z: 0 } },
})
world.createText({
  attribute: { text: 'Hi' },
  style: { color: '#f4a261', fontSize: 18, fontFamily: 'sans-serif', minWidth: 200, textAlign: 'center', zIndex: 1 },
  transform: { position: { x: -350, y: -35, z: 0 } },
})

// ③ maxHeight → 초과 라인 클리핑
label('③ maxHeight → clip', -350, 60)
world.createRectangle({
  style: { color: '#13132a', width: 220, height: 50, borderColor: '#2ec4b6', borderWidth: 1 },
  transform: { position: { x: -350, y: 105, z: 0 } },
})
world.createText({
  attribute: { text: 'Line 1\nLine 2\nLine 3 clipped\nLine 4 clipped' },
  style: { color: '#2ec4b6', fontSize: 17, fontFamily: 'sans-serif', width: 220, maxHeight: 50, zIndex: 1 },
  transform: { position: { x: -350, y: 105, z: 0 } },
})

// ④ minHeight → 텍스트가 짧아도 캔버스 높이 최소 보장
label('④ minHeight → expand canvas', -350, 200)
world.createRectangle({
  style: { color: '#13132a', width: 220, height: 80, borderColor: '#e71d36', borderWidth: 1 },
  transform: { position: { x: -350, y: 250, z: 0 } },
})
world.createText({
  attribute: { text: 'Short' },
  style: { color: '#e71d36', fontSize: 18, fontFamily: 'sans-serif', minHeight: 80, zIndex: 1 },
  transform: { position: { x: -350, y: 250, z: 0 } },
})

// ─── Image: min/max constraints (Aspect Ratio Preservation) ─────────────────

label('⑤ Image maxWidth → keep aspect ratio', 350, -250)
world.createRectangle({
  style: { color: 'transparent', width: 100, height: 100, borderColor: '#7ec8e3', borderWidth: 1 },
  transform: { position: { x: 350, y: -190, z: 0 } },
})
world.createImage({
  attribute: { src: 'test' },
  style: { maxWidth: 100 },
  transform: { position: { x: 350, y: -190, z: 0 } }
})

label('⑥ Image maxHeight → keep aspect ratio', 350, -80)
world.createRectangle({
  style: { color: 'transparent', width: 200, height: 50, borderColor: '#2ec4b6', borderWidth: 1 },
  transform: { position: { x: 350, y: -35, z: 0 } },
})
world.createImage({
  attribute: { src: 'test' },
  style: { maxHeight: 50 },
  transform: { position: { x: 350, y: -35, z: 0 } }
})

label('⑦ Image minWidth + minHeight (Aspect ratio scaling)', 350, 60)
world.createRectangle({
  style: { color: 'transparent', width: 300, height: 150, borderColor: '#f4a261', borderWidth: 1 },
  transform: { position: { x: 350, y: 165, z: 0 } },
})
world.createImage({
  attribute: { src: 'test' },
  style: { minWidth: 300, minHeight: 150 }, // Both constraints applied, the more restrictive one drives scale up
  transform: { position: { x: 350, y: 165, z: 0 } }
})

world.start()

// UI 로직
const inputW = document.getElementById('input-width') as HTMLInputElement
const inputMinW = document.getElementById('input-min') as HTMLInputElement
const inputMaxW = document.getElementById('input-max') as HTMLInputElement
const valW = document.getElementById('val-width')!
const valMinW = document.getElementById('val-min')!
const valMaxW = document.getElementById('val-max')!

const inputH = document.getElementById('input-height') as HTMLInputElement
const inputMinH = document.getElementById('input-minh') as HTMLInputElement
const inputMaxH = document.getElementById('input-maxh') as HTMLInputElement
const valH = document.getElementById('val-height')!
const valMinH = document.getElementById('val-minh')!
const valMaxH = document.getElementById('val-maxh')!

function updateSize() {
  const w = parseFloat(inputW.value)
  const minW = parseFloat(inputMinW.value)
  const maxW = parseFloat(inputMaxW.value)

  const h = parseFloat(inputH.value)
  const minH = parseFloat(inputMinH.value)
  const maxH = parseFloat(inputMaxH.value)

  valW.innerText = w.toString()
  valMinW.innerText = minW.toString()
  valMaxW.innerText = maxW.toString()

  valH.innerText = h.toString()
  valMinH.innerText = minH.toString()
  valMaxH.innerText = maxH.toString()

  box.style.width = w
  box.style.minWidth = minW
  box.style.maxWidth = maxW

  box.style.height = h
  box.style.minHeight = minH
  box.style.maxHeight = maxH

  const actualW = Math.max(minW, Math.min(w, maxW))
  const actualH = Math.max(minH, Math.min(h, maxH))

  text.attribute.text = `<style fontSize="18" color="#fff" lineHeight="1.5">W: <style color="#aaa">${w}</style> | H: <style color="#aaa">${h}</style>
Min W: <style color="#7ec8e3">${minW}</style> | Max W: <style color="#ff7eb3">${maxW}</style>
Min H: <style color="#7ec8e3">${minH}</style> | Max H: <style color="#ff7eb3">${maxH}</style>

<style fontSize="24" color="#c77dff" fontWeight="bold">Actual: ${actualW} x ${actualH}</style></style>`
}

inputW.addEventListener('input', updateSize)
inputMinW.addEventListener('input', updateSize)
inputMaxW.addEventListener('input', updateSize)
inputH.addEventListener('input', updateSize)
inputMinH.addEventListener('input', updateSize)
inputMaxH.addEventListener('input', updateSize)

console.log(world)

updateSize()
