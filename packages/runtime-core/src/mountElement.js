import { isString, ShapeFlags } from '@echo/shared/src'
import patch from './patch'

function mountElement (vnode, container) {
  vnode.el = document.createElement(vnode.type)

  const { shapeFlag, children, props, el } = vnode
  const isOn = (key) => /^on[A-Za-z]+/.test(key)
  for (const elKey in props) {
    const val = props[elKey]
    if (isOn(elKey)) {
      const event = elKey.slice(2).toLowerCase()
      el.addEventListener(event, val)
    } else {
      el.setAttribute(elKey, val)
    }
  }
  if (shapeFlag & ShapeFlags.TEXT_CHILD) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
    children.forEach(child => {
      patch(child, el)
    })
  }

  if (isString(container)) {
    document.querySelector(container).appendChild(el)
  } else {
    container.appendChild(el)
  }
}

export {
  mountElement
}