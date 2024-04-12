var EchoRuntime = (function (exports) {
  'use strict';

  const ShapeFlags = {
    ELEMENT: 1,
    STATEFUL_COMPONENT: 1 << 1,
    TEXT_CHILD: 1 << 2,
    ARRAY_CHILD: 1 << 3,
  };

  function isObject (param) {
    return Object.prototype.toString.call(param) === '[object Object]'
  }

  function isString (param) {
    return Object.prototype.toString.call(param) === '[object String]'
  }

  function isArray (param) {
    return Object.prototype.toString.call(param) === '[object Array]'
  }

  function isFunction (param) {
    return Object.prototype.toString.call(param) === '[object Function]'
  }

  function hasOwnProperty (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key)
  }

  function isOn (key) {
    return /^on[A-Za-z]+/.test(key)
  }

  const Fragment = Symbol('Fragment');
  const Text = Symbol('Text');

  function createVNode (type, props, children) {
    const vnode = {
      type,
      props,
      children,
      el: undefined,
      isVNode: true,
      shapeFlag: getShapeFlag(type)
    };
    if (isString(vnode.children)) {
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILD;
    } else if (isArray(vnode.children)) {
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILD;
    }
    return vnode
  }

  function getShapeFlag (type) {
    if (isObject(type)) {
      return ShapeFlags.STATEFUL_COMPONENT
    } else if (isString(type)) {
      return ShapeFlags.ELEMENT
    }
  }

  function createTextVNode (string) {
    return createVNode(Text, {}, string)
  }

  function mountElement (vnode, container) {
    vnode.el = document.createElement(vnode.type);

    const { shapeFlag, children, props, el } = vnode;
    for (const elKey in props) {
      const val = props[elKey];
      if (isOn(elKey)) {
        const event = elKey.slice(2).toLowerCase();
        el.addEventListener(event, val);
      } else {
        el.setAttribute(elKey, val);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILD) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
      children.forEach(child => {
        patch(child, el);
      });
    }

    if (isString(container)) {
      document.querySelector(container).appendChild(el);
    } else {
      container.appendChild(el);
    }
  }

  // 用于存储所有的 effect 对象
  function createDep (effects) {
    const dep = new Set(effects);
    return dep
  }

  const targetMap = new WeakMap();

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

  function initComponentProps (instance, props) {
    instance.props = props || {};
  }

  const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots
  };
  const instanceProxyHandler = {
    get ({ _: instance }, key) {
      const { setupState, props } = instance;
      if (hasOwnProperty(setupState, key)) {
        return setupState[key]
      } else if (hasOwnProperty(props, key)) {
        return props[key]
      }
      const publicGetter = publicPropertiesMap[key];
      if (publicGetter) {
        return publicGetter(instance)
      }
    }
  };

  function initComponentSlots (instance, children) {
    if (!children) {
      return
    }
    const slots = {};
    for (let key in children) {
      const value = children[key];
      if (isArray(value)) {
        slots[key] = value;
      } else if (isFunction(value)) {
        slots[key] = value;
      } else {
        slots[key] = [value];
      }
    }
    instance.slots = slots;
  }

  function renderSlots (slots, name, prop) {
    const slot = slots[name];
    if (isFunction(slot)) {
      return h(Fragment, {}, [slot(prop)])
    } else {
      return h(Fragment, {}, slot)
    }
  }

  let currentInstance = null;

  function getCurrentInstance () {
    return currentInstance
  }

  function setCurrentInstance (instance) {
    currentInstance = instance;
  }

  function setupComponent (componentInstance) {
    initComponentSlots(componentInstance, componentInstance.vnode.children);
    initComponentProps(componentInstance, componentInstance.vnode.props);
    setupStatefulComponent(componentInstance);
  }

  function setupStatefulComponent (componentInstance) {
    componentInstance.proxy = new Proxy({ _: componentInstance }, instanceProxyHandler);
    const component = componentInstance.type;
    if (component.setup) {
      setCurrentInstance(componentInstance);
      const setupResult = component.setup(shallowReadonly(componentInstance.props), { emit: componentInstance.emit });
      setCurrentInstance(null);
      handleSetupResult(componentInstance, setupResult);
    }
  }

  //存放setup的执行结果
  function handleSetupResult (instance, setupResult) {
    if (isObject(setupResult)) {
      instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
  }

  //存储render函数
  function finishComponentSetup (instance) {
    const component = instance.type;
    if (component.render) {
      instance.render = component.render;
    }
  }

  function emit (instance, event) {
    const props = instance.props || {};
    const emitAction = props[event];
    emitAction && emitAction();
  }

  function createComponentInstance (vnode) {
    const instance = {
      vnode, type: vnode.type, setupState: {}, props: {}, emit: () => {}, slots: {}
    };
    instance.emit = emit.bind(null, instance);
    return instance
  }

  function mountComponent (vnode, container) {
    const componentInstance = createComponentInstance(vnode);
    setupComponent(componentInstance);
    setupRenderEffect(componentInstance, vnode, container);
  }

  //调用render函数，并且render函数的指向componentInstance.proxy
  function setupRenderEffect (componentInstance, vnode, container) {
    const subTree = componentInstance.render.call(componentInstance.proxy);
    patch(subTree, container);

    vnode.el = subTree.el;
  }

  function patch (vnode, container) {
    const { type, shapeFlag } = vnode;

    switch (type) {
      case Fragment:
        processFragment(vnode, container);
        break
      case Text:
        processTextNode(vnode, container);
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container);
        }
        break
    }

  }

  function processFragment (vnode, container) {
    vnode.children.forEach(child => {
      patch(child, container);
    });
  }

  function processTextNode (vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);

  }

  function processElement (vnode, container) {
    mountElement(vnode, container);
  }

  function processComponent (vnode, container) {
    mountComponent(vnode, container);
  }

  function render (vnode, rootContainer) {
    patch(vnode, rootContainer);
  }

  function createApp (rootComponent) {
    return {
      mount (rootContainer) {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
      }
    }
  }

  // h函数用来创建vnode

  function h$1 (type, props, children) {
    return createVNode(type, props, children)
  }

  exports.createApp = createApp;
  exports.createTextVNode = createTextVNode;
  exports.getCurrentInstance = getCurrentInstance;
  exports.h = h$1;
  exports.renderSlots = renderSlots;

  return exports;

})({});
//# sourceMappingURL=runtime-core.global.js.map
