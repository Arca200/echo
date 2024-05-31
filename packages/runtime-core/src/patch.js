import {isString, ShapeFlags} from '@echo/shared/src'
import {mountElement, patchElement} from './mountElement'
import {mountComponent} from './mountComponent'
import {Fragment, Text} from './vnode'

function patch(preSubTree, currentSubTree, container, parent, anchor) {
    const {type, shapeFlag} = currentSubTree
    switch (type) {
        case Fragment:
            processFragment(preSubTree, currentSubTree, container)
            break
        case Text:
            processTextNode(preSubTree, currentSubTree, container)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                processElement(preSubTree, currentSubTree, container, parent, anchor)
            } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(preSubTree, currentSubTree, container, parent)
            }
            break
    }

}

function processFragment(preSubTree, currentSubTree, container) {
    currentSubTree.children.forEach(child => {
        patch(null, child, container)
    })
}

function processTextNode(preSubTree, currentSubTree, container) {
    const {children} = currentSubTree
    const textNode = (currentSubTree.el = document.createTextNode(children))
    if (isString(container)) {
        document.querySelector(container).appendChild(textNode)
    } else {
        container.appendChild(textNode)
    }
}

function processElement(preSubTree, currentSubTree, container, parent, anchor) {
    if (!preSubTree) {
        mountElement(preSubTree, currentSubTree, container, parent, anchor)
    } else {
        patchElement(preSubTree, currentSubTree, container, parent)
    }

}

function processComponent(preSubTree, currentSubTree, container, parent) {
    mountComponent(preSubTree, currentSubTree, container, parent)
}

export default patch