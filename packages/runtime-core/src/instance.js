function createComponentInstance (vnode) {
  return {
    vnode, type: vnode.type, setupState: {},
  }
}

export {
  createComponentInstance,
}