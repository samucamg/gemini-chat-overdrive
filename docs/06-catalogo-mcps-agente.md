# MCPs e autenticação

| Serviço | Instalação | Credencial externa |
|---|---|---|
| DevTools | npm ci | Chrome com depuração |
| Filesystem | npm ci | Nenhuma |
| SSH/WSL | npm ci + OpenSSH/WSL do sistema | Chaves e acesso do usuário |
| Desktop Commander | npm ci | Nenhuma API de modelo |
| Serena | npm run setup:serena | Nenhuma para LSP; language server depende da linguagem |
| Context7 | npm ci | CONTEXT7_API_KEY opcional conforme acesso/limites do serviço |
| GitHub | Proxy HTTPS opcional | GITHUB_PERSONAL_ACCESS_TOKEN |

O GitHub pode ser conectado diretamente a https://api.githubcopilot.com/mcp/ com OAuth se o cliente aceitar. Context7 também oferece https://mcp.context7.com/mcp/oauth. Essas alternativas não passam pela ponte local e possuem termos/limites próprios.

Git local já pode ser usado pelo terminal. Playwright, bancos, Docker e outros conectores entram quando resolverem uma necessidade concreta; não são instalados por este pacote. O depurador JetBrains pago não faz parte da configuração Serena LSP.

Fontes: [Desktop Commander](https://github.com/wonderwhy-er/DesktopCommanderMCP), [Serena](https://github.com/oraios/serena), [Context7](https://github.com/upstash/context7), [GitHub MCP](https://github.com/github/github-mcp-server).
