const publicPropertiesMap = {
  $el: (i) => i.vnode.el
}
export const instanceProxyHandler = {
  get ({ _: instance }, key) {
    const { setupState, props } = instance
    const hasOwnProperty = (val, key) => Object.prototype.hasOwnProperty.call(val, key)
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