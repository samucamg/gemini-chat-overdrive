# Proxy e credenciais

O proxy escuta em loopback e exige token a cada requisição, inclusive de sessões existentes. Aceita Authorization: Bearer ou token na query string para clientes que exigem URL. O token da ponte é removido antes do encaminhamento. A rota GitHub injeta somente a credencial GitHub configurada localmente.

npm run connectors imprime URLs completas para cadastro manual. Trate essa saída como uma senha. O runner e o healthcheck não imprimem tokens. DEBUG_MCP=1 é diagnóstico local e pode revelar conteúdo de arquivos/ferramentas, embora as credenciais de ambiente conhecidas sejam ocultadas.

A rota /health autenticada lista os serviços configurados; não afirma que os provedores estão saudáveis. npm run doctor verifica o protocolo e npm run smoke verifica chamadas reais.

Cloudflare Access com login interativo ou cabeçalhos próprios só funciona quando o cliente suporta esse fluxo. Um túnel HTTPS por si só não autentica acesso às ferramentas. Veja SECURITY.md.
