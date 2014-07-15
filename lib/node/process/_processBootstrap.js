var proxyFactory = require('./processProxyFactory');
var impl = require(process.argv[2]);
if (process.argv[3]) {
  impl = impl[process.argv[3]];
}

proxyFactory(impl);