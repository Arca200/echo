import {
  reactiveHandler,
  readOnlyHandler,
  shallowHandler,
  shallowReadOnlyHandler
} from './baseHandler.js'
import { isObject } from '../../shared/src'

// TODO 为什么要设计两个Map来存储呢?
const reactiveMap = new WeakMap()
const readOnlyMap = new WeakMap()

function createReactiveObject (target, isReadOnly, handler) {
  if (isObject(target) !== true) {
    throw new Error('只能将对象转化为响应式对象')
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
  return !!target['is_reactive']
}

function isReadOnly (target) {
  return !!target['is_readonly']
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