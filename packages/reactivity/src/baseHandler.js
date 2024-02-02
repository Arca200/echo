import { isObject, isArray, isIntegerKey, hasOwnProperty } from '@echo/shared/dist/shared.esm-bundler'
import { reactive, readonly } from './reactive'
import { Trigger, Track } from './effect'
import { TriggerTypes, TrackTypes } from './operations'

function createGet (isShallow = false, isReadonly = false) {
  return function get (target, key, property) {
    // Reflect.get 并不会触发对象的 getter 方法，它只是返回属性的值
    const res = Reflect.get(target, key, property)
    if (!isReadonly) {
      // 不是只读，收集依赖
      Track(target, key)
    }
    if (!isShallow && isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    } else {
      return res
    }
  }
}

function createSet (isShallow = false, isReadonly = false) {
  return function set (target, prop, val) {
    if (isReadonly) {
      throw new Error('readonly')
    }
    const oldValue = target[prop]
    const result = Reflect.set(target, prop, val)
    Trigger(TriggerTypes.SET, target, prop, val, oldValue)
    // const hasIndex = isArray(target) && isIntegerKey(prop) ? Number(prop) < target.length : hasOwnProperty(target, prop)
    // if (!hasIndex) {
    //   Trigger(TriggerTypes.ADD, target, prop, val, oldValue)
    // } else {
    //   if (val !== oldValue) {
    //     Trigger(TriggerTypes.SET, target, prop, val, oldValue)
    //   }
    // }
    return result
  }
}

const reactiveGet = createGet()
const shallowReactiveGet = createGet(true)
const readonlyGet = createGet(false, true)
const shallowReadonlyGet = createGet(true, true)
const reactiveSet = createSet()
const shallowReactiveSet = createSet(true)
const readonlySet = createSet(false, true)
const shallowReadonlySet = createSet(true, true)
const reactiveHandler = {
  get: reactiveGet, set: reactiveSet,
}
const shallowReactiveHandler = {
  get: shallowReactiveGet, set: shallowReactiveSet,
}
const readonlyHandler = {
  get: readonlyGet, set: readonlySet,
}

const shallowReadonlyHandler = {
  get: shallowReadonlyGet, set: shallowReadonlySet,
}
export {
  reactiveHandler, shallowReadonlyHandler, shallowReactiveHandler, readonlyHandler
}