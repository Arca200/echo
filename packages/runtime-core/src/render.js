import createComponentInstance from './component.js'

function render (vnode, rootContainer) {
  //patch
  patch(vnode, rootContainer)
}

function patch (vnode, rootContainer) {
  processComponent(vnode, rootContainer)
}

function processComponent (vnode, rootContainer) {
  mountComponent(vnode, rootContainer)
}

function mountComponent (vnode, rootContainer) {
  createComponentInstance(vnode, rootContainer)
}

export default render