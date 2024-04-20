import patch from './patch.js'

function render (vnode, rootContainer) {
  patch(null, vnode, rootContainer)
}

export default render