import { isString, ShapeFlags } from '@echo/shared/src'
import { createComponentInstance, setupComponent } from './component.js'

function patch (vnode, container) {
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container)
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container)
  }
}

function processElement (vnode, container) {
  mountElement(vnode, container)
}

function mountElement (vnode, container) {
  vnode.el = document.createElement(vnode.type)

  const { shapeFlag, children, props, el } = vnode
  const isOn = (key) => /^on[A-Za-z]+/.test(key)
  for (const elKey in props) {
    const val = props[elKey]
    if (isOn(elKey)) {
      const event = elKey.slice(2).toLowerCase()
      el.addEventListener(event, val)
    } else {
      el.setAttribute(elKey, val)
    }
  }
  if (shapeFlag & ShapeFlags.TEXT_CHILD) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
    children.forEach(child => {
      patch(child, el)
    })
  }

  if (isString(container)) {
    document.querySelector(container).appendChild(el)
  } else {
    container.appendChild(el)
  }
}

function processComponent (vnode, container) {
  mountComponent(vnode, container)
}

function mountComponent (vnode, container) {
  const componentInstance = createComponentInstance(vnode)
  setupComponent(componentInstance)
  setupRenderEffect(componentInstance, vnode, container)
}

function setupRenderEffect (componentInstance, vnode, container) {
  const subTree = componentInstance.render.call(componentInstance.proxy)
  patch(subTree, container)

  vnode.el = subTree.el
}

export default patch