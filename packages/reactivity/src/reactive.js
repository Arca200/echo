import { isObject } from '../../shared/src'
import { reactiveHandler, readOnlyHandler, shallowHandler, shallowReadOnlyHandler } from './baseHandler.js'

const reactiveMap = new WeakMap()
const readOnlyMap = new WeakMap()

function createReactiveObject (target, isReadOnly, handler) {
  if (isObject(target) !== true) {
    console.error('必须传入一个对象')
  }
  const proxyMap = isReadOnly ? readOnlyMap : reactiveMap
  let proxy = proxyMap.get(target)
  if (proxy) {
    return proxy
  } else {
    proxy = new Proxy(target, handler)
    proxyMap.set(target, proxy)
    return proxy
  }
}

function reactive (target) {
  return createReactiveObject(target, false, reactiveHandler)
}

function readonly (target) {
  return createReactiveObject(target, true, readOnlyHandler)
}

function shallowReactive (target) {
  return createReactiveObject(target, false, shallowHandler)
}

function shallowReadonly (target) {
  return createReactiveObject(target, true, shallowReadOnlyHandler)
}

function isReactive (target) {
  return !!target['isReactive']
}

function isReadOnly (target) {
  return !!target['isReadOnly']
}

function isProxy (target) {
  return isReactive(target) || isReadOnly(target)
}

export {
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  isReactive,
  isReadOnly,
  isProxy
}