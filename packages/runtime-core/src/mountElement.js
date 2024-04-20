import { isOn, isString, ShapeFlags } from '@echo/shared/src'
import { removeChildren, addChildren, addText, addProps, appendVNode } from '../../runtime-dom/src'

function mountElement (preSubTree, vnode, container) {
  vnode.el = document.createElement(vnode.type)
  const { shapeFlag, children, props, el } = vnode

  addProps(props, el)

  if (shapeFlag & ShapeFlags.TEXT_CHILD) {
    addText(children, el)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
    addChildren(children, el)
  }
  appendVNode(container, el)
}

function patchElement (preSubTree, currentSubTree, container) {
  const el = (currentSubTree.el = preSubTree.el)
  const preProps = preSubTree.props || {}
  const currentProps = currentSubTree.props || {}

  patchChildren(el, preSubTree, currentSubTree, container)
  patchProps(el, preProps, currentProps)
}

function patchProps (el, preProps, currentProps) {
  for (const key in currentProps) {
    const preProp = preProps[key]
    const currentProp = currentProps[key]
    if (preProp !== currentProp) {
      if (isOn(key)) {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, currentProp)
      } else {
        if (!currentProp) {
          el.removeAttribute(key)
        } else {
          el.setAttribute(key, currentProp)
        }
      }
    }
  }
}

function patchChildren (el, preSubTree, currentSubTree) {
  const currentShapeFlag = currentSubTree.shapeFlag
  const preShapeFlag = preSubTree.shapeFlag
  if (currentShapeFlag & ShapeFlags.ARRAY_CHILD && preShapeFlag & ShapeFlags.ARRAY_CHILD) {
    removeChildren(el)
    addChildren(currentSubTree.children, el)
  }
  if (currentShapeFlag & ShapeFlags.TEXT_CHILD && preShapeFlag & ShapeFlags.ARRAY_CHILD) {
    removeChildren(el)
    addText(currentSubTree.children, el)
  }
  if (currentShapeFlag & ShapeFlags.TEXT_CHILD && preShapeFlag & ShapeFlags.TEXT_CHILD) {
    addText(currentSubTree.children, el)
  }
  if (currentShapeFlag & ShapeFlags.ARRAY_CHILD && preShapeFlag & ShapeFlags.TEXT_CHILD) {
    addText('', el)
    addChildren(currentSubTree.children, el)
  }
}

export {
  mountElement, patchElement
}