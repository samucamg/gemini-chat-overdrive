# Instalação e configuração local

1. Instale Node.js 22.12+, Git, cloudflared e uv (Serena).
2. Em mcp-bridge: npm ci, npm run setup e npm run setup:serena.
3. Edite .local/.env na raiz. PROJECT_DIRECTORY define o projeto Serena e a pasta inicial dos processos. ALLOWED_DIRECTORIES limita as pastas do Filesystem e usa ponto e vírgula como separador.
4. ENABLED_MCPS seleciona os serviços. Valores: devtools,filesystem,ssh,terminal,serena,context7,github. GitHub requer PAT; pode ser usado diretamente com OAuth sem habilitar a rota.
5. Execute npm start. Portas ocupadas geram erro; o runner não mata processos desconhecidos. Ctrl+C encerra somente seus próprios filhos.

O setup não sobrescreve .local/.env. Configuração legada em mcp-bridge/.env é copiada apenas se a privada ainda não existir. OVERDRIVE_ENV_FILE seleciona um perfil alternativo; variáveis já exportadas pelo processo têm prioridade.

Desktop Commander possui configuração própria no perfil do usuário, incluindo diretórios e telemetria. ALLOWED_DIRECTORIES é do Filesystem, não limita comandos de terminal. Serena é fixado em um commit no setup; dependências Node têm package-lock.json para npm ci. Não existe download npx de latest em cada início.

[Desktop Commander](https://github.com/wonderwhy-er/DesktopCommanderMCP) · [Serena](https://oraios.github.io/serena/02-usage/020_running.html)
