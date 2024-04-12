import { createVNode } from './vnode.js'
import render from './render'

function createApp (rootComponent) {
  return {
    mount (rootContainer) {
      const vnode = createVNode(rootComponent)
      render(vnode, rootContainer)
    }
  }
}

export {
  createApp
}