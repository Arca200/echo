import { isArray, isObject, isString, ShapeFlags } from '@echo/shared/src'

const Fragment = Symbol('Fragment')
const Text = Symbol('Text')

function createVNode (type, props, children) {
  const vnode = {
    type,
    props,
    children,
    el: undefined,
    isVNode: true,
    shapeFlag: getShapeFlag(type)
  }
  if (isString(vnode.children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILD
  } else if (isArray(vnode.children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILD
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

export {
  Fragment,
  Text,
  createTextVNode,
  createVNode
}