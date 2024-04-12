import { ShapeFlags } from '@echo/shared/src'
import { mountElement } from './mountElement'
import { mountComponent } from './mountComponent'
import { Fragment } from './vnode'
import { Text } from './vnode'

function patch (vnode, container) {
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
        processComponent(vnode, container)
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
  container.append(textNode)

}

function processElement (vnode, container) {
  mountElement(vnode, container)
}

function processComponent (vnode, container) {
  mountComponent(vnode, container)
}

export default patch