var EchoShared = (function (exports) {
  'use strict';

  const ShapeFlags = {
    ELEMENT: 1,
    STATEFUL_COMPONENT: 1 << 1,
    TEXT_CHILD: 1 << 2,
    ARRAY_CHILD: 1 << 3,
  };

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

  exports.ShapeFlags = ShapeFlags;
  exports.hasChanged = hasChanged;
  exports.isArray = isArray;
  exports.isBoolean = isBoolean;
  exports.isDate = isDate;
  exports.isFunction = isFunction;
  exports.isNull = isNull;
  exports.isObject = isObject;
  exports.isRegExp = isRegExp;
  exports.isString = isString;
  exports.isUndefined = isUndefined;

  return exports;

})({});
//# sourceMappingURL=shared.global.js.map
