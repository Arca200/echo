function isObject (param) {
  return Object.prototype.toString.call(param) === '[object Object]'
}

function hasChanged (param1, param2) {
  return param1 !== param2
}

class ReactiveEffect {
  constructor (fn, scheduler = null) {
    this._fn = fn;
    this.scheduler = scheduler;
    this.deps = new Set;
  }

  run () {
    activeEffect = this;
    return this._fn()
  }

  stop () {
    cleanEffect(this);
  }
}

function cleanEffect (effect) {
  effect.deps.forEach(dep => dep.delete(effect));
  effect.deps.clear();
}

window.activeEffect=null;
let targetMap = new Map;

function effect (fn, options = null) {
  let scheduler = (options && options.scheduler) ? options.scheduler : null;
  const _effect = new ReactiveEffect(fn, scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  // effect函数在执行完毕之后就将activeEffect设为null，这样在effect函数之外就不会收集依赖了
  activeEffect = null;
  return runner
}

function track (target, key) {
  // effect函数执行完毕之后就不应该收集依赖了，直接返回
  if (!activeEffect) {
    return
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map));
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set));
  }
  // 触发依赖的情况下收集依赖就会跳过收集，但是可能会创建新的proxy对象
  trackEffect(deps);
}

function trackEffect (deps) {
  if (!activeEffect) {
    return
  }
  if (!deps.has(activeEffect)) {
    deps.add(activeEffect);
    activeEffect.deps.add(deps);
  }
}

function trigger (target, key) {
  const deps = targetMap.get(target).get(key);
  triggerEffect(deps);
  // 防止在effect之外收集依赖
  activeEffect = null;
}

function triggerEffect (deps) {
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      // 在此期间执行依赖的话，由于依赖已经添加在deps中了，所以会直接跳过
      effect.run();
    }
  }
}

function stop (runner) {
  runner.effect.stop();
}

function createGet (isReadOnly = false, isShallow = false) {
  return (target, key) => {
    if (key === 'isReactive') {
      return !isReadOnly
    } else if (key === 'isReadOnly') {
      return isReadOnly
    }
    const res = Reflect.get(target, key);
    if (!isReadOnly) {
      track(target, key);
    }
    if (!isShallow && isObject(res)) {
      return isReadOnly ? readonly(res) : reactive(res)
    } else {
      return res
    }
  }
}

function createSet (isReadOnly = false) {
  return (target, key, val) => {
    if (isReadOnly) {
      console.error('只读响应式对象不可被赋值');
    }
    const res = Reflect.set(target, key, val);
    //TODO 触发依赖
    trigger(target, key);
    return res
  }

}

const reactiveHandler = {
  get: createGet(),
  set: createSet()
};
const shallowHandler = {
  get: createGet(false, true),
  set: createSet()
};
const readOnlyHandler = {
  get: createGet(true, false),
  set: createSet(true)
};
const shallowReadOnlyHandler = {
  get: createGet(true, true),
  set: createSet(true)
};

const reactiveMap = new WeakMap();
const readOnlyMap = new WeakMap();

function createReactiveObject (target, isReadOnly, handler) {
  if (isObject(target) !== true) {
    console.error('必须传入一个对象');
  }
  const proxyMap = isReadOnly ? readOnlyMap : reactiveMap;
  let proxy = proxyMap.get(target);
  if (proxy) {
    return proxy
  } else {
    proxy = new Proxy(target, handler);
    proxyMap.set(target, proxy);
    return proxy
  }
}

function reactive (target) {
  return createReactiveObject(target, false, reactiveHandler)
}

function readonly (target) {
  return createReactiveObject(target, true, readOnlyHandler)
}

function shallowReactive (target) {
  return createReactiveObject(target, false, shallowHandler)
}

function shallowReadonly (target) {
  return createReactiveObject(target, true, shallowReadOnlyHandler)
}

class RefImpl {
  constructor (value) {
    this._rawValue = value;
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = new Set;
  }

  get value () {
    trackEffect(this.dep);
    return this._value
  }

  set value (newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      triggerEffect(this.dep);
    }

  }
}

function ref (value) {
  return new RefImpl(value)
}

function isRef (ref) {
  return ref instanceof RefImpl
}

function unRef (ref) {
  return isRef(ref) ? ref.value : ref
}

export { effect, isRef, reactive, readonly, ref, shallowReactive, shallowReadonly, stop, unRef };
//# sourceMappingURL=reactivity.esm-bundler.js.map
