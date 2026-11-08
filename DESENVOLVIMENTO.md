# Registro de desenvolvimento com IA

Neste arquivo, será registrado a metodologia com o uso da IA (Codex) neste desafio, o foco é informar como utilizei e por que utilizei de tal maneira

## Organização e execução de trabalho

### Organização inicial - Preparação de uso de agentes de IA e bootstrap inicial do projeto

De começo, tive foco em definir os `Agents.md` e nisso inclui

- Regras e restrições (tanto gerais, quanto especificos de cada tópico)
- Padronização de código
- definição da arquitetura dos projetos
- definições de stacks

Os beneficios de realizar este passo inicial são de permitir padronizar o codigo e o projeto desde a criação dele, realizando o uso da IA de maneira correta e padronizada, com isso, iniciei a instalação de libs iniciais e preparação da base do projeto.

### Oganização no processo - uso de IA para organização de etapas do desenvolvimento

Com a junção do uso de IA no desenvolvimento e o plugin do Notion, foi criado uma base de divisão de tarefas e implementação, afim de esquematizar e organizar o passo a passo do desenvolvimento de uma visão mais geral. Usei o Notion simulando um Jira, no qual tinha as issues separas ja escrita em forma de spec, então a história seguia um padrão estrutural de

1. Cenário atual: Falando o atual momento do desenvolvimento, abordando cenário do problema a ser resolvido
2. Necessidade: apresentaçao do problema a ser resolvido de maneira direta.
3. Regras de negócio: Falar sobre restrições envolvendo fluxo do produto
4. Notas técnicas: Centralização da parte técnica da solução, falando mais sobre código e não de produto em si
5. Critério de aceite: quality gates

E no notion foi criado uma base dados, em formato de tabela, no qual possuia o titulo de cada tarefa, mais o status dela, separada por: Pendente, em andamento, concluido

### Em quais etapas a IA ajudou - Uso de Spec driven + skill propria

O Codex ajudou a consolidar a spec do Notion, escrever os testes antes do comportamento, implementar as telas e verificar a aplicação. Exemplos de orientações aproveitadas foram usar a skill `danilosiq-spec-driven` (descrição da spec em `/docs`), manter os mocks isolados, usar Jest com arquivos `.spec.ts`, permitir cadastro após falha de leitura e adotar azul-marinho em tema claro.

As instruções e respostas foram incorporadas ao escopo do card; a integração com backend e SQL Server permaneceu fora desta entrega. As sugestões do PDF nessa etapa eram dados fictícios. O modelo utilizado do codex foi o 6.1 Sol (médio)

#### Exemplo prático a onde ela ajudou

O uso de IA ajudou para varios casos, um exemplo prático foi a consolidação do estilo do front com wireframes introduzidos por mim, voce pode conferir o wireframe feito no Excalidraw em `/docs`

- Minha mensagem

```
(Anexo)
realizei um wireframe sobre as telas, com algumas anotaçoes

reproduza, mantendo o mesmo estilo, as cores verdes nos cards, e vermelho no footer é para te informar sobre o componente, laranja tambem

entao as cores nao importam nesse wireframe

detalhe, faça teste para front, com playwrite, coloque no agents.md como requisito basico de teste de regressão

tambem, use o react hook form + zod em formulários, coloque nas stacks do front

faça para celular tambem

dialogs, viram bottomSheets
```

- Resposta obtida

```markdown
Implementado em localhost:3000, seguindo o wireframe e mantendo azul-marinho com tema claro.

- Lista/cards, perfil e edição com Desfazer/Concluir.
- Layout responsivo e dialogs como bottom sheets no celular.
- Formulários com React Hook Form + Zod.
- [AGENTS.md](/Users/daniloosiq/.codex/worktrees/frontend-mocks/desafioCIEE/frontend/AGENTS.md) atualizado com essas regras e regressão obrigatória com Playwright.
  Validação: 40 testes + 12 E2E aprovados; TypeScript e build passaram. Continua com mocks.
```

## Tomada de decisões técnicas e seus motivos

### Leitura de currículos em PDF - uso de rejex + heurísticas

Para a identificação dos dados presentes nos currículos, optei por uma abordagem determinística, utilizando expressões regulares (Regex) e heurísticas, sem a necessidade de modelos de inteligência artificial generativa.

A decisão foi baseada nos requisitos do desafio, que solicitam a identificação de apenas três informações: nome completo, e-mail e telefone. Consideranco esse escopo e pelo critério de facilidade de inicialização do projeto, a utilização de um modelo de IA adicionaria custos, dependências externas e complexidade operacional que não se justificariam inicialmente.

A solução foi estruturada em etapas:

1. **Validação do arquivo**: o backend verifica o formato, o conteúdo e o limite de 5 MB antes de processar o PDF.

2. **Extração de texto**: utilização da biblioteca `pdf-parse` para obter o conteúdo textual do documento.

3. **Identificação dos campos**: utilização de Regex para reconhecer padrões de e-mail e telefone (como o uso do "@" e numeros sequenciados em um padrão de telefone), enquanto o nome é identificado por heurísticas que consideram características como posicionamento, estrutura e contexto do texto.

4. **Revisão dos dados**: os valores identificados são utilizados como sugestões para preencher o formulário, permitindo que o usuário os corrija ou complemente antes de salvar.

A separação entre extração e identificação dos campos também permite testar cada responsabilidade de forma independente, facilitando a manutenção e a evolução da solução.

#### Limitações e tratamento de falhas

A abordagem não garante a identificação de todos os campos, principalmente em currículos com estruturas pouco convencionais. PDFs digitalizados, sem texto selecionável, também não são contemplados pela extração convencional.

Para lidar com essas situações, informações ausentes ou ambíguas são retornadas como null, evitando o preenchimento com dados não confiáveis. Falhas na leitura não impedem o cadastro manual.

Essa decisão priorizou simplicidade arquitetural, previsibilidade, testabilidade e facilidade de manutenção, mantendo a possibilidade de incorporar OCR ou modelos de interpretação semântica futuramente, caso a necessidade seja comprovada.

## O que precisou corrigir, adaptar ou descartar

Inicialmente, a ideia com a leitura de PDFs seguiria com o uso de IA + ollama, para poder interpretar imagens e extrair informações, seguindo o seguinte fluxo:

1. Front enviando PDF com menos de 5 MB
2. Backend recebe
3. Backend tranforma PDF em imagem
4. Backend com Ollama, utilizando o qwen2.5vl:7b com um prompt hardcoded para ler essas imagens extraidas.
5. qwen2.5vl:7b retorna interpretação dos dados como JSON.
6. JSON resultante retornando para o FRONT

A ideia inicial surgiu como uma alternativa ao `Mistral OCR | Mistral AI`, ferramenta que utiliza inteligência artificial para ler documentos, interpretar suas informações e extrair dados relevantes. Entretanto, sua utilização exigia uma chave de API privada e o cadastro de um cartão de crédito na plataforma.

Como alternativa, considerei utilizar o `Ollama` para executar modelos de IA localmente. Porém, essa abordagem foi descartada devido à complexidade adicional para configurar o projeto em diferentes ambientes, pois exigiria a instalação do Ollama (`brew install ollama` no macOS ou `sudo apt install ollama` no Ubuntu). Outra possibilidade seria disponibilizar um container Docker com o ambiente pré-configurado, mas isso aumentaria significativamente o tamanho e o consumo de recursos da aplicação. Esses fatores comprometeriam um dos critérios de avaliação do desafio: **"Facilidade para configurar e executar o projeto."**

diante desses fatos, optei pelo uso de parse de documentos + Regex e heurísticas

## Como verifiquei se a solução estava correta

A solução foi validada por meio de testes práticos, executando a aplicação em diferentes computadores para verificar sua compatibilidade e facilidade de configuração. Além disso, utilizei testes automatizados (unitários, de regressão e E2E) e contei com o auxílio da IA, integrada ao Playwright, para navegar pela aplicação e validar diferentes fluxos, incluindo cenários de sucesso e de erro.

Em testes, foram:

- 81 testes do backend
- 25 testes de integração com SQL Server
- 75 testes do frontend, em 14 suítes
- 32 testes E2E de navegador
- 213 testes aprovados ao todo

## Tempo aproximado dedicado ao desafio

O tempo total dedicado ao desafio foi de aproximadamente **10 horas**. Iniciei o desenvolvimento na sexta-feira à noite, estruturando os arquivos `AGENTS.md` e organizando as atividades no Notion. No sábado (07/11), implementei e avaliei a primeira abordagem, utilizando Ollama e Qwen. Após identificar limitações nessa solução, dediquei parte do domingo (08/11) à revisão da arquitetura, à implementação de uma alternativa mais adequada aos requisitos e à correção de problemas identificados.

## Dificuldades, limitações e melhorias futuras

### Dificuldades

A principal dificuldade do desafio foi definir a abordagem mais adequada para a leitura e interpretação de currículos em PDF. Embora já tivesse experiência com soluções baseadas em IA, como o Mistral OCR, percebi que, para o escopo proposto, uma solução mais simples e determinística seria suficiente.

Essa decisão exigiu avaliar _trade-offs_ entre precisão, complexidade, custos e facilidade de execução, priorizando uma arquitetura que atendesse aos requisitos sem adicionar dependências desnecessárias.

### Limitações

Uma das limitações foi a impossibilidade de validar o comportamento da aplicação em um ambiente real de produção, especialmente em cenários de alta concorrência e múltiplas requisições simultâneas.

Além disso, a extração de dados por Regex e heurísticas possui limitações em documentos com estruturas pouco convencionais e PDFs digitalizados sem texto selecionável. Nesses casos, o sistema permite que o usuário preencha as informações manualmente.

### Melhorias futuras

Com mais tempo, consideraria as seguintes evoluções:

- **Importação em lote:** permitir o envio de múltiplos currículos, com identificação de candidatos e suas respectivas áreas de atuação.
- **Ações em lote:** possibilitar exclusão, atualização e alteração de áreas de interesse de múltiplos candidatos.
- **Autenticação e autorização:** implementar cadastro de usuários, gerenciamento de sessões e controle de acesso baseado em permissões.
- **Interpretação com IA:** incorporar modelos de IA para melhorar a identificação semântica das informações e reduzir as limitações das heurísticas.
- **Testes de carga:** avaliar o desempenho da aplicação sob diferentes níveis de concorrência, identificando possíveis gargalos e oportunidades de otimização.
