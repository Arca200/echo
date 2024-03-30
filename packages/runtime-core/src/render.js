import patch from './patch.js'

function render (vnode, rootContainer) {
  patch(vnode, rootContainer)
}

export default render