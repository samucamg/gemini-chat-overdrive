# Notebook e conectores

## Preparar uma vez

1. Crie um Notebook chamado Programação com Overdrive.
2. Cole templates/notebook-instrucoes.md nas instruções do Notebook, se sua interface oferecer esse campo; você também pode adicionar o texto como fonte.
3. Preencha templates/projeto.md com dados do projeto e adicione como fonte. Guarde sua cópia em .local/notebook/.
4. Adicione os apps personalizados usando as URLs privadas de npm run connectors. Cada serviço possui uma rota própria.

## A cada conversa

Peça: “Use o notebook Programação com Overdrive. Leia a configuração do projeto antes de agir.” Depois descreva a tarefa. Se necessário, selecione o app pelo @.

O mantenedor confirmou esse fluxo na sua conta. Não é necessário criar uma Skill. O Notebook fornece contexto e orientações; a execução ocorre nos apps conectados. Importar um Notebook não instala ferramentas nem concede acesso ao computador.

## Confirmar a integração

Peça para ler o package.json pelo Filesystem; depois executar um cálculo pelo terminal e consultar os símbolos de um arquivo pelo Serena. Uma resposta textual sem chamada de ferramenta não comprova acesso.

Fontes: [Notebooks no Gemini](https://support.google.com/gemini/answer/16972047), [apps personalizados](https://support.google.com/gemini/answer/17209137). Disponibilidade pode variar.
