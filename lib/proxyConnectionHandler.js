'use strict';

var NotConnectedError = function(message) {
  this.message = message;
  this.stack = (new Error()).stack;
};
NotConnectedError.prototype = Object.create(Error.prototype);
NotConnectedError.prototype.name = 'NotConnectedError';

if (connectionStatus) {
  connectionStatus.on('disconnected', function(){
    connected = false;
    if (connectionHandler) {
      connectionHandler.disconnected();
    }
  });
  connectionStatus.on('connected', function(){
    connected = true;
    if (connectionHandler) {
      connectionHandler.connected();
    }
  });

  connected = connectionStatus.isConnected;
}

