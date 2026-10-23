# Gemini Chat Overdrive

> Ponte MCP de alta performance para programar diretamente pela interface do **Google Gemini**, conectando o modelo ao seu ambiente Windows local, WSL2, ferramentas de desenvolvimento e instruções persistentes em Notebooks.

[English Version](README_EN.md) · [Notebook Pronto](templates/notebook-instrucoes.md) · [Guia de Conectores](docs/01-conectores-e-notebooks.md) · [Segurança](SECURITY.md)

---

## 🚀 O que é o Overdrive?

O **Gemini Chat Overdrive** transforma o chat web do Google Gemini em um ambiente de desenvolvimento completo. Sem depender de ferramentas pesadas de terceiros ou prompts gigantes que travam o contexto, ele expõe servidores MCP nativos, seguros e autenticados via Cloudflare Tunnel para a sua conta Gemini.

### 📦 Conectores Inclusos

| Conector | Rota | O que faz no Gemini |
|---|---|---|
| **Chrome DevTools** | `/mcp` | Inspeciona abas, console JavaScript, requisições de rede e tira screenshots |
| **Filesystem** | `/files` | Leitura e escrita direta nas pastas autorizadas do seu projeto |
| **SSH / WSL** | `/ssh` | Execução nativa de comandos no Linux WSL2 (`wsl_exec`) ou servidores remotos (`ssh_exec`) |
| **Desktop Commander** | `/terminal` | Terminal Windows (PowerShell/CMD), execução de builds, testes e servidores |
| **Serena** | `/serena` | Análise semântica de código por LSP (definições, referências, símbolos) |
| **Context7** | `/context7` | Busca documentação atualizada e oficial de bibliotecas em tempo real |
| **GitHub (Opcional)** | `/github` | Acesso a repositórios, PRs e issues via token pessoal |

---

## 🛠️ Instalação Passo a Passo (Windows)

### Pré-requisitos
* **Node.js** 22.12 ou superior
* **Git** para Windows
* **Cloudflare Tunnel** (`cloudflared`) instalado e no PATH (ou use o modo temporário automático)
* *(Opcional)* [uv](https://docs.astral.sh/uv/getting-started/installation/) caso queira utilizar o MCP semântico **Serena**
* *(Opcional)* Google Chrome com porta de depuração habilitada para o conector DevTools

---

### Passo 1: Instalação das dependências

Abra o PowerShell na pasta `mcp-bridge` e execute:

```powershell
cd mcp-bridge
npm ci
npm run setup
npm run setup:serena   # opcional se for usar Serena LSP
```

O comando `npm run setup` criará automaticamente o arquivo privado `.local/.env` com uma chave de autenticação criptográfica segura de 64 caracteres (`MCP_AUTH_TOKEN`).

---

### Passo 2: Configurar o seu projeto

Edite o arquivo `.local/.env`:
* `PROJECT_DIRECTORY`: Caminho absoluto do seu projeto principal (ex: `D:\Projetos\meu-app`).
* `ALLOWED_DIRECTORIES`: Pastas adicionais que o Gemini pode ler/editar, separadas por ponto-e-vírgula `;` (ex: `D:\Projetos;E:\Projetos`).
* `PUBLIC_HOSTNAME`: Se usar túnel Cloudflare nomeado (ex: `mcp.seudominio.com`). Se deixar vazio, o sistema inicia um túnel temporário `trycloudflare.com`.

---

### Passo 3: Iniciar a Ponte

Na pasta raiz do projeto, execute:

```powershell
windows-scripts\start-all.bat
```

*(Ou `npm start` dentro da pasta `mcp-bridge`)*.

---

### Passo 4: Obter as URLs dos Conectores

Com a ponte rodando, abra outro terminal na pasta `mcp-bridge` e execute:

```powershell
npm run connectors
```
*(Se estiver usando túnel temporário: `npm run connectors -- --origin=https://SEU-TUNEL.trycloudflare.com`)*.

Ele exibirá as URLs privadas de cada conector, contendo seu token de segurança:
```text
Chrome DevTools:   https://SEU-TUNEL/mcp?token=SEU_TOKEN
Filesystem:        https://SEU-TUNEL/files?token=SEU_TOKEN
SSH e WSL:         https://SEU-TUNEL/ssh?token=SEU_TOKEN
Desktop Commander: https://SEU-TUNEL/terminal?token=SEU_TOKEN
Serena:            https://SEU-TUNEL/serena?token=SEU_TOKEN
Context7:          https://SEU-TUNEL/context7?token=SEU_TOKEN
```

---

### Passo 5: Conectar ao Google Gemini

1. Acesse [gemini.google.com](https://gemini.google.com).
2. Vá em **Configurações → Apps conectados (Connected Apps) → Apps personalizados**.
3. Clique em **Adicionar app** e cole a URL privada de cada conector.
4. Defina um nome fácil para cada um (ex: `Gemini DevTools`, `Gemini Files`, `Gemini SSH/WSL`, `Gemini Terminal`).

---

## ⚡ Extensão Anti-Interrupção (Auto-Allow)

Por padrão, a interface web do Gemini pede confirmação manual ("Permitir" / "Negar") a cada comando shell ou leitura de arquivo. Para uma experiência contínua e sem cliques repetitivos:

1. No Chrome ou Edge, acesse `chrome://extensions`.
2. Ative a chave **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação** *(Load unpacked)*.
4. Selecione a pasta: `tools/gemini-auto-allow-extension`.
5. Recarregue a aba do Gemini. Um selo verde **`⚡ MCP Auto-Allow: ATIVO`** aparecerá no canto inferior.
*(Usuários do Tampermonkey podem usar alternativamente o script em `tools/gemini-mcp-auto-allow.user.js`)*.

---

## 👥 Como usar em Outras Contas do Gemini?

Você pode usar os mesmos conectores da sua máquina em **múltiplas contas do Gemini** (ex: conta pessoal, conta corporativa, conta de testes):

1. **A ponte roda uma única vez no seu PC:** O servidor local e o túnel Cloudflare já estão ativos e respondendo na nuvem.
2. **Na outra conta do Gemini:**
   * Faça login na outra conta em [gemini.google.com](https://gemini.google.com).
   * Vá em **Apps conectados → Apps personalizados**.
   * Cadastre os mesmos endpoints com token obtidos em `npm run connectors`.
3. **Instale a extensão Auto-Allow:** Instale a extensão `tools/gemini-auto-allow-extension` no perfil do navegador onde essa conta está conectada.
4. **Notebook de instruções:** Crie um Notebook chamado **Programação com Overdrive** nessa nova conta e cole o conteúdo de [templates/notebook-instrucoes.md](templates/notebook-instrucoes.md).

Ambas as contas agora têm acesso total e isolado às ferramentas do seu Windows.

---

## 📖 Como usar no Chat (O Notebook)

Para obter o melhor desempenho da IA:

1. Crie um Notebook no Gemini chamado **Programação com Overdrive**.
2. Copie o texto de [templates/notebook-instrucoes.md](templates/notebook-instrucoes.md) e salve como fonte do notebook.
3. Crie uma fonte com a ficha do seu projeto usando o modelo [templates/projeto.md](templates/projeto.md).
4. No início da conversa no Gemini, diga:
   > *"Use o notebook Programação com Overdrive para trabalhar neste projeto. Analise a estrutura antes de alterar arquivos."*
5. Descreva o que deseja construir ou depurar. O Gemini chamará as ferramentas necessárias automaticamente.

---

## 🩺 Verificação e Testes

Com a ponte rodando, você pode validar a integridade de todas as ferramentas com:

```powershell
npm run doctor   # Valida inicialização e listagem de ferramentas de cada MCP
npm run smoke    # Faz chamadas reais em cada conector para comprovar funcionamento
```

---

## 🔒 Segurança e Privacidade

* **Isolamento Total:** A pasta `.local/` contém seus tokens, histórico e configurações locais e **nunca** é versionada pelo Git.
* **Token Criptográfico:** Todas as chamadas pela internet exigem o token secreto no parâmetro `?token=...`. Requisições sem token válido recebem `401 Unauthorized`.
* **Escopo de Pastas:** O Filesystem rejeita qualquer acesso fora das pastas declaradas em `ALLOWED_DIRECTORIES`.
* **Exportação Limpa:** O comando `npm run release:pack` verifica os arquivos contra qualquer vazamento de credenciais antes de gerar pacotes públicos.

---

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). As dependências e servidores MCP mantêm suas respectivas licenças de código aberto.
