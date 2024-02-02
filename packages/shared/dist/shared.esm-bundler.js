const isObject = value => typeof value === 'object' && value !== null;
const isArray = value => Array.isArray(value);
const isFunction = value => typeof value === 'function';
const isNumber = value => typeof value === 'number';
const isString = value => typeof value === 'string';
const isBoolean = value => typeof value === 'boolean';
const isIntegerKey = key => parseInt(key) + '' === key;
const hasOwnProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export { hasOwnProperty, isArray, isBoolean, isFunction, isIntegerKey, isNumber, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
