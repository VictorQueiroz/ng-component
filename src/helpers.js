var extend = angular.extend,
		forEach = angular.forEach,
		isObject = angular.isObject,
		isDefined = angular.isDefined,
		isFunction = angular.isFunction,
		isUndefined = angular.isUndefined,
		propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

function isScope(s) {
  return isDefined(s) && isFunction(s.$evalAsync) && isFunction(s.$$postDigest);
}

function inherits (ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}

var reIsUint = /^\d+$/,
    reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

var MAX_SAFE_INTEGER = 9007199254740991;

function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

function toObject(value) {
  return isObject(value) ? value : Object(value);
}

function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

function has(object, path) {
  if (object == null) {
    return false;
  }
  var result = hasOwnProperty.call(object, path);
  if (!result && !isKey(path)) {
    path = toPath(path);
    object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
    if (object == null) {
      return false;
    }
    path = last(path);
    result = hasOwnProperty.call(object, path);
  }
  return result || (isLength(object.length) && isIndex(path, object.length) &&
    (isArray(object) || isArguments(object)));
}

DefaultClass.extend = function (protoProps, staticProps) {
  var parent = this;
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent constructor.
  if (protoProps && has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ return parent.apply(this, arguments); };
  }

  // Add static properties to the constructor function, if supplied.
  extend(child, parent, staticProps);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent` constructor function.
  var Surrogate = function(){ this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) extend(child.prototype, protoProps);

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;

  return child;
};

inherits(DefaultClass, EventEmitter);

function DefaultClass () {
	if(isFunction(this.initialize)) {
    this.initialize.apply(this, arguments);
  }
}

function createClass (protoProps, staticProps) {
	return DefaultClass.extend(protoProps, staticProps);
}

var id = 0;
function nextId() {
  return id++;
}

angular.module('component').factory('$$helpers', function () {
  return {
    createClass: createClass,
    nextId: nextId,
    digest: function (scope) {
      return function (fn) {
        if(scope.$$phase || scope.$root.$$phase) {
          fn(scope);
        } else {
          scope.$apply(fn);
        }
      };
    }
  };
});