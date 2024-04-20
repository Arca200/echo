import patch from './patch'
import { setupComponent } from './setupComponent'
import { createComponentInstance } from './instance'
import { effect } from '@echo/reactivity/src'

function mountComponent (preSubTree, vnode, container, parent) {
  const componentInstance = createComponentInstance(vnode, parent)
  setupComponent(componentInstance)
  setupRenderEffect(componentInstance, vnode, container)
}

//调用render函数，并且render函数的指向componentInstance.proxy
function setupRenderEffect (instance, vnode, container) {
  effect(() => {
    if (!instance.isMounted) {
      const { proxy } = instance
      const subTree = (instance.subTree = instance.render.call(proxy, proxy))
      patch(null, subTree, container, instance)

      vnode.el = subTree.el
      instance.isMounted = true
    } else {
      const { proxy } = instance
      const preSubTree = instance.subTree
      const currentSubTree = (instance.subTree = instance.render.call(proxy, proxy))
      patch(preSubTree, currentSubTree, container, instance)
    }

  })
}

export {
  mountComponent,
}