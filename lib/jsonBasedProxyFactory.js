'use strict';

var Promise = require('rsvp').Promise;

var proxyFactory = require('./proxyFactory');
var msgConverter = require('./msgConverter');

module.exports.localProxyFactory = function (serviceSpec, sender, receiver, close, localProxyFactory) {
  var eventProxyFactory = function (serviceName, eventName) {
    return function (msg) {
      sender(msgConverter.stringify(serviceName, 'event', eventName, msg));
    };
  };

  var methodProxyHandler = function (serviceName, methodName, methodSpec, handler) {
    receiver(function (msg) {
      msg = msgConverter.parse(msg);

      var promise = handler(msg.args);

      if (promise) {
        promise.then(function (value) {
          sender(msgConverter.stringify(serviceName, 'methodReturn', msg.name, [value, msg.callId]));
          if (close && methodSpec.close) {
            close(value);
          }
        }, function (error) {
          sender(msgConverter.stringify(serviceName, 'methodError', msg.name, [error, msg.callId]));
          if (close && methodSpec.close) {
            close(null, error);
          }
        });
      }
    });
  };

  localProxyFactory = localProxyFactory || proxyFactory.localProxyFactory;

  return localProxyFactory(serviceSpec, eventProxyFactory, methodProxyHandler);
};

var createCallId = function (methodCallbacks) {
  var id = Date.now() << 16;
  while (methodCallbacks[id]) {
    id++;
  }
  return id;
};

module.exports.remoteProxyFactory = function (serviceSpec, sender, receiver, close, remoteProxyFactory) {
  var eventHandlers = {};
  var methodCallbacks = {};
  var closableMethods = {};

  receiver(function (msg) {
    var cb;
    msg = msgConverter.parse(msg);

    switch (msg.type) {
      case 'event':
        var handler = eventHandlers[msg.name];
        if (handler) {
          handler(msg.args);
        }
        break;
      case 'methodReturn':
        cb = 0;
        break;
      case 'methodError':
        cb = 1;
        break;
    }
    if (cb !== undefined) {
      var callback = methodCallbacks[msg.callId];
      if (callback) {
        delete methodCallbacks[msg.callId];
        callback[cb](msg.args[0]);

        if (closableMethods[msg.name]) {
          if (cb === 0) {
            close(msg.args[0]);
          } else {
            close(null, msg.args[0]);
          }
        }
      }
    }
  });

  var eventProxyHandler = function (serviceName, eventName, eventSpec, handler) {
    eventHandlers[eventName] = handler;
  };
  var methodProxyFactory = function (serviceName, methodName, methodSpec) {
    if (close && methodSpec.close) {
      closableMethods[methodName] = true;
    }
    return function (args) {
      var callId = createCallId(methodCallbacks);
      return new Promise(function (resolve, reject) {
        methodCallbacks[callId] = [resolve, reject];

        sender(msgConverter.stringify(serviceName, 'method', methodName, args, callId));
      });
    };
  };

  remoteProxyFactory = remoteProxyFactory || proxyFactory.remoteProxyFactory;

  return remoteProxyFactory(serviceSpec, eventProxyHandler, methodProxyFactory);
};