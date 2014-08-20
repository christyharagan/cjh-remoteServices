'use strict';

var _ = require('underscore');
var serviceWrapper = require('cjh-services').serviceWrapper;

module.exports = function (serviceSpec, serviceImpl, interceptor) {
  var newEvents = serviceSpec.events ? _.clone(serviceSpec.events) : {};
  newEvents[serviceSpec.connectedEvent || 'connected'] = {};
  newEvents[serviceSpec.connectFailedEvent || 'connectFailed'] = {};
  newEvents[serviceSpec.disconnectedEvent || 'disconnected'] = {};
  newEvents[serviceSpec.connectingEvent || 'connecting'] = {};

  var newProperties = serviceSpec.properties ? _.clone(serviceSpec.properties) : {};
  newProperties[serviceSpec.stateProperty || 'state'] = [
    {
      name: 'connecting',
      type: 'event',
      aspect: function (args) {
        return ['connecting', args[0], args[1]];
      }
    },
    {
      name: 'connected',
      type: 'event',
      aspect: function (args) {
        return ['connected', args[0], args[1]];
      }
    },
    {
      name: 'connectFailed',
      type: 'event',
      aspect: function (args) {
        return ['connectFailed', args[0], args[1]];
      }
    },
    {
      name: 'disconnected',
      type: 'event',
      aspect: function (args) {
        return ['disconnected', args[0], args[1]];
      }
    }
  ];

  var newSpec = _.clone(serviceSpec);
  newSpec.events = newEvents;
  newSpec.properties = newProperties;

  var newServiceImpl = serviceWrapper(newSpec, serviceImpl, interceptor);

  newServiceImpl[serviceSpec.connectMethod || 'connect'] = serviceImpl[serviceSpec.connectMethod || 'connect'];
  newServiceImpl[serviceSpec.disconnectMethod || 'disconnect'] = serviceImpl[serviceSpec.disconnectMethod || 'disconnect'];
  newServiceImpl[serviceSpec.stateProperty || 'state'] = serviceImpl[serviceSpec.stateProperty || 'state'];

  return newServiceImpl;
};