## 에니메이션 효과

객체에 애니메이션 효과를 지정할 수 있습니다. 이 값은 객체의 속성을 부드럽게 바꾸는데 사용합니다. JQuery의 animate와 유사합니다. 숫자만 가능합니다.

```typescript
const text = world.createText({
  attribute: {
    text: 'Hello, World!',
  },
  style: {
    width: 100,
    height: 100,
  },
})

// animate(target, duration, easing?)
// 1초에 걸쳐 width, height, position.x, position.y, position.z 를 easeInOut 방식으로 부드럽게 변경합니다.
// easing이 주어지지 않으면 linear입니다.
text.animate({
  style: {
    width: 200,
    height: 200,
  },
  position: {
    x: 100,
    y: 100,
    z: 100,
  }
}, 1000, 'easeInOut')
```

만일 오브젝트(Object)가 주어진다면, 재귀적으로 속성을 찾아서 애니메이션을 적용합니다.

```typescript
const text = world.createText({
  dataset: {
    sample: {
      custom: {
        a: 200,
        b: 200,
      }
    }
  }
})

text.animate({
  dataset: {
    sample: {
      custom: {
        a: 300,
        b: 300,
      }
    }
  }
}, 1000)
```

## 이징

이징은 애니메이션의 속도를 조절하는 함수입니다. 다음과 같은 이징을 사용할 수 있습니다.

- linear
- easeIn
- easeOut
- easeInOut
- easeInQuad
- easeOutQuad
- easeInOutQuad
- easeInCubic
- easeOutCubic
- easeInOutCubic
- easeInQuart
- easeOutQuart
- easeInOutQuart
- easeInQuint
- easeOutQuint
- easeInOutQuint
- easeInSine
- easeOutSine
- easeInOutSine
- easeInExpo
- easeOutExpo
- easeInOutExpo
- easeInCirc
- easeOutCirc
- easeInOutCirc
- easeInBack
- easeOutBack
- easeInOutBack
- easeInElastic
- easeOutElastic
- easeInOutElastic
- easeInBounce
- easeOutBounce
- easeInOutBounce

## 복합 대입 연산자

animate는 복합 대입 연산자를 지원해야합니다.

```typescript
const text = world.createText({
  attribute: {
    text: 'Hello, World!',
  },
  style: {
    width: 100,
    height: 100,
  },
})

text.animate({
  style: {
    width: '+=200',
    height: '-=200',
  },
  position: {
    x: '*=100',
    y: '/=100',
  }
}, 1000, 'easeInOut')
```

## 별도의 Animation 객체 생성

월드에 종속되지 않는 순수 Animation 객체를 생성할 수 있습니다.
이는 외부 라이브러리를 사용하거나, 객체에 종속되지 않는 애니메이션을 구현할 때 유용합니다.

```typescript
import { Animation } from 'lve4'

// 초기값 지정
const animation = new Animation({
  style: {
    width: 200,
    height: 200,
  },
  position: {
    x: 100,
    y: 100,
    z: 100,
  }
})

const duration = 1000
const easing = 'easeInOut'

animation.start((state) => {
  console.log(state.style.width, state.style.height, state.position.x, state.position.y, state.position.z)
}, duration, easing)

animation.pause() // 일시 정지
animation.resume() // 일시 정지 재개. pause된 시점부터 남은 시간만큼 다시 시작합니다.
animation.stop() // 중지. 다시 시작하려면 start()를 호출해야 하며, 다시 초기값으로 시작합니다.
```
