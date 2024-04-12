import emit from './emit'

function createComponentInstance (vnode, parent) {
  const instance = {
    vnode, type: vnode.type, setupState: {}, props: {}, emit: () => {}, slots: {}, provide: {}, parent
  }
  instance.emit = emit.bind(null, instance)
  return instance
}

export {
  createComponentInstance,
}