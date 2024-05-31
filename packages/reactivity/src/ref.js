import { trackEffect, triggerEffect } from './effect.js'
import { hasChanged, isObject } from '../../shared/src'
import { reactive } from './reactive.js'

class RefImpl {
  constructor (value) {
    this._rawValue = value
    this._value = isObject(value) ? reactive(value) : value
    this.dep = new Set
  }

  get value () {
    trackEffect(this.dep)
    return this._value
  }

  set value (newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      triggerEffect(this.dep)
    }

  }
}

function ref (value) {
  return new RefImpl(value)
}

function isRef (ref) {
  return ref instanceof RefImpl
}

function unRef (ref) {
  return isRef(ref) ? ref.value : ref
}

function proxyRef (objectWithRef) {
  return new Proxy(objectWithRef, {
    get (target, key) {
      return unRef(Reflect.get(target, key))
    }
  })
}

export {
  ref, isRef, unRef
}