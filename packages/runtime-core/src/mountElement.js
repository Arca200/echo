import { getSequence, isOn, ShapeFlags } from '@echo/shared/src'
import {
  addChildren,
  addProps,
  addText,
  appendVNode,
  removeChildren,
} from '../../runtime-dom/src'
import patch from './patch'

function mountElement(preSubTree, vnode, container, parent, anchor) {
  vnode.el = document.createElement(vnode.type)
  const { shapeFlag, children, props, el } = vnode

  addProps(props, el)

  if (shapeFlag & ShapeFlags.TEXT_CHILD) {
    addText(children, el)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILD) {
    addChildren(children, el)
  }
  if (anchor) {
    anchor.parentNode.insertBefore(el, anchor)
  } else {
    appendVNode(container, el)
  }
}

function patchElement(preSubTree, currentSubTree, container, parent) {
  const el = (currentSubTree.el = preSubTree.el)
  const preProps = preSubTree.props || {}
  const currentProps = currentSubTree.props || {}

  patchChildren(el, preSubTree, currentSubTree, container, parent)
  patchProps(el, preProps, currentProps)
}

function patchProps(el, preProps, currentProps) {
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

function patchChildren(el, preSubTree, currentSubTree, container, parent) {
  const currentShapeFlag = currentSubTree.shapeFlag
  const preShapeFlag = preSubTree.shapeFlag
  const currentChidlren = currentSubTree.children
  const prevChidlren = preSubTree.children
  if (
    currentShapeFlag & ShapeFlags.ARRAY_CHILD &&
    preShapeFlag & ShapeFlags.ARRAY_CHILD
  ) {
    diff(prevChidlren, currentChidlren, container, parent)
  }
  if (
    currentShapeFlag & ShapeFlags.TEXT_CHILD &&
    preShapeFlag & ShapeFlags.ARRAY_CHILD
  ) {
    removeChildren(el)
    addText(currentChidlren, el)
  }
  if (
    currentShapeFlag & ShapeFlags.TEXT_CHILD &&
    preShapeFlag & ShapeFlags.TEXT_CHILD
  ) {
    addText(currentChidlren, el)
  }
  if (
    currentShapeFlag & ShapeFlags.ARRAY_CHILD &&
    preShapeFlag & ShapeFlags.TEXT_CHILD
  ) {
    addText('', el)
    addChildren(currentChidlren, el)
  }
}

function diff(prevChidlren, currentChidlren, container, parent) {
  const isSameVnodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }
  let left = 0
  let prevRight = prevChidlren.length - 1
  let currentRight = currentChidlren.length - 1
  while (left <= prevRight && left <= currentRight) {
    const n1 = prevChidlren[left]
    const n2 = currentChidlren[left]
    if (isSameVnodeType(n1, n2)) {
      patch(n1, n2, container, parent)
    } else {
      break
    }
    ++left
  }
  while (left <= prevRight && left <= currentRight) {
    const n1 = prevChidlren[prevRight]
    const n2 = currentChidlren[currentRight]
    if (isSameVnodeType(n1, n2)) {
      patch(n1, n2, container, parent)
    } else {
      break
    }
    --prevRight
    --currentRight
  }
  if (left > prevRight) {
    let count = 0
    let ancher = left
    while (left <= currentRight - count) {
      let ancherNode = prevChidlren[ancher]
      patch(
        null,
        currentChidlren[left + count],
        parent.vnode.el,
        null,
        ancherNode.el
      )
      ++count
    }
  } else if (left > currentRight) {
    let l = left
    while (l <= prevRight) {
      parent.vnode.el.removeChild(prevChidlren[l].el)
      l++
    }
  } else {
    let preLeft = left
    let currentLeft = left
    const keyMap = new Map()
    const map = new Array(currentRight - currentLeft + 1).fill(0)
    for (let i = currentLeft; i <= currentRight; i++) {
      const child = currentChidlren[i]
      keyMap.set(child.key, i)
    }
    console.log(keyMap)
    for (let i = preLeft; i <= prevRight; i++) {
      const child = prevChidlren[i]
      let index = keyMap.get(child.key)
      if (index === undefined) {
        parent.vnode.el.removeChild(child.el)
      } else {
        console.log(index, currentLeft)
        map[index - currentLeft] = i
        console.log(map)
        patch(child, currentChidlren[index], parent.vnode.el, null, null)
      }
    }
    const increasingSequence = getSequence(map)
    console.log(increasingSequence)
  }
}

export { mountElement, patchElement }
