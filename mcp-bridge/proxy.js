const http = require('node:http');
const https = require('node:https');
const { timingSafeEqual } = require('node:crypto');
function equalToken(value, expected) {
  const a = Buffer.from(value || '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
function createProxy(config) {
  return http.createServer((req, res) => {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); return res.end(); }
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const json = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    if (!equalToken(url.searchParams.get('token'), config.token) && !equalToken(bearer, config.token)) return json(401, { error: 'unauthorized' });
    if (url.pathname === '/health') return json(200, { services: config.services.map(s => ({ id: s.id, path: s.route })) });
    const service = config.services.find(s => s.route === url.pathname);
    if (!service) return json(404, { error: 'unknown endpoint' });
    url.searchParams.delete('token');
    const target = service.remote ? new URL(service.remote) : new URL(`http://127.0.0.1:${service.port}${service.route}`);
    target.search = url.search;
    const headers = { ...req.headers, host: target.host };
    for (const key of ['authorization', 'connection', 'proxy-authorization', 'forwarded', 'x-forwarded-host', 'x-forwarded-proto']) delete headers[key];
    Object.assign(headers, service.headers || {});
    const upstream = (target.protocol === 'https:' ? https : http).request(target, { method: req.method, headers }, up => {
      const responseHeaders = { ...up.headers };
      delete responseHeaders.connection;
      res.writeHead(up.statusCode, responseHeaders);
      up.on('error', () => res.destroy());
      up.pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) json(502, { error: 'upstream unavailable', service: service.id });
      else res.destroy();
    });
    upstream.setTimeout(300000, () => upstream.destroy());
    req.on('aborted', () => upstream.destroy());
    res.on('close', () => { if (!res.writableFinished) upstream.destroy(); });
    req.pipe(upstream);
  });
}
module.exports = { createProxy };
