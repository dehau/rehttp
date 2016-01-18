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

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

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
      }).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var name = _ref2[0];
        var value = _ref2[1];
        return [name.toLowerCase(), value];
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
    request: function request(_ref3) {
      var url = _ref3.url;
      var _ref3$method = _ref3.method;
      var method = _ref3$method === undefined ? 'GET' : _ref3$method;
      var body = _ref3.body;
      var _ref3$headers = _ref3.headers;
      var headers = _ref3$headers === undefined ? {} : _ref3$headers;
      return _request({
        url: url,
        method: method,
        body: body,
        headers: headers
      });
    },
    json: function json(_ref4) {
      var url = _ref4.url;
      var _ref4$method = _ref4.method;
      var method = _ref4$method === undefined ? 'GET' : _ref4$method;
      var body = _ref4.body;
      var _ref4$headers = _ref4.headers;
      var headers = _ref4$headers === undefined ? {} : _ref4$headers;

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
