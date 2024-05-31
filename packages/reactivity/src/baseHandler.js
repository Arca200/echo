import { track, trigger } from './effect.js'
import { isObject } from '../../shared/src/index.js'
import { reactive, readonly } from './reactive.js'

function createGet (isReadOnly = false, isShallow = false) {
  return (target, key) => {
    if (key === 'isReactive') {
      return !isReadOnly
    } else if (key === 'isReadOnly') {
      return isReadOnly
    }
    const res = Reflect.get(target, key)
    if (!isReadOnly) {
      track(target, key)
    }
    if (!isShallow && isObject(res)) {
      return isReadOnly ? readonly(res) : reactive(res)
    } else {
      return res
    }
  }
}

function createSet (isReadOnly = false) {
  return (target, key, val) => {
    if (isReadOnly) {
      console.error('只读响应式对象不可被赋值')
    }
    const res = Reflect.set(target, key, val)
    //TODO 触发依赖
    trigger(target, key)
    return res
  }

}

const reactiveHandler = {
  get: createGet(),
  set: createSet()
}
const shallowHandler = {
  get: createGet(false, true),
  set: createSet()
}
const readOnlyHandler = {
  get: createGet(true, false),
  set: createSet(true)
}
const shallowReadOnlyHandler = {
  get: createGet(true, true),
  set: createSet(true)
}
export {
  reactiveHandler,
  shallowHandler,
  readOnlyHandler,
  shallowReadOnlyHandler
}