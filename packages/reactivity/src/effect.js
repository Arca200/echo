class ReactiveEffect {
  constructor (fn, scheduler = null) {
    this._fn = fn
    this.scheduler = scheduler
    this.deps = new Set
  }

  run () {
    activeEffect = this
    return this._fn()
  }

  stop () {
    cleanEffect(this)
  }
}

function cleanEffect (effect) {
  effect.deps.forEach(dep => dep.delete(effect))
  effect.deps.clear()
}

window.activeEffect=null
let targetMap = new Map

function effect (fn, options = null) {
  let scheduler = (options && options.scheduler) ? options.scheduler : null
  const _effect = new ReactiveEffect(fn, scheduler)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  // effect函数在执行完毕之后就将activeEffect设为null，这样在effect函数之外就不会收集依赖了
  activeEffect = null
  return runner
}

function track (target, key) {
  // effect函数执行完毕之后就不应该收集依赖了，直接返回
  if (!activeEffect) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map))
  }

  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set))
  }
  // 触发依赖的情况下收集依赖就会跳过收集，但是可能会创建新的proxy对象
  trackEffect(deps)
}

function trackEffect (deps) {
  if (!activeEffect) {
    return
  }
  if (!deps.has(activeEffect)) {
    deps.add(activeEffect)
    activeEffect.deps.add(deps)
  }
}

function trigger (target, key) {
  const deps = targetMap.get(target).get(key)
  triggerEffect(deps)
  // 防止在effect之外收集依赖
  activeEffect = null
}

function triggerEffect (deps) {
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      // 在此期间执行依赖的话，由于依赖已经添加在deps中了，所以会直接跳过
      effect.run()
    }
  }
}

function stop (runner) {
  runner.effect.stop()
}

export {
  track, trigger, effect, stop, trackEffect, triggerEffect
}