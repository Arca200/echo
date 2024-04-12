import { isObject } from '../../shared/src/index.js'
import { Track, Trigger } from './effect'
import { isReactive, reactive, readonly } from './reactive'

function getCreator (isShallow = false, isReadOnly = false) {
  return (target, key) => {
    if (key === 'is_reactive') {
      return !isReadOnly
    }
    if (key === 'is_readonly') {
      return isReadOnly
    }
    let res = Reflect.get(target, key)
    if (!isReadOnly) {
      //TODO 收集
      Track(target, key)
    }
    if (!isShallow && isObject(res)) {
      //TODO 将res转变成响应式对象
      return isReadOnly ? readonly(res) : reactive(res)
    } else {
      return res
    }
  }
}

function setCreator (isReadOnly = false) {
  return (target, key, val) => {
    if (isReadOnly) {
      throw new Error('这是一个只读的对象')
    }
    Reflect.set(target, key, val)
    //TODO 触发依赖
    Trigger(target, key)
  }
}

const reactiveHandler = {
  get: getCreator(),
  set: setCreator()
}
const shallowHandler = {
  get: getCreator(true),
  set: setCreator()
}
const readOnlyHandler = {
  get: getCreator(false, true),
  set: setCreator(true)
}
const shallowReadOnlyHandler = {
  get: getCreator(true, true),
  set: setCreator(true)
}
export {
  reactiveHandler,
  shallowHandler,
  readOnlyHandler,
  shallowReadOnlyHandler
}