var EchoRuntime = (function (exports, src) {
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
      const setupResult = component.setup(src.shallowReadonly(componentInstance.props), { emit: componentInstance.emit });
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

})({}, src);
//# sourceMappingURL=runtime-core.global.js.map
