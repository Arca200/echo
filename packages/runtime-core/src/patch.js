import { isString, ShapeFlags } from '@echo/shared/src'
import { mountElement } from './mountElement'
import { mountComponent } from './mountComponent'
import { Fragment } from './vnode'
import { Text } from './vnode'

function patch (vnode, container, parent) {
  const { type, shapeFlag } = vnode

  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break
    case Text:
      processTextNode(vnode, container)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parent)
      }
      break
  }

}

function processFragment (vnode, container) {
  vnode.children.forEach(child => {
    patch(child, container)
  })
}

function processTextNode (vnode, container) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  if (isString(container)) {
    document.querySelector(container).appendChild(textNode)
  } else {
    container.appendChild(textNode)
  }
}

function processElement (vnode, container, parent) {
  mountElement(vnode, container)
}

function processComponent (vnode, container, parent) {
  mountComponent(vnode, container, parent)
}

export default patch