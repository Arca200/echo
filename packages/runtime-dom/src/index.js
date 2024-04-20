import patch from '@echo/runtime/src/patch'
import { isOn, isString } from '@echo/shared/src'

function removeChildren (node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function addChildren (children, el) {
  children.forEach(child => {
    patch(null, child, el)
  })
}

function addText (text, el) {
  el.textContent = text
}

function addProps (props, el) {
  for (const key in props) {
    const value = props[key]
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase()
      el.addEventListener(event, value)
    } else {
      el.setAttribute(key, value)
    }
  }
}

function appendVNode (container, VNode) {
  if (isString(container)) {
    document.querySelector(container).appendChild(VNode)
  } else {
    container.appendChild(VNode)
  }
}

export {
  appendVNode,
  addProps,
  addText,
  addChildren,
  removeChildren,
}