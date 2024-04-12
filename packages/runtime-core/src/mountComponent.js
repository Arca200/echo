import { createComponentInstance, setupComponent } from './component'
import patch from './patch'

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

export {
  mountComponent,
}