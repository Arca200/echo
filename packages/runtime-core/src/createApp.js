import createVNode from './createVNode.js'
import render from './render'

function createApp (rootComponent) {
  return {
    mount (rootContainer) {
      const vnode = createVNode(rootContainer)
      render(vnode, rootComponent)
    }
  }
}

export default createApp