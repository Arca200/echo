// h函数用来创建vnode
import createVNode from './vnode'

function h (type, props, children) {
  return createVNode(type, props, children)
}

export { h }