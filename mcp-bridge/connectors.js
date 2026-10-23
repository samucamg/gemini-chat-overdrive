const { loadEnv, createConfig } = require('./config');
loadEnv();
const config = createConfig();
const arg = process.argv.find(a => a.startsWith('--origin='));
const origin = arg ? arg.slice(9) : config.env.PUBLIC_HOSTNAME ? `https://${config.env.PUBLIC_HOSTNAME}` : '';
if (!origin) throw new Error('Defina PUBLIC_HOSTNAME ou passe --origin=https://seu-tunel.trycloudflare.com');
const parsed = new URL(origin);
if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Use uma origem HTTPS sem credenciais.');
console.log('URLs PRIVADAS: nao publique nem compartilhe este resultado.');
for (const service of config.services) {
  const url = new URL(service.route, parsed.origin);
  url.searchParams.set('token', config.token);
  console.log(`${service.name}\n${url.href}\n`);
}
