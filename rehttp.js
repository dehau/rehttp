'use strict';

var https = require('https'),
    http = require('http'),
    stream = require('stream');

var _require = require('url');

var parseUrl = _require.parse;

function requesToPromise(req, rawStream) {
  return new Promise(function (resolve, reject) {
    req.on('response', function (res) {
      var status = res.statusCode;
      var headers = res.headers;

      var body = res;
      if (rawStream) {
        resolve({ status: status, headers: headers, body: body });
      } else {
        body = [];
        res.on('data', function (chunk) {
          return body.push(chunk);
        });
        res.on('end', function () {
          body = Buffer.concat(body).toString();
          resolve({ status: status, headers: headers, body: body });
        });
      }
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

module.exports = {
  request: function request() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var emit = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
    var url = options.url;
    var _options$method = options.method;
    var method = _options$method === undefined ? 'GET' : _options$method;
    var body = options.body;
    var _options$headers = options.headers;
    var headers = _options$headers === undefined ? {} : _options$headers;
    var _options$rawStream = options.rawStream;
    var rawStream = _options$rawStream === undefined ? false : _options$rawStream;
    var agent = options.agent;

    agent = agent || new http.Agent({ maxSockets: 10, keepAlive: true });
    // avoid adding Content-Length to original headers object (copy)
    headers = JSON.parse(JSON.stringify(headers));
    // Prepare request

    var _parseUrl = parseUrl(url);

    var protocol = _parseUrl.protocol;
    var host = _parseUrl.host;
    var path = _parseUrl.path;
    var port = _parseUrl.port;

    var isHTTP = protocol === 'http:';
    var isReadStream = body instanceof stream.Readable;
    if (body && !isReadStream) {
      headers['Content-Length'] = body.length;
    }
    // Make request
    var req = (isHTTP ? http : https).request({ host: host, path: path, method: method, headers: headers, port: port });
    var promise = requesToPromise(req, rawStream);
    if (isReadStream) {
      body.pipe(req);
    } else {
      if (body) {
        req.write(body);
      }
      req.end();
    }
    // Notify observers
    var requestParams = { method: method, url: url, headers: headers, body: body };
    emit('request', requestParams);
    promise.then(function (response) {
      return emit('response', { request: requestParams, response: response });
    })['catch'](function (err) {
      return emit('error', { request: requestParams, err: err });
    });
    return promise;
  }
};

