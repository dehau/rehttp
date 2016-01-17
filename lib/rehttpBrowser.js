let request = function(ctx, events = () => {}) {
  let { url, method, body, headers } = ctx;
  method = method || 'GET';
  headers = headers || {};
  let parseHeaders = headers => {
    return headers
      .split('\r\n')
      .filter(h => h.length)
      .map(header => header.split(': '))
      .reduce((headers, h) => Object.assign(headers, { [h[0]]: h[1] }), {});
  };

  let xhr = new XMLHttpRequest();

  let promise = new Promise((resolve, reject) => {
    xhr.open(method, url, true); // reject promise on open throwing error
    Object.keys(headers)
      .forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
    xhr.addEventListener('load', () => resolve({
      status: xhr.status,
      headers: parseHeaders(xhr.getAllResponseHeaders()),
      body: xhr.response
    }));
    xhr.addEventListener('progress', progress => events('progress', progress));
    xhr.upload.addEventListener('progress', progress => events('uploadProgress', progress));
    xhr.addEventListener('error', reject);
    xhr.addEventListener('abort', reject);
    xhr.send(body);
  });

  return Object.assign(promise, { cancel: () => xhr.abort() });
};


module.exports = {
  request({ url, method = 'GET', body, headers = {} }) {
    return request({ url, method, body, headers });
  },
  json({ url, method = 'GET', body, headers = {} }) {
    if (body) {
      body = JSON.stringify(body);
    }
    headers = Object.assign(headers, { 'Content-Type': 'application/json' });
    return module.exports.request({ url, method, body, headers })
      .then(res => {
        if (res.headers['content-type'] === 'application/json') {
          res.body = JSON.parse(res.body);
        }
      })
  }
};
