'use strict';

var _ = require('underscore');

module.exports.stringify = function (serviceName, type, name, args, callId) {
  var buffers = [];
  var json = {
    serviceName: serviceName,
    type: type,
    name: name,
    args: _.map(args, function (value, key) {
      if (Buffer.isBuffer(value)) {
        buffers.push(key);
        return value.toString('base64');
      } else {
        return value;
      }
    }),
    buffers: buffers
  };
  if (callId) {
    json.callId = callId;
  }

  return JSON.stringify(json);
};

module.exports.parse = function (msg) {
  msg = JSON.parse(msg);
  msg.buffers.forEach(function (key) {
    msg.args[key] = new Buffer(msg.args[key], 'base64');
  });
  return msg;
};