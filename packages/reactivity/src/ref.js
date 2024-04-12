import { trackEffects, triggerEffects, isTracking } from './effect'
import { createDep } from './dep'
import { isObject, hasChanged } from '@echo/shared/src'
import { reactive } from './reactive'

class RefImpl {
  constructor (value) {
    this._rawValue = value
    this._value = convert(value)
    this.dep = createDep()
    this.__v_isRef = true
  }

  get value () {
    trackRefValue(this)
    return this._value
  }

  set value (newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._value = convert(newValue)
      this._rawValue = newValue
      triggerRefValue(this)
    }
  }
}

function ref (value) {
  return createRef(value)
}

function convert (value) {
  return isObject(value) ? reactive(value) : value
}

function createRef (value) {
  const refImpl = new RefImpl(value)
  return refImpl
}

function triggerRefValue (ref) {
  triggerEffects(ref.dep)
}

function trackRefValue (ref) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

const shallowUnwrapHandlers = {
  get (target, key, receiver) {
    return unRef(Reflect.get(target, key, receiver))
  },
  set (target, key, value, receiver) {
    const oldValue = target[key]
    if (isRef(oldValue) && !isRef(value)) {
      return (target[key].value = value)
    } else {
      return Reflect.set(target, key, value, receiver)
    }
  },
}

function proxyRefs (objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

function unRef (ref) {
  return isRef(ref) ? ref.value : ref
}

function isRef (value) {
  return !!value.__v_isRef
}

export { trackRefValue, triggerRefValue, ref, proxyRefs, unRef, isRef }