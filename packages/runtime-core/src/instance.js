import emit from './emit'

function createComponentInstance (vnode) {
  const instance = {
    vnode, type: vnode.type, setupState: {}, props: {}, emit: () => {}, slots: {}
  }
  instance.emit = emit.bind(null, instance)
  return instance
}

export {
  createComponentInstance,
}