/** Export a clean, source-only distribution; never include the working checkout/history. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'configs', 'release-manifest.json'), 'utf8'));
const files = manifest.files;
const secrets = [];
const personalIdentifiers = [];
for (const file of [path.join(root, '.local', '.env'), path.join(__dirname, '.env')]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*)=(.+)$/);
    if (m && m[2].length >= 12) secrets.push(m[2].replace(/^["']|["']$/g, ''));
    const personal = line.match(/^(?:PUBLIC_HOSTNAME|DEFAULT_SSH_HOST)=(.+)$/);
    if (personal && personal[1].length >= 6) personalIdentifiers.push(personal[1].replace(/^["']|["']$/g, ''));
  }
}
const checked = [];
for (const relative of files) {
  const full = path.resolve(root, relative);
  if (!full.startsWith(root + path.sep) || /(?:^|\/)(?:\.local|\.git|node_modules|reports|research_notes)(?:\/|$)/.test(relative) || /(?:^|\/)\.env$/.test(relative)) throw new Error(`Arquivo privado/proibido no manifesto: ${relative}`);
  const data = fs.readFileSync(full);
  const text = data.toString('utf8');
  if (secrets.some(secret => text.includes(secret))) throw new Error(`Credencial local encontrada em ${relative}`);
  if (/-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----/.test(text) || /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/.test(text)) throw new Error(`Possivel chave privada em ${relative}`);
  if (personalIdentifiers.some(value => text.includes(value))) throw new Error(`Dado do ambiente pessoal em ${relative}`);
  checked.push({ path: relative, sha256: crypto.createHash('sha256').update(data).digest('hex') });
}
console.log(`${checked.length} arquivos publicos verificados; configuracao local, historico Git e pesquisas excluidos.`);
if (!process.argv.includes('--check')) {
  const output = path.join(root, 'release', `gemini-chat-overdrive-${Date.now()}`);
  fs.mkdirSync(output, { recursive: true });
  for (const file of files) {
    const dest = path.join(output, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, file), dest);
  }
  fs.writeFileSync(path.join(output, 'CHECKSUMS.json'), JSON.stringify(checked, null, 2) + '\n');
  if (process.platform === 'win32') {
    const literal = value => "'" + value.replaceAll("'", "''") + "'";
    const command = `$ProgressPreference = 'SilentlyContinue'; Compress-Archive -LiteralPath ${literal(output)} -DestinationPath ${literal(output + '.zip')} -ErrorAction Stop`;
    execFileSync('powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { windowsHide: true });
  }
  console.log(`Distribuicao limpa: ${output}`);
}
