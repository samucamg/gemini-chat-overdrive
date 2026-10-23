const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { loadEnv } = require('./config');
const root = path.join(__dirname, '..');
const local = path.join(root, '.local');
fs.mkdirSync(local, { recursive: true });
const target = path.join(local, '.env');
const legacy = path.join(__dirname, '.env');
if (!fs.existsSync(target)) {
  if (fs.existsSync(legacy)) {
    fs.copyFileSync(legacy, target);
    console.log('Configuracao existente copiada para .local/.env, sem alterar credenciais.');
  } else {
    const example = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
    fs.writeFileSync(target, example.replace('GENERATE_WITH_SETUP', randomBytes(32).toString('hex'))
      .replaceAll('D:\\Projetos\\meu-projeto', root));
    console.log('Configuracao privada criada em .local/.env com token aleatorio.');
  }
}
loadEnv(target);
if (process.argv.includes('--serena')) {
  execFileSync('uv', ['tool', 'install', '--from', 'git+https://github.com/oraios/serena@d9e4c796fae0207ba6848d1df4b331122a5567b5', 'serena-agent'], { stdio: 'inherit', windowsHide: true });
}
console.log('Edite .local/.env para selecionar projeto e MCPs. O setup nao sobrescreve configuracao existente.');
