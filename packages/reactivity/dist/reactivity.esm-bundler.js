// 用于存储所有的 effect 对象
function createDep (effects) {
  const dep = new Set(effects);
  return dep
}

function isObject (param) {
  return Object.prototype.toString.call(param) === '[object Object]'
}

function hasChanged (param1, param2) {
  return param1 !== param2
}

const extend = Object.assign;

let activeEffect = undefined;
let shouldTrack = false;
const targetMap = new WeakMap();

class ReactiveEffect {
  constructor (fn, scheduler) {
    console.log('创建 ReactiveEffect 对象');
    this.active = true;
    this.deps = [];
    this.fn = fn;
    this.scheduler = scheduler;
  }

  run () {
    console.log('run');
    if (!this.active) {
      return this.fn()
    }
    shouldTrack = true;
    activeEffect = this;
    console.log('执行用户传入的 fn');
    const result = this.fn();
    shouldTrack = false;
    activeEffect = undefined;
    return result
  }

  stop () {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect (effect) {
  effect.deps.forEach(dep => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

function effect (fn, options = {}) {
  const _effect = new ReactiveEffect(fn);
  extend(_effect, options);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner
}

function stop (runner) {
  runner.effect.stop();
}

function track (target, type, key) {
  if (!isTracking()) {
    return
  }
  console.log(`触发 track -> target: ${target} type:${type} key:${key}`);
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = createDep();
    depsMap.set(key, dep);
  }
  trackEffects(dep);
}

function trackEffects (dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

function trigger (target, type, key) {
  let deps = [];
  const depsMap = targetMap.get(target);
  if (!depsMap) return
  const dep = depsMap.get(key);
  deps.push(dep);
  const effects = [];
  deps.forEach(dep => {
    effects.push(...dep);
  });
  triggerEffects(createDep(effects));
}

function isTracking () {
  return shouldTrack && activeEffect !== undefined
}

function triggerEffects (dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const isExistInReactiveMap = () =>
            key === ReactiveFlags.RAW && receiver === reactiveMap.get(target);

        const isExistInReadonlyMap = () =>
            key === ReactiveFlags.RAW && receiver === readonlyMap.get(target);

        const isExistInShallowReadonlyMap = () =>
            key === ReactiveFlags.RAW && receiver === shallowReadonlyMap.get(target);

        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        } else if (
            isExistInReactiveMap() ||
            isExistInReadonlyMap() ||
            isExistInShallowReadonlyMap()
        ) {
            return target;
        }

        const res = Reflect.get(target, key, receiver);

        // 问题：为什么是 readonly 的时候不做依赖收集呢
        // readonly 的话，是不可以被 set 的， 那不可以被 set 就意味着不会触发 trigger
        // 所有就没有收集依赖的必要了

        if (!isReadonly) {
            // 在触发 get 的时候进行依赖收集
            track(target, "get", key);
        }

        if (shallow) {
            return res;
        }

        if (isObject(res)) {
            // 把内部所有的是 object 的值都用 reactive 包裹，变成响应式对象
            // 如果说这个 res 值是一个对象的话，那么我们需要把获取到的 res 也转换成 reactive
            // res 等于 target[key]
            return isReadonly ? readonly(res) : reactive(res);
        }

        return res;
    };
}

function createSetter() {
    return function set(target, key, value, receiver) {
        const result = Reflect.set(target, key, value, receiver);

        // 在触发 set 的时候进行触发依赖
        trigger(target, "set", key);

        return result;
    };
}

const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        // readonly 的响应式对象不可以修改值
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        );
        return true;
    },
};
const mutableHandlers = {
    get,
    set,
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        // readonly 的响应式对象不可以修改值
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        );
        return true;
    },
};

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();

const ReactiveFlags = {
  IS_REACTIVE: '__v_isReactive',
  IS_READONLY: '__v_isReadonly',
  RAW: '__v_raw',
};

function reactive (target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

function readonly (target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers)
}

function shallowReadonly (target) {
  return createReactiveObject(
    target,
    shallowReadonlyMap,
    shallowReadonlyHandlers
  )
}

function isProxy (value) {
  return isReactive(value) || isReadonly(value)
}

function isReadonly (value) {
  return !!value[ReactiveFlags.IS_READONLY]
}

function isReactive (value) {
  // 如果 value 是 proxy 的话
  // 会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话
  // 那么会返回 undefined ，那么就需要转换成布尔值
  return !!value[ReactiveFlags.IS_REACTIVE]
}

function createReactiveObject (target, proxyMap, baseHandlers) {
  // 核心就是 proxy
  // 目的是可以侦听到用户 get 或者 set 的动作

  // 如果命中的话就直接返回就好了
  // 使用缓存做的优化点
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers);

  // 把创建好的 proxy 给存起来，
  proxyMap.set(target, proxy);
  return proxy
}

class RefImpl {
  constructor (value) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = createDep();
    this.__v_isRef = true;
  }

  get value () {
    trackRefValue(this);
    return this._value
  }

  set value (newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerRefValue(this);
    }
  }
}

function ref (value) {
  return createRef(value)
}

function convert (value) {
  return isObject(value) ? reactive(value) : value
}

function createRef (value) {
  const refImpl = new RefImpl(value);
  return refImpl
}

function triggerRefValue (ref) {
  triggerEffects(ref.dep);
}

function trackRefValue (ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

const shallowUnwrapHandlers = {
  get (target, key, receiver) {
    return unRef(Reflect.get(target, key, receiver))
  },
  set (target, key, value, receiver) {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      return (target[key].value = value)
    } else {
      return Reflect.set(target, key, value, receiver)
    }
  },
};

function proxyRefs (objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

function unRef (ref) {
  return isRef(ref) ? ref.value : ref
}

function isRef (value) {
  return !!value.__v_isRef
}

class ComputedRefImpl {
  constructor (getter) {
    this._dirty = true;
    this.dep = createDep();
    this.effect = new ReactiveEffect(getter, () => {
      if (this._dirty) return

      this._dirty = true;
      triggerRefValue(this);
    });
  }

  get value () {
    trackRefValue(this);

    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }

    return this._value
  }
}

function computed (getter) {
  return new ComputedRefImpl(getter)
}

export { ReactiveEffect, computed, effect, isProxy, isReactive, isReadonly, isRef, proxyRefs, reactive, readonly, ref, shallowReadonly, stop, unRef };
//# sourceMappingURL=reactivity.esm-bundler.js.map
