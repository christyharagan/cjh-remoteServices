'use strict';

var jsonBasedProxyFactory = require('../../jsonBasedProxyFactory');
var childProcess = require('child_process');
var path = require('path');

var processBootstrap = path.dirname(module.filename) + '/_processBootstrap.js';

var processes = {};

module.exports.localProxyFactory = function (serviceSpec) {
  var localSender = function (msg) {
    process.send(msg);
  };
  var localReceiver = function (handler) {
    process.on('message', handler);
  };

  return jsonBasedProxyFactory.localProxyFactory(serviceSpec, localSender, localReceiver);
};

module.exports.remoteProxyFactory = function (serviceSpec, id, implModule, implClass) {
  var process = processes[id];
  if (process) {
    return process;
  }

  process = childProcess.fork(processBootstrap, implClass ? [implModule, implClass] : [implModule]);
  processes[id] = process;

  var remoteSender = function (msg) {
    process.send(msg);
  };
  var remoteReceiver = function (handler) {
    process.on('message', handler);
  };
  var remoteClose = function () {
    process.kill();
  };

  return jsonBasedProxyFactory.remoteProxyFactory(serviceSpec, remoteSender, remoteReceiver, remoteClose);
};
