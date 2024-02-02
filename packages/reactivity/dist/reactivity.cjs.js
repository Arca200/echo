'use strict';

const isObject = value => typeof value === 'object' && value !== null;

const TriggerTypes = {
    SET: 'set', ADD: 'add', DELETE: 'delete', CLEAR: 'clear'
};

function effect (fn, options = { lazy: false }) {
  const reactiveEffectCreator = createReactiveEffect(fn, options);
  if (!options.lazy) {
    reactiveEffectCreator();
  }
  return reactiveEffectCreator
}

let reactiveEffectCreatorStack = [];
let currentReactiveEffectCreator = undefined;
let uid = 0;

function createReactiveEffect (fn, options) {
  const reactiveEffectCreator = function () {
    if (!reactiveEffectCreatorStack.includes(reactiveEffectCreator)) {
      try {
        reactiveEffectCreatorStack.push(reactiveEffectCreator);
        currentReactiveEffectCreator = reactiveEffectCreator;
        fn();
      } finally {
        reactiveEffectCreatorStack.pop();
        currentReactiveEffectCreator = reactiveEffectCreatorStack[reactiveEffectCreatorStack.length - 1];
      }
    }
  };
  reactiveEffectCreator.id = uid++;
  reactiveEffectCreator.fn = fn;
  reactiveEffectCreator.options = options;
  return reactiveEffectCreator
}

// JavaScript 中的构造函数可以省略括号
let targetMap = new WeakMap;

function Track (target, key) {
  if (!currentReactiveEffectCreator) {
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
  if (!dep.has(currentReactiveEffectCreator)) {
    dep.add(currentReactiveEffectCreator);
  }
}

function Trigger (type, target, key, newValue, oldValue) {
  const depMap = targetMap.get(target);
  if (!depMap) {
    return
  }
  const reactiveEffectSet = new Set;
  const add = (depMap) => {
    if (depMap) {
      depMap.forEach(effect => reactiveEffectSet.add(effect));
    }
  };
  add(depMap.get(key));
  // if (key === 'length' && isArray(target)) {
  //   depMap.forEach((dep, key) => {
  //     if (key === 'length' || key >= length) {
  //       add(dep)
  //     }
  //   })
  // } else {
  //   if (key != undefined) {
  //     add(depMap.get(key))
  //   }
  //   switch (type) {
  //     case TriggerTypes.ADD:
  //       if (isArray(target) && isIntegerKey(key)) {
  //         add(depMap.get('length'))
  //       }
  //   }
  // }
  reactiveEffectSet.forEach(effect => effect());
}

function createGet (isShallow = false, isReadonly = false) {
  return function get (target, key, property) {
    // Reflect.get 并不会触发对象的 getter 方法，它只是返回属性的值
    const res = Reflect.get(target, key, property);
    if (!isReadonly) {
      // 不是只读，收集依赖
      Track(target, key);
    }
    if (!isShallow && isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    } else {
      return res
    }
  }
}

function createSet (isShallow = false, isReadonly = false) {
  return function set (target, prop, val) {
    if (isReadonly) {
      throw new Error('readonly')
    }
    target[prop];
    const result = Reflect.set(target, prop, val);
    Trigger(TriggerTypes.SET, target, prop);
    // const hasIndex = isArray(target) && isIntegerKey(prop) ? Number(prop) < target.length : hasOwnProperty(target, prop)
    // if (!hasIndex) {
    //   Trigger(TriggerTypes.ADD, target, prop, val, oldValue)
    // } else {
    //   if (val !== oldValue) {
    //     Trigger(TriggerTypes.SET, target, prop, val, oldValue)
    //   }
    // }
    return result
  }
}

const reactiveGet = createGet();
const shallowReactiveGet = createGet(true);
const readonlyGet = createGet(false, true);
const shallowReadonlyGet = createGet(true, true);
const reactiveSet = createSet();
const shallowReactiveSet = createSet(true);
const readonlySet = createSet(false, true);
const shallowReadonlySet = createSet(true, true);
const reactiveHandler = {
  get: reactiveGet, set: reactiveSet,
};
const shallowReactiveHandler = {
  get: shallowReactiveGet, set: shallowReactiveSet,
};
const readonlyHandler = {
  get: readonlyGet, set: readonlySet,
};

const shallowReadonlyHandler = {
  get: shallowReadonlyGet, set: shallowReadonlySet,
};

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

function createReactiveObject(target, isReadOnly, baseHandler) {
    if (!isObject(target)) {
        return new Error('Reactive object must be an object')
    }
    const proxyMap = isReadOnly ? readonlyMap : reactiveMap;
    const proxyEs = proxyMap.get(target);
    if (proxyEs) {
        return proxyEs
    } else {
        const proxy = new Proxy(target, baseHandler);
        proxyMap.set(target, proxy);
        return proxy
    }
}

function reactive(target) {
    return createReactiveObject(target, false, reactiveHandler)
}

function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandler)
}

function readonly(target) {
    return createReactiveObject(target, true, readonlyHandler)
}

function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandler)
}

exports.Track = Track;
exports.Trigger = Trigger;
exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
//# sourceMappingURL=reactivity.cjs.js.map
