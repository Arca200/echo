var EchoRuntimeDom = (function (exports) {
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

  function mountElement (preSubTree, vnode, container) {
    vnode.el = document.createElement(vnode.type);
    const { shapeFlag, children, props, el } = vnode;

    addProps(props, el);

    if (shapeFlag & ShapeFlags.TEXT_CHILD) {
      addText(children, el);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
      addChildren(children, el);
    }
    appendVNode(container, el);
  }

  function patchElement (preSubTree, currentSubTree, container) {
    const el = (currentSubTree.el = preSubTree.el);
    const preProps = preSubTree.props || {};
    const currentProps = currentSubTree.props || {};

    patchChildren(el, preSubTree, currentSubTree);
    patchProps(el, preProps, currentProps);
  }

  function patchProps (el, preProps, currentProps) {
    for (const key in currentProps) {
      const preProp = preProps[key];
      const currentProp = currentProps[key];
      if (preProp !== currentProp) {
        if (isOn(key)) {
          const event = key.slice(2).toLowerCase();
          el.addEventListener(event, currentProp);
        } else {
          if (!currentProp) {
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, currentProp);
          }
        }
      }
    }
  }

  function patchChildren (el, preSubTree, currentSubTree) {
    const currentShapeFlag = currentSubTree.shapeFlag;
    const preShapeFlag = preSubTree.shapeFlag;
    if (currentShapeFlag & ShapeFlags.ARRAY_CHILD && preShapeFlag & ShapeFlags.ARRAY_CHILD) {
      removeChildren(el);
      addChildren(currentSubTree.children, el);
    }
    if (currentShapeFlag & ShapeFlags.TEXT_CHILD && preShapeFlag & ShapeFlags.ARRAY_CHILD) {
      removeChildren(el);
      addText(currentSubTree.children, el);
    }
    if (currentShapeFlag & ShapeFlags.TEXT_CHILD && preShapeFlag & ShapeFlags.TEXT_CHILD) {
      addText(currentSubTree.children, el);
    }
    if (currentShapeFlag & ShapeFlags.ARRAY_CHILD && preShapeFlag & ShapeFlags.TEXT_CHILD) {
      addText('', el);
      addChildren(currentSubTree.children, el);
    }
  }

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

  function shallowReadonly (target) {
    return createReactiveObject(target, true, shallowReadOnlyHandler)
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

  const Fragment = Symbol('Fragment');
  const Text = Symbol('Text');

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

  function setupComponent (componentInstance) {
    initComponentSlots(componentInstance, componentInstance.vnode.children);
    initComponentProps(componentInstance, componentInstance.vnode.props);
    setupStatefulComponent(componentInstance);
  }

  function setupStatefulComponent (componentInstance) {
    componentInstance.proxy = new Proxy({ _: componentInstance }, instanceProxyHandler);
    const component = componentInstance.type;
    if (component.setup) {
      const setupResult = component.setup(shallowReadonly(componentInstance.props), { emit: componentInstance.emit });
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

  function createComponentInstance (vnode, parent) {
    const instance = {
      vnode,
      type: vnode.type,
      setupState: {},
      props: {},
      emit: () => {},
      slots: {},
      provide: {},
      parent,
      isMounted: false,
      subTree: null
    };
    instance.emit = emit.bind(null, instance);
    return instance
  }

  function mountComponent (preSubTree, vnode, container, parent) {
    const componentInstance = createComponentInstance(vnode, parent);
    setupComponent(componentInstance);
    setupRenderEffect(componentInstance, vnode, container);
  }

  //调用render函数，并且render函数的指向componentInstance.proxy
  function setupRenderEffect (instance, vnode, container) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy, proxy));
        patch(null, subTree, container, instance);

        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const preSubTree = instance.subTree;
        const currentSubTree = (instance.subTree = instance.render.call(proxy, proxy));
        patch(preSubTree, currentSubTree, container, instance);
      }

    });
  }

  function patch (preSubTree, currentSubTree, container, parent) {
    const { type, shapeFlag } = currentSubTree;
    switch (type) {
      case Fragment:
        processFragment(preSubTree, currentSubTree, container);
        break
      case Text:
        processTextNode(preSubTree, currentSubTree, container);
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(preSubTree, currentSubTree, container);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(preSubTree, currentSubTree, container, parent);
        }
        break
    }

  }

  function processFragment (preSubTree, currentSubTree, container) {
    currentSubTree.children.forEach(child => {
      patch(child, container);
    });
  }

  function processTextNode (preSubTree, currentSubTree, container) {
    const { children } = currentSubTree;
    const textNode = (currentSubTree.el = document.createTextNode(children));
    if (isString(container)) {
      document.querySelector(container).appendChild(textNode);
    } else {
      container.appendChild(textNode);
    }
  }

  function processElement (preSubTree, currentSubTree, container, parent) {
    if (!preSubTree) {
      mountElement(preSubTree, currentSubTree, container);
    } else {
      patchElement(preSubTree, currentSubTree);
    }

  }

  function processComponent (preSubTree, currentSubTree, container, parent) {
    mountComponent(preSubTree, currentSubTree, container, parent);
  }

  function removeChildren (node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function addChildren (children, el) {
    children.forEach(child => {
      patch(null, child, el);
    });
  }

  function addText (text, el) {
    el.textContent = text;
  }

  function addProps (props, el) {
    for (const key in props) {
      const value = props[key];
      if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  function appendVNode (container, VNode) {
    if (isString(container)) {
      document.querySelector(container).appendChild(VNode);
    } else {
      container.appendChild(VNode);
    }
  }

  exports.addChildren = addChildren;
  exports.addProps = addProps;
  exports.addText = addText;
  exports.appendVNode = appendVNode;
  exports.removeChildren = removeChildren;

  return exports;

})({});
//# sourceMappingURL=runtime-dom.global.js.map
