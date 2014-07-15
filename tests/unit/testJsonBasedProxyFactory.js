'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);

var sampleData = require('./sampleData');

var jsonBasedProxyFactory = require('../../lib/jsonBasedProxyFactory');

var setup = function () {
  return sampleData();
};


describe('localProxyFactory', function(){
  var $ = setup();

  var localProxyFactory = jsonBasedProxyFactory.localProxyFactory($.testSpec, sender, receiver, close);
});