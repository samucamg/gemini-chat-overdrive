const fs = require('node:fs');
const path = require('node:path');

function loadEnv(file = process.env.OVERDRIVE_ENV_FILE || (fs.existsSync(path.join(__dirname, '..', '.local', '.env')) ? path.join(__dirname, '..', '.local', '.env') : path.join(__dirname, '.env')), env = process.env) {
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return env;
}

function createConfig(env = process.env) {
  const project = path.resolve(env.PROJECT_DIRECTORY || path.join(__dirname, '..'));
  if (!fs.statSync(project).isDirectory()) throw new Error('PROJECT_DIRECTORY deve ser uma pasta existente.');
  const enabled = (env.ENABLED_MCPS || 'devtools,filesystem,ssh,terminal,serena,context7').split(',').map(s => s.trim()).filter(Boolean);
  const base = Number(env.MCP_BASE_PORT || 8016);
  const proxyPort = Number(env.PROXY_PORT || 8006);
  if (![base, proxyPort].every(p => Number.isInteger(p) && p > 0 && p < 65529)) throw new Error('Porta inválida.');
  const token = env.MCP_AUTH_TOKEN || '';
  if (token.length < 24 || /gere_um|change_me|seu_token/i.test(token)) throw new Error('MCP_AUTH_TOKEN precisa ter 24 caracteres aleatórios ou mais. Execute npm run setup.');
  const node = (...args) => [process.execPath, ...args];
  const mod = (...parts) => path.join(__dirname, 'node_modules', ...parts);
  const dirs = (env.ALLOWED_DIRECTORIES || project).split(';').map(s => s.trim()).filter(Boolean);
  for (const dir of dirs) if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error(`Pasta autorizada inexistente: ${dir}`);
  const chromePort = Number(env.CHROME_PORT || 9222);
  const definitions = [
    { id: 'devtools', name: 'Chrome DevTools', route: '/mcp', command: node(mod('chrome-devtools-mcp', 'build', 'src', 'bin', 'chrome-devtools-mcp.js'), `--browserUrl=http://127.0.0.1:${chromePort}`) },
    { id: 'filesystem', name: 'Filesystem', route: '/files', command: node(mod('@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js'), ...dirs) },
    { id: 'ssh', name: 'SSH e WSL', route: '/ssh', command: node(path.join(__dirname, 'ssh-server.mjs')) },
    { id: 'terminal', name: 'Desktop Commander', route: '/terminal', command: node(mod('@wonderwhy-er', 'desktop-commander', 'dist', 'index.js')) },
    { id: 'serena', name: 'Serena', route: '/serena', command: [env.SERENA_COMMAND || 'serena', 'start-mcp-server', '--context', 'agent', '--agent-interface', 'tools', '--language-backend', 'LSP', '--project', project, '--enable-web-dashboard', 'false', '--open-web-dashboard', 'false'] },
    { id: 'context7', name: 'Context7', route: '/context7', command: node(mod('@upstash', 'context7-mcp', 'dist', 'index.js')) },
    { id: 'github', name: 'GitHub', route: '/github', remote: 'https://api.githubcopilot.com/mcp/', headers: { Authorization: `Bearer ${env.GITHUB_PERSONAL_ACCESS_TOKEN || ''}` } },
    { id: 'playwright', name: 'Playwright', route: '/playwright', command: node(mod('@playwright', 'mcp', 'cli.js'), '--headless') },
  ];
  for (const id of enabled) if (!definitions.some(d => d.id === id)) throw new Error(`MCP desconhecido: ${id}`);
  if (enabled.includes('github') && !env.GITHUB_PERSONAL_ACCESS_TOKEN) throw new Error('Defina GITHUB_PERSONAL_ACCESS_TOKEN para github; ou use OAuth direto no Gemini.');
  const services = definitions.filter(d => enabled.includes(d.id)).map((d, i) => ({ ...d, port: base + i }));
  if (!services.length || new Set(enabled).size !== enabled.length) throw new Error('Selecione MCPs sem repetições.');
  if (services.some(s => s.port === proxyPort)) throw new Error('Porta do proxy conflita com MCP.');
  return { project, enabled, token, proxyPort, services, chromePort, env };
}
module.exports = { loadEnv, createConfig };
