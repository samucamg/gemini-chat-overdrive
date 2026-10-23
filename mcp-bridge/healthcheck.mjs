import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { loadEnv, createConfig } = require('./config.js');
loadEnv();
const config = createConfig();
const arg = process.argv.find(a => a.startsWith('--origin='));
const origin = arg ? arg.slice(9) : `http://127.0.0.1:${config.proxyPort}`;
if (new URL(origin).protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('HTTP permitido somente para loopback.');
let failed = false;
for (const service of config.services) {
  const client = new Client({ name: 'overdrive-healthcheck', version: '2.0.0' });
  try {
    const transport = new StreamableHTTPClientTransport(new URL(service.route, origin), { requestInit: { headers: { Authorization: `Bearer ${config.token}` } } });
    await client.connect(transport, { timeout: 120000 });
    const listed = await client.listTools(undefined, { timeout: 120000 });
    if (!listed.tools.length) throw new Error('Nenhuma ferramenta encontrada');
    let cursor = listed.nextCursor;
    while (cursor) { const page = await client.listTools({ cursor }); listed.tools.push(...page.tools); cursor = page.nextCursor; }
    console.log(`${service.id}: initialize + tools/list OK (${listed.tools.length} ferramentas)`);
    if (process.argv.includes('--smoke')) {
      const calls = {
        filesystem: ['list_allowed_directories', {}],
        devtools: ['list_pages', {}],
        ssh: ['ssh_list_available_keys', {}],
        terminal: ['start_process', { command: 'node -e "console.log(6*7)"', timeout_ms: 10000 }],
        serena: ['get_current_config', {}],
        context7: ['resolve-library-id', { libraryName: 'node', query: 'Node.js fs readFile documentation' }],
        github: ['get_me', {}],
      };
      const [name, args] = calls[service.id];
      if (!listed.tools.some(t => t.name === name)) throw new Error(`Ferramenta de smoke indisponivel: ${name}`);
      const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 120000 });
      if (result.isError) throw new Error('A ferramenta retornou isError');
      const content = (result.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
      if (service.id === 'terminal' && !content.includes('42')) throw new Error('Terminal nao retornou 42');
      // Some providers put authentication failures in text instead of isError.
      if (service.id === 'context7' && /invalid api key|unauthorized|rate limit|authentication required|API key is required/i.test(content)) throw new Error('Context7 requer credencial valida ou atingiu limite');
      console.log(`${service.id}: tools/call ${name} OK (conteudo privado omitido)`);
      if (service.id === 'terminal') {
        const started = await client.callTool({ name: 'start_process', arguments: { command: 'node -e "console.log(\'OVERDRIVE_READY\');setTimeout(()=>console.log(\'OVERDRIVE_DONE\'),2000)"', timeout_ms: 100 } });
        const text = started.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
        const pid = text.match(/PID:?\s+(\d+)/i)?.[1];
        if (!pid) throw new Error('Terminal nao retornou identificador de processo');
        let completed = false;
        for (let attempt = 0; attempt < 4; attempt++) {
          const polled = await client.callTool({ name: 'read_process_output', arguments: { pid: Number(pid), timeout_ms: 10000 } });
          if (polled.isError) throw new Error('Falha ao acompanhar processo');
          if (JSON.stringify(polled.content).includes('OVERDRIVE_DONE')) { completed = true; break; }
        }
        if (!completed) throw new Error('Processo nao persistiu entre chamadas');
        console.log('terminal: acompanhamento de processo em chamada posterior OK');
      }
    }
  } catch (error) {
    failed = true;
    // Transport errors may embed request URLs: never print raw errors/credentials.
    console.error(`${service.id}: FALHOU (${error.code || error.name || 'erro'}). Verifique credenciais, dependencias e processo.`);
  } finally { await client.close().catch(() => {}); }
}
if (failed) process.exitCode = 1;
