import { createDep } from './dep'
import { extend } from '@echo/shared/src'

let activeEffect = undefined
let shouldTrack = false
const targetMap = new WeakMap()

class ReactiveEffect {
  constructor (fn, scheduler) {
    console.log('创建 ReactiveEffect 对象')
    this.active = true
    this.deps = []
    this.fn = fn
    this.scheduler = scheduler
  }

  run () {
    console.log('run')
    if (!this.active) {
      return this.fn()
    }
    shouldTrack = true
    activeEffect = this
    console.log('执行用户传入的 fn')
    const result = this.fn()
    shouldTrack = false
    activeEffect = undefined
    return result
  }

  stop () {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect (effect) {
  effect.deps.forEach(dep => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}

export function effect (fn, options = {}) {
  const _effect = new ReactiveEffect(fn)
  extend(_effect, options)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop (runner) {
  runner.effect.stop()
}

export function track (target, type, key) {
  if (!isTracking()) {
    return
  }
  console.log(`触发 track -> target: ${target} type:${type} key:${key}`)
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep()
    depsMap.set(key, dep)
  }
  trackEffects(dep)
}

export function trackEffects (dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger (target, type, key) {
  let deps = []
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  deps.push(dep)
  const effects = []
  deps.forEach(dep => {
    effects.push(...dep)
  })
  triggerEffects(createDep(effects))
}

export function isTracking () {
  return shouldTrack && activeEffect !== undefined
}

export function triggerEffects (dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
export {
  ReactiveEffect
}