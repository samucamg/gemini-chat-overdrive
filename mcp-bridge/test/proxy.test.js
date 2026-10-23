const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { createConfig, loadEnv } = require('../config');
const { createProxy } = require('../proxy');
const token = 'test-only-token-not-a-real-secret-123';
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const close = server => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });

test('configuration rejects unknown services, missing GitHub credentials, bad token and collisions', () => {
  const env = { MCP_AUTH_TOKEN: token, PROJECT_DIRECTORY: path.join(__dirname, '..'), ENABLED_MCPS: 'filesystem' };
  assert.throws(() => createConfig({ ...env, ENABLED_MCPS: 'fake' }), /desconhecido/);
  assert.throws(() => createConfig({ ...env, ENABLED_MCPS: 'github' }), /GITHUB_PERSONAL_ACCESS_TOKEN/);
  assert.throws(() => createConfig({ ...env, MCP_AUTH_TOKEN: 'short' }), /24/);
  assert.throws(() => createConfig({ ...env, PROXY_PORT: '8016' }), /conflita/);
  assert.equal(createConfig(env).services[0].route, '/files');
});

test('env parsing preserves existing values and Windows paths', t => {
  const fs = require('node:fs');
  const os = require('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'overdrive-env-'));
  t.after(() => fs.rmSync(dir, { recursive: true }));
  const file = path.join(dir, '.env');
  fs.writeFileSync(file, 'PROJECT_DIRECTORY="D:\\Projetos\\my project"\nEXISTING=new\n# comment\n');
  const env = { EXISTING: 'old' };
  loadEnv(file, env);
  assert.equal(env.PROJECT_DIRECTORY, 'D:\\Projetos\\my project');
  assert.equal(env.EXISTING, 'old');
});

test('proxy requires auth on every request, matches exact routes and strips local credentials', async t => {
  const upstream = http.createServer((req, res) => {
    res.setHeader('mcp-session-id', 'example-session');
    res.end(JSON.stringify({ url: req.url, authorization: req.headers.authorization, session: req.headers['mcp-session-id'] }));
  });
  await listen(upstream);
  const proxy = createProxy({ token, services: [{ id: 'test', route: '/files', port: upstream.address().port }] });
  await listen(proxy);
  t.after(async () => { await close(proxy); await close(upstream); });
  const origin = `http://127.0.0.1:${proxy.address().port}`;
  assert.equal((await fetch(origin + '/files')).status, 401);
  const url = new URL('/files', origin); url.searchParams.set('token', token); url.searchParams.set('other', 'ok');
  const response = await fetch(url, { headers: { 'mcp-session-id': 'session-1' } });
  assert.equal(response.headers.get('mcp-session-id'), 'example-session');
  assert.deepEqual(await response.json(), { url: '/files?other=ok', session: 'session-1' });
  assert.equal((await fetch(origin + '/files')).status, 401);
  const headers = { Authorization: `Bearer ${token}` };
  assert.equal((await fetch(origin + '/files-extra', { headers })).status, 404);
  assert.equal((await fetch(origin + '/files', { headers })).status, 200);
  assert.equal((await fetch(origin + '/health', { headers })).status, 200);
});

test('proxy reports unavailable backend as 502', async t => {
  const probe = http.createServer(); await listen(probe); const port = probe.address().port; await close(probe);
  const proxy = createProxy({ token, services: [{ id: 'offline', route: '/offline', port }] });
  await listen(proxy); t.after(() => close(proxy));
  const result = await fetch(`http://127.0.0.1:${proxy.address().port}/offline`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(result.status, 502);
});

test('remote provider gets its own credential, never the bridge token', async t => {
  const provider = http.createServer((req, res) => res.end(JSON.stringify({ authorization: req.headers.authorization, url: req.url })));
  await listen(provider);
  const proxy = createProxy({ token, services: [{ id: 'provider', route: '/github', remote: `http://127.0.0.1:${provider.address().port}/mcp/`, headers: { Authorization: 'Bearer provider-test-credential' } }] });
  await listen(proxy);
  t.after(async () => { await close(proxy); await close(provider); });
  const result = await fetch(`http://127.0.0.1:${proxy.address().port}/github?token=${token}`);
  assert.deepEqual(await result.json(), { authorization: 'Bearer provider-test-credential', url: '/mcp/' });
});
