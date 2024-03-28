function isObject(param) {
    return Object.prototype.toString.call(param) === '[object Object]'
}

export {
    isObject
}