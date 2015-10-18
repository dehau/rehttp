let https  = require('https'),
    http   = require('http'),
    stream = require('stream');

let { parse: parseUrl } = require('url');

function requesToPromise(req, rawStream) {
  return new Promise((resolve, reject) => {
    req.on('response', res => {
      let { statusCode: status, headers } = res;
      let body = res;
      if (rawStream) {
        resolve({ status, headers, body });
      } else {
        body = [];
        res.on('data', chunk => body.push(chunk));
        res.on('end', () => {
          body = Buffer.concat(body).toString();
          resolve({ status, headers, body });
        });
      }
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

module.exports = {
  request(options = {}, emit = () => {}) {
    let { url, method = 'GET', body, headers = {}, rawStream = false, agent } = options
    agent = agent || new http.Agent({ maxSockets: 10, keepAlive: true });
    // avoid adding Content-Length to original headers object (copy)
    headers = JSON.parse(JSON.stringify(headers));
    // Prepare request
    let { protocol, host, path, port } = parseUrl(url);
    let isHTTP = protocol === 'http:';
    let isReadStream = body instanceof stream.Readable;
    if (body && !isReadStream) {
      headers['Content-Length'] = body.length;
    }
    // Make request
    let req = (isHTTP ? http : https)
      .request({host, path, method, headers: headers, port});
    let promise = requesToPromise(req, rawStream);
    if (isReadStream) {
      body.pipe(req);
    } else {
      if (body) {
        req.write(body);
      }
      req.end();
    }
    // Notify observers
    let requestParams = { method, url, headers, body };
    emit('request', requestParams);
    promise
      .then(response => emit('response', { request: requestParams, response }))
      .catch(err => emit('error', { request: requestParams, err }));
    return promise;
  }
}
