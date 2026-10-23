/** stdio MCPs -> authenticated Streamable HTTP -> optional Cloudflare tunnel. */
const { spawn, execFileSync } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { loadEnv, createConfig } = require('./config');
const { createProxy } = require('./proxy');
loadEnv();
const children = new Set();
let proxy;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (proxy) proxy.close();
  for (const child of children) {
    try {
      if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      else process.kill(-child.pid, 'SIGTERM');
    } catch { /* already exited */ }
  }
  process.exitCode = code;
}
function launch(command, args, config) {
  const child = spawn(command, args, { cwd: config.project, env: config.env, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  child.on('exit', code => {
    children.delete(child);
    if (!stopping) { console.error(`Um processo MCP/tunel encerrou (${code}). Corrija a configuracao e reinicie.`); stop(1); }
  });
  child.on('error', error => { console.error(`Falha ao iniciar ${path.basename(command)}: ${error.code || 'erro'}`); stop(1); });
  return child;
}
function assertPortFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error(`Porta ${port} ocupada. Feche a instancia anterior; nenhum processo sera encerrado automaticamente.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}
function waitPort(port, child) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 120000;
    function attempt() {
      if (stopping || child.exitCode !== null) return reject(new Error(`MCP da porta ${port} encerrou durante inicializacao.`));
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`MCP da porta ${port} nao ficou disponivel em 120s.`));
        else setTimeout(attempt, 250);
      });
    }
    attempt();
  });
}
function showEndpoints(config, origin) {
  console.log(`\nEndpoints (${origin}) - token oculto. Execute npm run connectors para copiar URLs privadas.`);
  for (const service of config.services) console.log(`  ${service.name}: ${origin}${service.route}`);
}
async function main() {
  const config = createConfig();
  const gateway = path.join(__dirname, 'node_modules', 'supergateway', 'dist', 'index.js');
  if (!fs.existsSync(gateway)) throw new Error('Dependencias ausentes. Execute npm ci em mcp-bridge.');
  for (const port of [config.proxyPort, ...config.services.filter(s => !s.remote).map(s => s.port)]) await assertPortFree(port);
  for (const service of config.services) {
    if (service.remote) { console.log(`${service.name}: remoto, verificar com healthcheck.`); continue; }
    for (const file of service.command.slice(0, 2)) {
      if (path.isAbsolute(file) && !fs.existsSync(file)) throw new Error(`Arquivo ausente para ${service.name}. Execute npm run setup.`);
    }
    // Structured command/args avoids shell expansion and quoting issues on Windows.
    const runtime = path.join(__dirname, '..', '.local', 'runtime');
    fs.mkdirSync(runtime, { recursive: true });
    const gatewayConfig = path.join(runtime, `${process.pid}-${service.id}.json`);
    fs.writeFileSync(gatewayConfig, JSON.stringify({
      host: '127.0.0.1', port: service.port, outputTransport: 'streamableHttp', streamableHttpPath: service.route,
      stateful: ['terminal', 'serena'].includes(service.id), sessionTimeout: 1800000,
      mcpServers: { [service.id]: { path: '/', command: service.command[0], args: service.command.slice(1), cwd: config.project } },
    }));
    const child = launch(process.execPath, [gateway, '--config', gatewayConfig], config);
    const log = data => {
      if (config.env.DEBUG_MCP === '1') {
        let line = data.toString();
        for (const secret of [config.token, config.env.CLOUDFLARE_TUNNEL_TOKEN, config.env.CONTEXT7_API_KEY, config.env.GITHUB_PERSONAL_ACCESS_TOKEN].filter(Boolean)) line = line.split(secret).join('[redacted]');
        process.stderr.write(`[${service.id}] ${line}`);
      }
    };
    child.stdout.on('data', log);
    child.stderr.on('data', log);
    await waitPort(service.port, child);
    console.log(`${service.name}: escutando em 127.0.0.1:${service.port}${service.route}`);
  }
  proxy = createProxy(config);
  await new Promise((resolve, reject) => { proxy.once('error', reject); proxy.listen(config.proxyPort, '127.0.0.1', resolve); });
  showEndpoints(config, `http://127.0.0.1:${config.proxyPort}`);
  if (config.env.NO_TUNNEL === '1') return;
  const exe = ['C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe'].find(fs.existsSync) || 'cloudflared';
  const args = config.env.CLOUDFLARE_TUNNEL_TOKEN
    ? ['tunnel', 'run', '--token', config.env.CLOUDFLARE_TUNNEL_TOKEN]
    : ['tunnel', '--url', `http://127.0.0.1:${config.proxyPort}`];
  const tunnel = launch(exe, args, config);
  let shown = false;
  const onData = data => {
    const line = data.toString();
    const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match && !shown) { shown = true; showEndpoints(config, match[0]); }
    if (!shown && config.env.PUBLIC_HOSTNAME && /Registered tunnel connection/i.test(line)) {
      shown = true; showEndpoints(config, `https://${config.env.PUBLIC_HOSTNAME}`);
    }
    if (/ERR|failed/i.test(line)) console.error('Cloudflare reportou um erro. Verifique instalacao, rede e credenciais do tunel.');
  };
  tunnel.stdout.on('data', onData);
  tunnel.stderr.on('data', onData);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
main().catch(error => { console.error(error.message); stop(1); });
