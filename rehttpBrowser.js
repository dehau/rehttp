(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.rehttp = mod.exports;
  }
})(this, function (module) {
  'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  var _request = function _request(ctx) {
    var events = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
    var url = ctx.url;
    var method = ctx.method;
    var body = ctx.body;
    var headers = ctx.headers;
    method = method || 'GET';
    headers = headers || {};

    var parseHeaders = function parseHeaders(headers) {
      return headers.split('\r\n').filter(function (h) {
        return h.length;
      }).map(function (header) {
        return header.split(': ');
      }).reduce(function (headers, h) {
        return _extends(headers, _defineProperty({}, h[0], h[1]));
      }, {});
    };

    var xhr = new XMLHttpRequest();
    var promise = new Promise(function (resolve, reject) {
      xhr.open(method, url, true);
      Object.keys(headers).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
      xhr.addEventListener('load', function () {
        return resolve({
          status: xhr.status,
          headers: parseHeaders(xhr.getAllResponseHeaders()),
          body: xhr.response
        });
      });
      xhr.addEventListener('progress', function (progress) {
        return events('progress', progress);
      });
      xhr.upload.addEventListener('progress', function (progress) {
        return events('uploadProgress', progress);
      });
      xhr.addEventListener('error', reject);
      xhr.addEventListener('abort', reject);
      xhr.send(body);
    });
    return _extends(promise, {
      cancel: function cancel() {
        return xhr.abort();
      }
    });
  };

  module.exports = {
    request: function request(_ref) {
      var url = _ref.url;
      var _ref$method = _ref.method;
      var method = _ref$method === undefined ? 'GET' : _ref$method;
      var body = _ref.body;
      var _ref$headers = _ref.headers;
      var headers = _ref$headers === undefined ? {} : _ref$headers;
      return _request({
        url: url,
        method: method,
        body: body,
        headers: headers
      });
    },
    json: function json(_ref2) {
      var url = _ref2.url;
      var _ref2$method = _ref2.method;
      var method = _ref2$method === undefined ? 'GET' : _ref2$method;
      var body = _ref2.body;
      var _ref2$headers = _ref2.headers;
      var headers = _ref2$headers === undefined ? {} : _ref2$headers;

      if (body) {
        body = JSON.stringify(body);
      }

      headers = _extends(headers, {
        'Content-Type': 'application/json'
      });
      return module.exports.request({
        url: url,
        method: method,
        body: body,
        headers: headers
      }).then(function (res) {
        if (res.headers['content-type'] === 'application/json') {
          res.body = JSON.parse(res.body);
        }
      });
    }
  };
});
