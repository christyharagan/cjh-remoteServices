'use strict';

var expect = require('chai').expect;

var msgConverter = require('../../lib/msgConverter');

describe('msgConverter', function () {
  it('should stringify and parse back to the same data', function () {
    var args = [true, 5, 'Hi!', new Buffer('\n,,{:}\"\0')];

    var string = msgConverter.stringify('myService', 'method', 'myMethod', args, 50);
    var obj = msgConverter.parse(string);

    expect(obj).to.have.property('serviceName').and.to.equal('myService');
    expect(obj).to.have.property('type').and.to.equal('method');
    expect(obj).to.have.property('name').and.to.equal('myMethod');
    expect(obj).to.have.property('callId').and.to.equal(50);
    expect(args[3]).to.deep.equal(obj.args[3]);
  });
});