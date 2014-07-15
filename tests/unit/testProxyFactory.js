'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var sampleData = require('./sampleData');

var proxyFactory = require('../../lib/proxyFactory');

var setup = function () {
  return sampleData();
};

describe('localProxyFactory', function () {
  it('should call the proxies with the appropriate specification details', function () {
    var $ = setup();

    proxyFactory.localProxyFactory($.testSpec, $.localEventProxyFactory, $.localMethodProxy)($.testImpl);

    expect($.localEventProxyFactory.calledOnce,
      'EventProxyFactory to be called once').to.be.true;
    expect($.localEventProxyFactory.calledWith('testService', 'e1', $.testSpec.events.e1),
      'EventProxyFactory called with correct args').to.be.true;

    expect($.localMethodProxy.calledTwice,
      'MethodProxyHandler to be called twice').to.be.true;
    expect($.localMethodProxy.getCall(0).calledWith('testService', 'm1', $.testSpec.methods.m1),
      'MethodProxyHandler to be called with first method spec').to.be.true;
    expect($.localMethodProxy.getCall(1).calledWith('testService', 'm2', $.testSpec.methods.m2),
      'MethodProxyHandler to be called with second method spec').to.be.true;
  });

  it('should call the appropriate methods of the implementing service', function () {
    var $ = setup();

    proxyFactory.localProxyFactory($.testSpec, $.localEventProxyFactory, $.localMethodProxy)($.testImpl);

    $.methodCallbacks.m1([1, true, 'arg1']);

    expect($.testImpl.m1.calledOnce,
      'Method "m1" to be called once').to.be.true;
    expect($.testImpl.m1.calledWithExactly([1, true, 'arg1']),
      'Method "m1" to be called with the correct arguments').to.be.true;

    expect($.methodCallbacks.m2,
      'Method m2 to throw correct exception').to.throw($.error);

    expect($.testImpl.m2.calledOnce,
      'Method "m2" to be called once').to.be.true;
  });

  it('should respond to the appropriate event of the implementing service', function () {
    var $ = setup();

    proxyFactory.localProxyFactory($.testSpec, $.localEventProxyFactory, $.localMethodProxy)($.testImpl);

    $.testImpl.emit('e2', 'IgnoredEvent');

    expect($.localEventProxy.neverCalledWith(),
      'EventProxyHandler to not have been called').to.be.true;

    $.testImpl.emit('e1', 'TestEvent');

    expect($.localEventProxy.calledOnce,
      'EventProxyHandler to be called once').to.be.true;
    expect($.localEventProxy.calledWithExactly('TestEvent'),
      'EventProxyHandler to be called with correct arguments').to.be.true;
  });
});

describe('remoteProxyFactory', function () {
  it('should call the proxies with the appropriate specification details', function () {
    var $ = setup();

    proxyFactory.remoteProxyFactory($.testSpec, $.remoteEventProxy, $.remoteMethodProxyFactory);

    expect($.remoteEventProxy.calledOnce,
      'EventProxyFactory to be called once').to.be.true;
    expect($.remoteEventProxy.calledWith('testService', 'e1', $.testSpec.events.e1),
      'EventProxyFactory called with correct args').to.be.true;

    expect($.remoteMethodProxyFactory.calledTwice,
      'MethodProxyHandler to be called twice').to.be.true;
    expect($.remoteMethodProxyFactory.getCall(0).calledWith('testService', 'm1', $.testSpec.methods.m1),
      'MethodProxyHandler to be called with first method spec').to.be.true;
    expect($.remoteMethodProxyFactory.getCall(1).calledWith('testService', 'm2', $.testSpec.methods.m2),
      'MethodProxyHandler to be called with second method spec').to.be.true;
  });

  it('should call the appropriate method proxy', function () {
    var $ = setup();

    var remoteProxy = proxyFactory.remoteProxyFactory($.testSpec, $.remoteEventProxy, $.remoteMethodProxyFactory);

    expect(remoteProxy,
      'the "m1" method to be on the remote proxy').to.have.property('m1').and.is.a('function');
    expect(remoteProxy,
      'the "m2" method to be on the remote proxy').to.have.property('m2').and.is.a('function');

    remoteProxy.m1([1, true, 'arg1']);

    expect($.remoteMethodProxy.calledOnce,
      'MethodProxyHandler to be called once').to.be.true;
    expect($.remoteMethodProxy.calledWith([1, true, 'arg1']),
      'MethodProxyHandler to be called with correct arguments').to.be.true;
  });

  it('should emit the appropriate event', function () {
    var $ = setup();

    var remoteProxy = proxyFactory.remoteProxyFactory($.testSpec, $.remoteEventProxy, $.remoteMethodProxyFactory);

    expect(remoteProxy,
      'the "emit" method to be on the remote proxy').to.have.property('emit').and.is.a('function');
    expect(remoteProxy,
      'the "on" method to be on the remote proxy').to.have.property('on').and.is.a('function');

    sinon.spy(remoteProxy, 'emit');

    $.eventCallbacks.e1('Event');

    expect(remoteProxy.emit.calledOnce,
      '"on" method to be called once').to.be.true;
    expect(remoteProxy.emit.calledWith('e1', 'Event'),
      '"on" method to be called with correct arguments').to.be.true;
  });

  it('should call the appropriate aspects', function () {
    var $ = setup();

    var remoteProxy = proxyFactory.remoteProxyFactory($.testSpec, $.remoteEventProxy, $.remoteMethodProxyFactory);

    remoteProxy.m1(5);

    remoteProxy.m2();

  });

  it('should call update appropriate properties', function () {
    var $ = setup();

    var remoteProxy = proxyFactory.remoteProxyFactory($.testSpec, $.remoteEventProxy, $.remoteMethodProxyFactory);

  });
});