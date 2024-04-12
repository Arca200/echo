import { hasOwnProperty } from '@echo/shared/src'

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots
}
const instanceProxyHandler = {
  get ({ _: instance }, key) {
    const { setupState, props } = instance
    if (hasOwnProperty(setupState, key)) {
      return setupState[key]
    } else if (hasOwnProperty(props, key)) {
      return props[key]
    }
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}

export default instanceProxyHandler