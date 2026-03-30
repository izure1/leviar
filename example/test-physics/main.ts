import { World } from '../../src/index.js'

const world = new World()
world.createCamera()

world.setGravity({ x: 0, y: -9.8 })

// 바닥 생성
world.createRectangle({
  attribute: {
    name: 'floor',
    className: 'physics-object',
    physics: 'static'
  },
  style: {
    width: 600,
    height: 50,
    color: '#444444'
  },
  transform: {
    position: { x: 0, y: -300, z: 0 }
  }
})

// 떨어지는 상자들 생성
for (let i = 0; i < 10; i++) {
  world.createRectangle({
    attribute: {
      className: 'physics-object box',
      physics: 'dynamic'
    },
    style: {
      width: 50,
      height: 50,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      opacity: 0.9
    },
    transform: {
      position: { x: (Math.random() - 0.5) * 200, y: 300 + Math.random() * 200, z: 0 }
    }
  })
}

// 클릭 이벤트로 힘 가하기
window.addEventListener('click', (e) => {
  const mx = e.clientX - window.innerWidth / 2;
  const my = window.innerHeight / 2 - e.clientY;

  const boxes = world.select('.box');
  let clicked = false;
  boxes.forEach(box => {
    const hw = (box.style.width ?? 0) / 2;
    const hh = (box.style.height ?? 0) / 2;
    const px = box.transform.position.x;
    const py = box.transform.position.y;

    // 단순 바운딩 박스 검사
    if (mx >= px - hw && mx <= px + hw && my >= py - hh && my <= py + hh) {
      // matter.js의 applyForce는 (body.position, force) 형태이므로
      // 힘의 크기는 질량에 비례하여 적절한 값을 사용합니다.
      const fx = (Math.random() - 0.5) * 50;
      const fy = Math.random() * 50 + 20;
      box.applyForce({ x: fx, y: fy });
      clicked = true;
    }
  });

  // 클릭한 박스가 없다면 배경 클릭으로 추가 박스 생성
  if (!clicked) {
    world.createRectangle({
      attribute: {
        className: 'physics-object box',
        physics: 'dynamic'
      },
      style: {
        width: 50,
        height: 50,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        opacity: 0.9
      },
      transform: {
        position: { x: mx, y: my, z: 0 }
      }
    });
  }
});

world.start()
