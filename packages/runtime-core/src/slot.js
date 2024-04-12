import { isArray, isFunction } from '@echo/shared/src'
import { Fragment } from './vnode'

function initComponentSlots (instance, children) {
  if (!children) {
    return
  }
  const slots = {}
  for (let key in children) {
    const value = children[key]
    if (isArray(value)) {
      slots[key] = value
    } else if (isFunction(value)) {
      slots[key] = value
    } else {
      slots[key] = [value]
    }
  }
  instance.slots = slots
}

function renderSlots (slots, name, prop) {
  const slot = slots[name]
  if (isFunction(slot)) {
    return h(Fragment, {}, [slot(prop)])
  } else {
    return h(Fragment, {}, slot)
  }
}

export {
  initComponentSlots,
  renderSlots
}
