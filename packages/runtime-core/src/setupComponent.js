import { shallowReadonly } from '@echo/reactivity/src'
import { isObject } from '@echo/shared/src'
import { initComponentProps } from './props'
import instanceProxyHandler from './instanceProxyHandler'

function setupComponent (componentInstance) {
  //init slot
  initComponentProps(componentInstance, componentInstance.vnode.props)
  setupStatefulComponent(componentInstance)
}

function setupStatefulComponent (componentInstance) {
  componentInstance.proxy = new Proxy({ _: componentInstance }, instanceProxyHandler)
  const component = componentInstance.type
  if (component.setup) {
    const setupResult = component.setup(shallowReadonly(componentInstance.props))
    handleSetupResult(componentInstance, setupResult)
  }
}

//存放setup的执行结果
function handleSetupResult (instance, setupResult) {
  if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

//存储render函数
function finishComponentSetup (instance) {
  const component = instance.type
  if (component.render) {
    instance.render = component.render
  }
}

export {
  setupComponent,
}