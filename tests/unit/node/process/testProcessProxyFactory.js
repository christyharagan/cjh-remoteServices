'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);

var sampleData = require('../sampleData');

var processProxyFactory = require('../../../../lib/node/process/processProxyFactory');

var path = require('path');

var connectionModule = path.dirname(module.filename) + '../sampleData';

var setup = function () {
  return sampleData();
};

describe('localProxyFactory', function () {
  var $ = setup();

  var localProxyFactory = processProxyFactory.localProxyFactory($.testSpec)($.testImpl);
});

describe('remoteProxyFactory', function () {
  var $ = setup();

  var remoteProxyFactory = processProxyFactory.remoteProxyFactory($.testSpec, 'testId', connectionModule);
});