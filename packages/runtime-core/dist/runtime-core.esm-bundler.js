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

function hasOwnProperty (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function isOn (key) {
  return /^on[A-Za-z]+/.test(key)
}

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

const targetMap = new WeakMap();

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
    if (key === 'is_reactive') {
      return !isReadOnly
    }
    if (key === 'is_readonly') {
      return isReadOnly
    }
    let res = Reflect.get(target, key);
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
  $el: (i) => i.vnode.el
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

function setupComponent (componentInstance) {
  //init slot
  initComponentProps(componentInstance, componentInstance.vnode.props);
  setupStatefulComponent(componentInstance);
}

function setupStatefulComponent (componentInstance) {
  componentInstance.proxy = new Proxy({ _: componentInstance }, instanceProxyHandler);
  const component = componentInstance.type;
  if (component.setup) {
    const setupResult = component.setup(shallowReadonly(componentInstance.props));
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

function createComponentInstance (vnode) {
  return {
    vnode, type: vnode.type, setupState: {},
  }
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
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
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

function h (type, props, children) {
  return createVNode(type, props, children)
}

export { createApp, h };
//# sourceMappingURL=runtime-core.esm-bundler.js.map
