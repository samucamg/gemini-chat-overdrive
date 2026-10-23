# Contribuir

Use Node.js 22.12+ e npm ci em mcp-bridge. Guarde toda configuração pessoal em .local/.env. Execute npm test e npm run release:check antes de abrir um PR. Para alterações em transportes, rode doctor e smoke com um perfil de teste e portas separadas; registre quais chamadas foram comprovadas.

Novos MCPs devem ter origem verificável, versão fixada, configuração genérica, documentação de autenticação e chamada real de aceite. Adicione os arquivos públicos ao configs/release-manifest.json. Não registre tokens, endereços privados, conteúdo de ferramentas ou resultados de pesquisa locais no Git.
