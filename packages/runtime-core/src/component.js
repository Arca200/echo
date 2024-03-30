import { isObject } from '../../shared/src'
import { initComponentProps } from './props'
import { instanceProxyHandler } from './instance'
import { shallowReadonly } from '@echo/reactivity/src'

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

function handleSetupResult (instance, setupResult) {
  if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup (instance) {
  const component = instance.type
  if (component.render) {
    instance.render = component.render
  }
}

function createComponentInstance (vnode) {
  return {
    vnode, type: vnode.type, setupState: {},
  }
}

export {
  createComponentInstance, setupComponent
}