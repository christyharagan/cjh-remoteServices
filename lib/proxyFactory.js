'use strict';

var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

module.exports.localProxyFactory = function (serviceSpec, eventProxyFactory, methodProxyHandler) {
  var serviceName = serviceSpec.name;
  var events = serviceSpec.events;
  var methods = serviceSpec.methods;

  return function (impl) {
    _.each(events, function (eventSpec, eventName) {
      impl.on(eventName, eventProxyFactory(serviceName, eventName, eventSpec));
    });

    _.each(methods, function (methodSpec, methodName) {
      methodProxyHandler(serviceName, methodName, methodSpec, function (args) {
        return impl[methodName](args);
      });
    });
  };
};

var _eachApply = function (list, value) {
  list.forEach(function (func) {
    func(value);
  });
};

module.exports.remoteProxyFactory = function (serviceSpec, eventProxyHandler, methodProxyFactory) {
  var serviceName = serviceSpec.name;
  var events = serviceSpec.events || [];
  var methods = serviceSpec.methods || [];
  var aspects = serviceSpec.aspects || [];
  var properties = serviceSpec.properties || [];

  var methodAspects = {};
  var eventAspects = {};

  var remoteProxy = new EventEmitter();

  _.each(methods, function(methodSpec, methodName){
    var remoteMethod = methodProxyFactory(serviceName, methodName, methodSpec);
    var aspectsForMethod = methodAspects[methodName];
    if (!aspectsForMethod) {
      aspectsForMethod = {
        call: [],
        return: [],
        error: []
      };
      methodAspects[methodName] = aspectsForMethod;
    }

    remoteProxy[methodName] = function (args) {
      _eachApply(aspectsForMethod.call, args);

      var promise = remoteMethod(args);

      promise
        .then(_.partial(_eachApply, aspectsForMethod.return), _.partial(_eachApply, aspectsForMethod.error));

      return promise;
    };
  });

  _.each(events, function (eventSpec, eventName) {
    var aspectsForEvent = eventAspects[eventName];
    if (!aspectsForEvent) {
      aspectsForEvent = [];
      eventAspects[eventName] = aspectsForEvent;
    }

    eventProxyHandler(serviceName, eventName, eventSpec, function (value) {
      _eachApply(aspectsForEvent, value);

      remoteProxy.emit(eventName, value);
    });
  });

  var handleAspectSpec = function (type, name, aspect) {
    switch (type) {
      case 'methodCall':
      case 'methodReturn':
      case 'methodError':
        var aspectsForMethod = methodAspects[name];
        if (aspectsForMethod) {
          var arr;
          switch (type) {
            case 'methodCall':
              arr = aspectsForMethod.call;
              break;
            case 'methodReturn':
              arr = aspectsForMethod.return;
              break;
            case 'methodError':
              arr = aspectsForMethod.error;
              break;
          }
          arr.push(aspect);
        }
        break;
      case 'event':
        var aspectsForEvent = eventAspects[name];
        if (aspectsForEvent) {
          aspectsForEvent.push(aspect);
        }
        break;
    }
  };

  aspects.forEach(function (aspectSpec) {
    handleAspectSpec(aspectSpec.type, aspectSpec.name, aspectSpec.aspect);
  });

  _.each(properties, function (propertySpecs, property) {
    propertySpecs.forEach(function (propertySpec) {
      handleAspectSpec(propertySpec.type, propertySpec.name, function (arg) {
        var value;
        if (propertySpec.aspect) {
          value = propertySpec.aspect(arg, remoteProxy[property]);
        } else {
          value = propertySpec.value;
        }
        remoteProxy[property] = value;

        if (propertySpec.changeEvent) {
          remoteProxy.emit(propertySpec.changeEvent, value);
        }
      });
    });
  });

  return remoteProxy;
};
