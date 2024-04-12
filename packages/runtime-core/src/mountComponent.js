import patch from './patch'
import { setupComponent } from './setupComponent'
import { createComponentInstance } from './instance'

function mountComponent (vnode, container) {
  const componentInstance = createComponentInstance(vnode)
  setupComponent(componentInstance)
  setupRenderEffect(componentInstance, vnode, container)
}

//调用render函数，并且render函数的指向componentInstance.proxy
function setupRenderEffect (componentInstance, vnode, container) {
  const subTree = componentInstance.render.call(componentInstance.proxy)
  patch(subTree, container)

  vnode.el = subTree.el
}

export {
  mountComponent,
}