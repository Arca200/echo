let reactivrEffectStack = []
window.currentReactiveEffect = undefined

function createReactiveEffect (fn, scheduler) {
  const reactiveEffect = function () {
    if (!reactivrEffectStack.includes(reactiveEffect)) {
      try {
        reactivrEffectStack.push(reactiveEffect)
        currentReactiveEffect = reactiveEffect
        fn()
      } finally {
        reactivrEffectStack.pop()
        currentReactiveEffect = reactivrEffectStack[reactivrEffectStack.length - 1]
      }
    }
  }
  reactiveEffect.scheduler = scheduler
  return reactiveEffect
}

function effect (fn, option = { lazy: false, scheduler: undefined }) {
  const reactiveEffect = createReactiveEffect(fn, option.scheduler)
  if (option.lazy !== true) {
    reactiveEffect()
  }
}

const targetMap = new WeakMap()

function Track (target, key) {
  if (!currentReactiveEffect) {
    return
  }
  let depMap = targetMap.get(target)
  if (!depMap) {
    targetMap.set(target, (depMap = new Map))
  }
  let dep = depMap.get(key)
  if (!dep) {
    depMap.set(key, (dep = new Set))
  }
  if (!dep.has(currentReactiveEffect)) {
    dep.add(currentReactiveEffect)
  }
}

function Trigger (target, key) {
  let depMap = targetMap.get(target)
  if (!depMap) {
    return
  }
  const effectSet = new Set()
  depMap.get(key).forEach(effect => {
    effectSet.add(effect)
  })
  effectSet.forEach(effect => {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect()
    }
  })
}

export {
  effect, Trigger, Track
}