import {isObject} from "@echo/shared/dist/shared.esm-bundler"
import {reactiveHandler, shallowReactiveHandler, shallowReadonlyHandler, readonlyHandler} from "./baseHandler";

const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()

function createReactiveObject(target, isReadOnly, baseHandler) {
    if (!isObject(target)) {
        return new Error('Reactive object must be an object')
    }
    const proxyMap = isReadOnly ? readonlyMap : reactiveMap
    const proxyEs = proxyMap.get(target)
    if (proxyEs) {
        return proxyEs
    } else {
        const proxy = new Proxy(target, baseHandler)
        proxyMap.set(target, proxy)
        return proxy
    }
}

export function reactive(target) {
    return createReactiveObject(target, false, reactiveHandler)
}

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandler)
}

export function readonly(target) {
    return createReactiveObject(target, true, readonlyHandler)
}

export function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandler)
}