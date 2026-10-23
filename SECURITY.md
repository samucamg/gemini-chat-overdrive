# Segurança e dados locais

.local/ e arquivos .env são privados e ignorados pelo Git. O exportador usa lista explícita, verifica credenciais conhecidas e não inclui o histórico Git. Isso reduz erros de empacotamento; ainda revise o pacote antes de publicar. Se uma credencial já apareceu em conversa, commit ou captura pública, substitua-a no provedor e recadastre os conectores afetados.

Terminal, SSH, WSL, Serena e DevTools executam com os privilégios da conta e podem alterar o ambiente. Diretórios permitidos do Filesystem não são uma sandbox para os outros serviços. A autenticação da ponte concede acesso às ferramentas habilitadas; use apenas com seu próprio cliente e não compartilhe URLs autenticadas.

Não adicione diretórios de chaves ao Filesystem de uma configuração distribuída. O SSH deve usar a chave local sem enviar seu conteúdo ao chat. Desktop Commander guarda preferências e telemetria no perfil do usuário; revise as configurações do projeto upstream.

Antes de publicar, rode npm test, npm run release:check e npm audit. Há dependências transitivas; consulte o resultado atual do audit. Não use npm audit fix --force sem revisar as mudanças. A versão deste pacote fixa overrides para SDK MCP, chokidar e uuid; ferramentas PDF do Desktop Commander ainda podem trazer avisos transitivos moderados. Esses componentes não foram removidos para preservar a funcionalidade upstream.

Para relatar uma vulnerabilidade, use o canal privado de segurança do repositório, se habilitado. Nunca coloque tokens em uma issue pública.
