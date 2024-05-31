const ShapeFlags = {
    ELEMENT: 1,
    STATEFUL_COMPONENT: 1 << 1,
    TEXT_CHILD: 1 << 2,
    ARRAY_CHILD: 1 << 3,
};

function getSequence (arr) {
  let p;
  if (arr) {
    p = arr.slice();
  }

  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result
}

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

function hasOwnProperty (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function isOn (key) {
  return /^on[A-Za-z]+/.test(key)
}

const extend = Object.assign;

export { ShapeFlags, extend, getSequence, hasChanged, hasOwnProperty, isArray, isBoolean, isDate, isFunction, isNull, isObject, isOn, isRegExp, isString, isUndefined };
//# sourceMappingURL=shared.esm-bundler.js.map
