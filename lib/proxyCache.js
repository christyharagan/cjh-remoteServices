'use strict';

var Promise = require('rsvp').Promise;

var CacheFullError = function(message) {
  this.message = message;
  this.stack = (new Error()).stack;
};
CacheFullError.prototype = Object.create(Error.prototype);
CacheFullError.prototype.name = 'CacheFullError';
module.exports.CacheFullError = CacheFullError;

var isThrottled = function (config, cache, clearCache) {
  return (config.throttled && config.throttled(cache, clearCache)) ||
    (config.connectionHandler && !config.connectionHandler.isConnected);
};

module.exports.localProxyCache = function (config, localProxyFactory) {
  var cache = [];

  var clearCache = function () {
    if (cache.length > 0) {
      if (config.makeSingleCachedCall) {
        var cacheCopy = cache;
        cache = [];

        config.makeSingleCachedCall(cacheCopy);
//        .then(function (results) {
//          var i = 0;
//          results.forEach(function (result) {
//            if (result[0]) {
//              cacheCopy[i++][2](result[0]);
//            } else {
//              cacheCopy[i++][3](result[1]);
//            }
//          });
//        }, function (error) {
//          cacheCopy.forEach(function (methodCall) {
//            methodCall[3](error);
//          });
//        });
      } else {
        while (cache.length > 0) {
          var methodCall = cache.splice(0, 1);
          makeMethodCall(methodCall);
        }
      }
    }
  };

  return function (serviceSpec, eventProxyFactory, methodProxyHandler) {
    var cachingMethodProxyHandler = function (serviceName, methodName, methodSpec, methodImpl) {
      var cachingMethodImpl = function (args) {
        var promise = methodImpl(args);

        return new Promise(function (resolve, reject) {
          promise.then(function (value) {
            if (isThrottled(config, cache, clearCache)) {
              addEntry
            } else {
              resolve(value);
            }
          }, function (error) {
            if (isThrottled(config, cache, clearCache)) {

            } else {
              reject(error);
            }
          });
        });
      };

      methodProxyHandler(serviceName, methodName, methodSpec, cachingMethodImpl);
    };
    var cachingEventProxyFactory = function (serviceName, eventName, eventSpec) {
      var eventProxy = eventProxyFactory(serviceName, eventName, eventSpec);

      return function (event, args) {
        if (isThrottled(config, cache, clearCache)) {

        } else {
          eventProxy(event, args);
        }
      };
    };

    return localProxyFactory(serviceSpec, cachingEventProxyFactory, cachingMethodProxyHandler);
  };
};

module.exports.throttle = function (time, cacheSize) {
  var throttled = false;

  return function (cache, clearCache) {
    if (throttled) {
      return true;
    } else if (time) {
      throttled = true;
      setTimeout(function () {
        throttled = false;
        clearCache();
      }, time);
      return false;
    } else {
      return cacheSize !== undefined && cache.length + 1 < cacheSize;
    }
  };
};

module.exports.remoteProxyCache = function (config) {
  var cache = [];
  var addEntry = function (remoteMethod, args, makeCall) {
    if (config.backPressure && config.backPressure(cache)) {
      if (makeCall) {
        clearCache();
      } else {
        return new Promise(function (resolve, reject){
          reject(new CacheFullError());
        });
      }
    }

    var promise = new Promise(function (resolve, reject) {
      cache.push([remoteMethod, args, resolve, reject]);
    });

    if (makeCall) {
      clearCache();
    }

    return promise;
  };

  var makeMethodCall = function (methodCall) {
    var resolve = methodCall[2];
    var reject = methodCall[3];

    methodCall[0](methodCall[1]).then(function (value) {
      resolve[2](value);
    }, function (error) {
      reject[3](error);
    });
  };

  var clearCache = function () {
    if (cache.length > 0) {
      if (config.makeSingleCachedCall) {
        var cacheCopy = cache;
        cache = [];

        config.makeSingleCachedCall(cacheCopy).then(function (results) {
          var i = 0;
          results.forEach(function (result) {
            if (result[0]) {
              cacheCopy[i++][2](result[0]);
            } else {
              cacheCopy[i++][3](result[1]);
            }
          });
        }, function (error) {
          cacheCopy.forEach(function (methodCall) {
            methodCall[3](error);
          });
        });
      } else {
        while (cache.length > 0) {
          var methodCall = cache.splice(0, 1);
          makeMethodCall(methodCall);
        }
      }
    }
  };
  if (config.connectionHandler) {
    config.connectionHandler.on('connected', function () {
      clearCache();
    });
  }

  return function (methodProxyFactory) {
    return function (serviceName, methodName, methodSpec) {
      var remoteMethod = methodProxyFactory(serviceName, methodName, methodSpec);

      return function (args) {
        if (isThrottled(config, cache, 'methodCall', methodName, args, clearCache)) {
          return addEntry(remoteMethod, args);
        } else {
          return addEntry(remoteMethod, args, true);
        }
      };
    };
  };
};