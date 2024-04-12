import { getCurrentInstance } from '../setupComponent'

function inject (key) {
  const instance = getCurrentInstance()
  if (instance) {
    if (instance.provide && instance.provide[key]) {
      return instance.provide[key]
    } else if (instance.parent) {
      return injectFromParent(instance.parent, key)
    }
  }
  return null
}

function injectFromParent (parent, key) {
  if (parent.provide && parent.provide[key]) {
    return parent.provide[key]
  } else if (parent.parent) {
    return injectFromParent(parent.parent, key)
  }
  return null
}

export {
  inject
}