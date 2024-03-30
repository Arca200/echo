function isObject (param) {
  return Object.prototype.toString.call(param) === '[object Object]'
}

function isString (param) {
  return Object.prototype.toString.call(param) === '[object String]'
}

function isBoolean (param) {
  return Object.prototype.toString.call(param) === '[object Boolean]'
}

function isNull (param) {
  return Object.prototype.toString.call(param) === '[object Null]'
}

function isUndefined (param) {
  return Object.prototype.toString.call(param) === '[object Undefined]'
}

function isArray (param) {
  return Object.prototype.toString.call(param) === '[object Array]'
}

function isFunction (param) {
  return Object.prototype.toString.call(param) === '[object Function]'
}

function isDate (param) {
  return Object.prototype.toString.call(param) === '[object Date]'
}

function isRegExp (param) {
  return Object.prototype.toString.call(param) === '[object RegExp]'
}

function hasChanged (param1, param2) {
  return param1 !== param2
}

export {
  isObject,
  isArray,
  isString,
  isBoolean,
  isDate,
  isFunction,
  isNull,
  isUndefined,
  isRegExp,
  hasChanged
}
export {
  ShapeFlags
} from './flags'