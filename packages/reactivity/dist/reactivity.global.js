var EchoReactivity = (function (exports) {
  'use strict';

  let reactivrEffectStack = [];
  window.currentReactiveEffect = undefined;

  function createReactiveEffect (fn, scheduler) {
    const reactiveEffect = function () {
      if (!reactivrEffectStack.includes(reactiveEffect)) {
        try {
          reactivrEffectStack.push(reactiveEffect);
          currentReactiveEffect = reactiveEffect;
          fn();
        } finally {
          reactivrEffectStack.pop();
          currentReactiveEffect = reactivrEffectStack[reactivrEffectStack.length - 1];
        }
      }
    };
    reactiveEffect.scheduler = scheduler;
    return reactiveEffect
  }

  function effect (fn, option = { lazy: false, scheduler: undefined }) {
    const reactiveEffect = createReactiveEffect(fn, option.scheduler);
    if (option.lazy !== true) {
      reactiveEffect();
    }
  }

  const targetMap = new WeakMap();

  function Track (target, key) {
    if (!currentReactiveEffect) {
      return
    }
    let depMap = targetMap.get(target);
    if (!depMap) {
      targetMap.set(target, (depMap = new Map));
    }
    let dep = depMap.get(key);
    if (!dep) {
      depMap.set(key, (dep = new Set));
    }
    if (!dep.has(currentReactiveEffect)) {
      dep.add(currentReactiveEffect);
    }
  }

  function Trigger (target, key) {
    let depMap = targetMap.get(target);
    if (!depMap) {
      return
    }
    const effectSet = new Set();
    depMap.get(key).forEach(effect => {
      effectSet.add(effect);
    });
    effectSet.forEach(effect => {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect();
      }
    });
  }

  function isObject (param) {
    return Object.prototype.toString.call(param) === '[object Object]'
  }

  function getCreator (isShallow = false, isReadOnly = false) {
    return (target, key) => {
      let res = Reflect.get(target, key);
      if (!isReadOnly) {
        //TODO 收集
        Track(target, key);
      }
      if (!isShallow && isObject(res)) {
        //TODO 将res转变成响应式对象
        return isReadOnly ? readonly(res) : reactive(res)
      } else {
        return res
      }
    }
  }

  function setCreator (isReadOnly = false) {
    return (target, key, val) => {
      if (isReadOnly) {
        throw new Error('这是一个只读的对象')
      }
      Reflect.set(target, key, val);
      //TODO 触发依赖
      Trigger(target, key);
    }
  }

  const reactiveHandler = {
    get: getCreator(),
    set: setCreator()
  };
  const shallowHandler = {
    get: getCreator(true),
    set: setCreator()
  };
  const readOnlyHandler = {
    get: getCreator(false, true),
    set: setCreator(true)
  };
  const shallowReadOnlyHandler = {
    get: getCreator(true, true),
    set: setCreator(true)
  };

  // TODO 为什么要设计两个Map来存储呢?
  const reactiveMap = new WeakMap();
  const readOnlyMap = new WeakMap();

  function createReactiveObject (target, isReadOnly, handler) {
    if (isObject(target) !== true) {
      throw new Error('只能将对象转化为响应式对象')
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

  function isReactive (target) {
    return !!target['is_reactive']
  }

  function isReadOnly (target) {
    return !!target['is_readonly']
  }

  function isProxy (target) {
    return isReactive(target) || isReadOnly(target)
  }

  exports.Track = Track;
  exports.Trigger = Trigger;
  exports.effect = effect;
  exports.isProxy = isProxy;
  exports.isReactive = isReactive;
  exports.isReadOnly = isReadOnly;
  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.shallowReactive = shallowReactive;
  exports.shallowReadonly = shallowReadonly;

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
