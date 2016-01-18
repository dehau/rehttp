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

  function EventEmitter() {
    var listeners = {};

    this.on = function (event, cb) {
      listeners[event] = (listeners[event] || []).concat([cb]);
      return this;
    };

    this.off = function (event, cb) {
      listeners[event] = (listeners[event] || []).filter(function (listener) {
        return listener !== cb;
      });
      return this;
    };

    this.emit = function (event) {
      for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        data[_key - 1] = arguments[_key];
      }

      if (listeners[event]) {
        listeners[event].forEach(function (cb) {
          return cb.apply(undefined, data);
        });
      }

      return this;
    };

    this.addEventListener = this.on;
    this.removeEventListener = this.off;
  }

  var _request = function _request(ctx) {
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
      }).map(function (headers) {
        return header.toLowerCase();
      }).reduce(function (headers, h) {
        return _extends(headers, _defineProperty({}, h[0], h[1]));
      }, {});
    };

    var events = new EventEmitter();
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
        return events.emit('progress', progress);
      });
      xhr.upload.addEventListener('progress', function (progress) {
        return events.emit('uploadProgress', progress);
      });
      xhr.addEventListener('error', reject);
      xhr.addEventListener('abort', reject);
      xhr.send(body);
    });
    return _extends(promise, {
      cancel: function cancel() {
        return xhr.abort();
      },
      events: events
    });
  };

  function then(promise, transform) {
    var cancel = promise.cancel;
    var events = promise.events;
    return _extends(promise.then(transform), {
      cancel: cancel,
      events: events
    });
  }

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
      return then(module.exports.request({
        url: url,
        method: method,
        body: body,
        headers: headers
      }), function (res) {
        if (res.headers['content-type'].split(';')[0] === 'application/json') {
          res.body = JSON.parse(res.body);
        }

        return res;
      });
    }
  };
});
