import { TriggerTypes } from './operations'
import { isArray, isIntegerKey } from '@echo/shared/dist/shared.esm-bundler'

export function effect (fn, options = { lazy: false }) {
  const reactiveEffectCreator = createReactiveEffect(fn, options)
  if (!options.lazy) {
    reactiveEffectCreator()
  }
  return reactiveEffectCreator
}

let reactiveEffectCreatorStack = []
let currentReactiveEffectCreator = undefined
let uid = 0

function createReactiveEffect (fn, options) {
  const reactiveEffectCreator = function () {
    if (!reactiveEffectCreatorStack.includes(reactiveEffectCreator)) {
      try {
        reactiveEffectCreatorStack.push(reactiveEffectCreator)
        currentReactiveEffectCreator = reactiveEffectCreator
        fn()
      } finally {
        reactiveEffectCreatorStack.pop()
        currentReactiveEffectCreator = reactiveEffectCreatorStack[reactiveEffectCreatorStack.length - 1]
      }
    }
  }
  reactiveEffectCreator.id = uid++
  reactiveEffectCreator.fn = fn
  reactiveEffectCreator.options = options
  return reactiveEffectCreator
}

// JavaScript 中的构造函数可以省略括号
let targetMap = new WeakMap

export function Track (target, key) {
  if (!currentReactiveEffectCreator) {
    return
  }
  let depMap = targetMap.get(target)
  if (!depMap) {
    targetMap.set(target, (depMap = new Map))
  }
  let dep = depMap.get(key)
  if (!dep) {
    depMap.set(key, (dep = new Set))
  }
  if (!dep.has(currentReactiveEffectCreator)) {
    dep.add(currentReactiveEffectCreator)
  }
}

export function Trigger (type, target, key, newValue, oldValue) {
  const depMap = targetMap.get(target)
  if (!depMap) {
    return
  }
  const reactiveEffectSet = new Set
  const add = (depMap) => {
    if (depMap) {
      depMap.forEach(effect => reactiveEffectSet.add(effect))
    }
  }
  add(depMap.get(key))
  // if (key === 'length' && isArray(target)) {
  //   depMap.forEach((dep, key) => {
  //     if (key === 'length' || key >= length) {
  //       add(dep)
  //     }
  //   })
  // } else {
  //   if (key != undefined) {
  //     add(depMap.get(key))
  //   }
  //   switch (type) {
  //     case TriggerTypes.ADD:
  //       if (isArray(target) && isIntegerKey(key)) {
  //         add(depMap.get('length'))
  //       }
  //   }
  // }
  reactiveEffectSet.forEach(effect => effect())
}