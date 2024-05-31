var EchoRuntimeDom = (function (exports) {
    'use strict';

    const ShapeFlags = {
        ELEMENT: 1,
        STATEFUL_COMPONENT: 1 << 1,
        TEXT_CHILD: 1 << 2,
        ARRAY_CHILD: 1 << 3,
    };

    function getSequence (arr) {
      let p;
      if (arr) {
        p = arr.slice();
      }

      const result = [0];
      let i, j, u, v, c;
      const len = arr.length;
      for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
          j = result[result.length - 1];
          if (arr[j] < arrI) {
            p[i] = j;
            result.push(i);
            continue
          }
          u = 0;
          v = result.length - 1;
          while (u < v) {
            c = (u + v) >> 1;
            if (arr[result[c]] < arrI) {
              u = c + 1;
            } else {
              v = c;
            }
          }
          if (arrI < arr[result[u]]) {
            if (u > 0) {
              p[i] = result[u - 1];
            }
            result[u] = i;
          }
        }
      }
      u = result.length;
      v = result[u - 1];
      while (u-- > 0) {
        result[u] = v;
        v = p[v];
      }
      return result
    }

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

    function mountElement(preSubTree, vnode, container, parent, anchor) {
        vnode.el = document.createElement(vnode.type);
        const {shapeFlag, children, props, el} = vnode;

        addProps(props, el);

        if (shapeFlag & ShapeFlags.TEXT_CHILD) {
            addText(children, el);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
            addChildren(children, el);
        }
        if (anchor) {
            anchor.parentNode.insertBefore(el, anchor);
        } else {
            appendVNode(container, el);
        }
    }

    function patchElement(preSubTree, currentSubTree, container, parent) {
        const el = (currentSubTree.el = preSubTree.el);
        const preProps = preSubTree.props || {};
        const currentProps = currentSubTree.props || {};

        patchChildren(el, preSubTree, currentSubTree, container, parent);
        patchProps(el, preProps, currentProps);
    }

    function patchProps(el, preProps, currentProps) {
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

    function patchChildren(el, preSubTree, currentSubTree, container, parent) {
        const currentShapeFlag = currentSubTree.shapeFlag;
        const preShapeFlag = preSubTree.shapeFlag;
        const currentChidlren = currentSubTree.children;
        const prevChidlren = preSubTree.children;
        if (currentShapeFlag & ShapeFlags.ARRAY_CHILD && preShapeFlag & ShapeFlags.ARRAY_CHILD) {
            diff(prevChidlren, currentChidlren, container, parent);
        }
        if (currentShapeFlag & ShapeFlags.TEXT_CHILD && preShapeFlag & ShapeFlags.ARRAY_CHILD) {
            removeChildren(el);
            addText(currentChidlren, el);
        }
        if (currentShapeFlag & ShapeFlags.TEXT_CHILD && preShapeFlag & ShapeFlags.TEXT_CHILD) {
            addText(currentChidlren, el);
        }
        if (currentShapeFlag & ShapeFlags.ARRAY_CHILD && preShapeFlag & ShapeFlags.TEXT_CHILD) {
            addText('', el);
            addChildren(currentChidlren, el);
        }
    }

    function diff(prevChidlren, currentChidlren, container, parent) {
        const isSameVnodeType = (n1, n2) => {
            return n1.type === n2.type && n1.key === n2.key
        };
        let left = 0;
        let prevRight = prevChidlren.length - 1;
        let currentRight = currentChidlren.length - 1;
        while (left <= prevRight && left <= currentRight) {
            const n1 = prevChidlren[left];
            const n2 = currentChidlren[left];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parent);
            } else {
                break
            }
            ++left;
        }
        while (left <= prevRight && left <= currentRight) {
            const n1 = prevChidlren[prevRight];
            const n2 = currentChidlren[currentRight];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parent);
            } else {
                break
            }
            --prevRight;
            --currentRight;
        }
        if (left > prevRight) {
            let count = 0;
            let ancher = left;
            while (left <= currentRight - count) {
                let ancherNode = prevChidlren[ancher];
                patch(null, currentChidlren[left + count], parent.vnode.el, null, ancherNode.el);
                ++count;
            }
        } else if (left > currentRight) {
            let l = left;
            while (l <= prevRight) {
                parent.vnode.el.removeChild(prevChidlren[l].el);
                l++;
            }
        } else {
            let preLeft = left;
            let currentLeft = left;
            const keyMap = new Map();
            const map = new Array(currentRight - currentLeft + 1).fill(0);
            for (let i = currentLeft; i <= currentRight; i++) {
                const child = currentChidlren[i];
                keyMap.set(child.key, i);
            }
            console.log(keyMap);
            for (let i = preLeft; i <= prevRight; i++) {
                const child = prevChidlren[i];
                let index = keyMap.get(child.key);
                if (index === undefined) {
                    parent.vnode.el.removeChild(child.el);
                } else {
                    console.log(index, currentLeft);
                    map[index - currentLeft] = i;
                    console.log(map);
                    patch(child, currentChidlren[index], parent.vnode.el, null, null);
                }
            }
            const increasingSequence = getSequence(map);
            console.log(increasingSequence);
        }

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

    function setupComponent(componentInstance) {
        initComponentSlots(componentInstance, componentInstance.vnode.children);
        initComponentProps(componentInstance, componentInstance.vnode.props);
        setupStatefulComponent(componentInstance);
    }

    function setupStatefulComponent(componentInstance) {
        componentInstance.proxy = new Proxy({_: componentInstance}, instanceProxyHandler);
        const component = componentInstance.type;
        if (component.setup) {
            const setupResult = component.setup(shallowReadonly(componentInstance.props), {emit: componentInstance.emit});
            handleSetupResult(componentInstance, setupResult);
        }
    }

    //存放setup的执行结果
    function handleSetupResult(instance, setupResult) {
        if (isObject(setupResult)) {
            instance.setupState = setupResult;
        }
        finishComponentSetup(instance);
    }

    //存储render函数
    function finishComponentSetup(instance) {
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

    function createComponentInstance(vnode, parent) {
        const instance = {
            vnode,
            type: vnode.type,
            setupState: {},
            props: {},
            emit: () => {
            },
            slots: {},
            provide: {},
            parent,
            isMounted: false,
            subTree: null
        };
        instance.emit = emit.bind(null, instance);
        return instance
    }

    function mountComponent(preSubTree, vnode, container, parent) {
        const componentInstance = createComponentInstance(vnode, parent);
        setupComponent(componentInstance);
        setupRenderEffect(componentInstance, vnode, container);
    }

    //调用render函数，并且render函数的指向componentInstance.proxy
    function setupRenderEffect(instance, vnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                const {proxy} = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance);

                vnode.el = subTree.el;
                instance.isMounted = true;
            } else {
                const {proxy} = instance;
                const preSubTree = instance.subTree;
                const currentSubTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(preSubTree, currentSubTree, container, instance);
            }

        });
    }

    function patch(preSubTree, currentSubTree, container, parent, anchor) {
        const {type, shapeFlag} = currentSubTree;
        switch (type) {
            case Fragment:
                processFragment(preSubTree, currentSubTree, container);
                break
            case Text:
                processTextNode(preSubTree, currentSubTree, container);
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(preSubTree, currentSubTree, container, parent, anchor);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(preSubTree, currentSubTree, container, parent);
                }
                break
        }

    }

    function processFragment(preSubTree, currentSubTree, container) {
        currentSubTree.children.forEach(child => {
            patch(null, child, container);
        });
    }

    function processTextNode(preSubTree, currentSubTree, container) {
        const {children} = currentSubTree;
        const textNode = (currentSubTree.el = document.createTextNode(children));
        if (isString(container)) {
            document.querySelector(container).appendChild(textNode);
        } else {
            container.appendChild(textNode);
        }
    }

    function processElement(preSubTree, currentSubTree, container, parent, anchor) {
        if (!preSubTree) {
            mountElement(preSubTree, currentSubTree, container, parent, anchor);
        } else {
            patchElement(preSubTree, currentSubTree, container, parent);
        }

    }

    function processComponent(preSubTree, currentSubTree, container, parent) {
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
