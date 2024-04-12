import patch from './patch'
import { setupComponent } from './setupComponent'
import { createComponentInstance } from './instance'
import { effect } from '@echo/reactivity/src'

function mountComponent (vnode, container, parent) {
  const componentInstance = createComponentInstance(vnode, parent)
  setupComponent(componentInstance)
  setupRenderEffect(componentInstance, vnode, container)
}

//调用render函数，并且render函数的指向componentInstance.proxy
function setupRenderEffect (componentInstance, vnode, container) {
  effect(() => {
    const { proxy } = componentInstance
    const subTree = componentInstance.render.call(proxy, proxy)
    patch(subTree, container, componentInstance)

    vnode.el = subTree.el
  })
}

export {
  mountComponent,
}