'use strict';

var Promise = require('rsvp').Promise;
var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;

module.exports = function () {
  var error = {
    msg: 'Test Error'
  };
  var testImpl = new EventEmitter();
  testImpl.m1 = sinon.stub().returns(new Promise(function (resolve) {
    resolve();
  }));
  testImpl.m2 = sinon.stub().throws(error);

  var localEventProxy = sinon.stub();
  var localEventProxyFactory = sinon.stub().returns(localEventProxy);

  var methodCallbacks = {};

  var localMethodProxy = function (s, name, m, cb) {
    methodCallbacks[name] = cb;
  };

  localMethodProxy = sinon.spy(localMethodProxy);

  var eventCallbacks = {};
  var remoteEventProxy = function (s, name, e, cb) {
    eventCallbacks[name] = cb;
  };
  remoteEventProxy = sinon.spy(remoteEventProxy);
  var remoteMethodProxy = sinon.stub().returns(new Promise(function (resolve) {
    resolve();
  }));
  var remoteMethodProxyFactory = sinon.stub().returns(remoteMethodProxy);

  return {
    testSpec: {
      name: 'testService',

      methods: {
        m1: {},
        m2: {}
      },

      events: {
        e1: {}
      },

      aspects: [
        {
          type: 'methodReturn',
          name: 'm1',
          aspect: sinon.spy()
        },
        {
          type: 'methodError',
          name: 'm2',
          aspect: sinon.spy()
        }
      ],

      properties: {
        p1: [
          {
            type: 'methodCall',
            name: 'm1',
            aspect: function (a1) {
              return a1;
            }
          },
          {
            type: 'event',
            name: 'e1',
            aspect: function (p1, a2) {
              return p1 + a2;
            }
          }
        ]
      }
    },

    testImpl: testImpl,
    error: error,

    localEventProxy: localEventProxy,
    localEventProxyFactory: localEventProxyFactory,
    localMethodProxy: localMethodProxy,
    methodCallbacks: methodCallbacks,

    remoteEventProxy: remoteEventProxy,
    remoteMethodProxy: remoteMethodProxy,
    remoteMethodProxyFactory: remoteMethodProxyFactory,
    eventCallbacks: eventCallbacks
  };
};