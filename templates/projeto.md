# Ficha de Operação do Projeto

> Copie este modelo, preencha com os dados do seu projeto e adicione como fonte ou nota no seu Gemini Notebook.

## 1. Localização e Ambiente
- Nome do projeto: Meu Projeto
- Objetivo principal: Descrição breve do sistema
- Pasta raiz (Windows): D:\Projetos\meu-projeto
- Pasta raiz (WSL2 Linux, se aplicável): /mnt/d/Projetos/meu-projeto
- Pasta de tarefas ou documentação: D:\Projetos\meu-projeto\docs
- Stack / Linguagens: Python, Node.js, TypeScript, etc.
- URL e porta de desenvolvimento: http://localhost:3000

---

## 2. Matriz de Uso das Ferramentas no Projeto:

| Objetivo da Ação | Ferramenta a Usar | Como proceder |
|---|---|---|
| **Ler e salvar arquivos** | `Filesystem` | Use sempre para ler schemas, documentação e salvar códigos locais. |
| **Entender o código** | `Serena` | Priorize antes de alterar funções ou classes para localizar definições e chamadores. |
| **Rodar scripts e testes** | `SSH/WSL` | Execute scripts, testes automatizados e builds no Linux WSL2 (`wsl_exec`). |
| **Terminal Windows** | `Desktop Commander` | Use para comandos nativos do PowerShell/CMD e processos em segundo plano. |
| **Testar telas e páginas web** | `Playwright` | Abra o navegador autônomo para testar URLs locais, cliques, formulários e tirar screenshots. |
| **Depurar Chrome aberto** | `Chrome DevTools` | Inspecione abas existentes do Chrome, console JavaScript e rede. |
| **Documentação de bibliotecas** | `Context7` | Consulte a documentação oficial atualizada de pacotes externos antes de codificar. |
| **Versionamento e PRs** | `GitHub` | Crie branches, abra Pull Requests e acompanhe status de CI/CD. |

---

## 3. Comandos Úteis do Projeto
- Instalar dependências: `npm install` ou `pip install -r requirements.txt`
- Iniciar servidor dev: `npm run dev`
- Executar testes: `npm test` ou `pytest`

---

## 4. Regras de Execução
1. **Trabalhe em lote:** Nunca faça chamadas fragmentadas de terminal para inspecionar arquivos individuais. Leia múltiplos arquivos pelo Filesystem ou execute um único script consolidado.
2. **Pesquise antes de implementar:** Se for usar uma função de biblioteca externa, consulte a API oficial no `Context7`.
3. **Validação contínua:** Após alterar código, execute os testes ou valide a interface via `Playwright`.
4. **Segurança:** Nunca exiba ou salve credenciais, tokens ou senhas no chat ou em arquivos públicos.
