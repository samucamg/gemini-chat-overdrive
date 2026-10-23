# Túnel Cloudflare

Instale cloudflared pelo método oficial para seu sistema. O runner usa túnel temporário quando CLOUDFLARE_TUNNEL_TOKEN está vazio. Para um túnel nomeado, configure esse token e PUBLIC_HOSTNAME em .local/.env; no painel Cloudflare, use como serviço de origem http://127.0.0.1:8006 (ou sua PROXY_PORT).

Não encaminhe diretamente às portas internas dos MCPs: o proxy é quem verifica a autenticação. Túnel temporário muda de endereço a cada inicialização e pode sofrer limitações de streaming/serviço; prefira um nomeado para uso contínuo.

O domínio e as credenciais de cada pessoa ficam na configuração privada. Nenhum deles faz parte da distribuição.

[Instalação oficial](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
