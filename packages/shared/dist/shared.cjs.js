'use strict';

const isObject = value => typeof value === 'object' && value !== null;
const isArray = value => Array.isArray(value);
const isFunction = value => typeof value === 'function';
const isNumber = value => typeof value === 'number';
const isString = value => typeof value === 'string';
const isBoolean = value => typeof value === 'boolean';
const isIntegerKey = key => parseInt(key) + '' === key;
const hasOwnProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

exports.hasOwnProperty = hasOwnProperty;
exports.isArray = isArray;
exports.isBoolean = isBoolean;
exports.isFunction = isFunction;
exports.isIntegerKey = isIntegerKey;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
//# sourceMappingURL=shared.cjs.js.map
