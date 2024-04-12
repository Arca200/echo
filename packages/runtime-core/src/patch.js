import { ShapeFlags } from '@echo/shared/src'
import { mountElement } from './mountElement'
import { mountComponent } from './mountComponent'

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

function processComponent (vnode, container) {
  mountComponent(vnode, container)
}

export default patch