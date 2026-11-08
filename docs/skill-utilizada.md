Conduzir a tarefa da especificação até as evidências de aceite. A spec define o comportamento esperado; o código e os testes devem atendê-la. Respeitar os AGENTS.md, a arquitetura, as ferramentas e os contratos do projeto, sem impor uma stack própria.

1. Receber e consolidar a spec
   Organizar o material fornecido nestas seções, preservando requisitos e decisões do usuário:

- Cenário atual: comportamento existente, contexto e problema observado.
- Necessidade: mudança desejada, resultado e limites de escopo.
- Regras de negócio: condições, restrições e exceções que determinam o comportamento.
- Notas técnicas: integrações, contratos e restrições técnicas, somente quando necessárias.
- Critérios de aceite: resultados observáveis e verificáveis que definem a conclusão.
  Reutilizar a especificação e o local de documentação existentes. Para uma tarefa pequena, a spec consolidada pode permanecer no chat; manter um arquivo no padrão do repositório quando a complexidade exigir acompanhamento durável. Não criar uma estrutura de documentação ou templates sem necessidade.

Ler o código afetado e os testes existentes para conferir o cenário atual. Distinguir fatos observados, requisitos fornecidos e hipóteses. Não transformar exemplos em funcionalidades nem inventar comportamento para preencher lacunas.

Se uma ambiguidade mudar o resultado funcional, o contrato ou o critério de aceite, fazer uma pergunta objetiva antes de implementar a parte dependente. Prosseguir no trabalho independente. Não exigir uma aprovação adicional de uma spec já autorizada nem perguntar sobre decisões técnicas rotineiras resolvidas pelas convenções do projeto.

Mudanças de requisito comunicadas pelo usuário atualizam a spec, os testes e a implementação afetados. Não reescrever a spec apenas para acomodar código divergente.
Preparar a branch antes de alterar código ou testes

- É proibido desenvolver ou realizar commits diretamente na main, salvo permissão explícita do usuário para a tarefa em questão. Um pedido de implementação não equivale a essa permissão.
- A spec ou as instruções do usuário devem informar o nome da branch de trabalho. Se estiver ausente, solicitar o nome antes de criar a branch e iniciar a implementação; a leitura do contexto e o planejamento podem continuar.
- Criar a branch nomeada a partir de dev, não de main. Não desenvolver diretamente na dev.
- Conferir a branch atual, a base e as alterações locais. Reutilizar uma branch apropriada da mesma tarefa já baseada em dev quando existir.
- Ao preparar uma branch nova, sincronizar dev com a origem existente por fast-forward quando possível. Não executar reset destrutivo, descartar trabalho local, reescrever histórico ou substituir branches para forçar a preparação.
- Se não houver repositório, dev ou origem necessária, relatar o impedimento em vez de presumir outra base ou inicializar um fluxo Git diferente.
- Registrar o nome e a base da branch no relato da tarefa. Não executar commit, push, merge ou deploy sem a autorização correspondente.

2. Derivar o plano de validação
   Relacionar cada critério de aceite aos cenários e ao nível de teste adequado. Uma lista curta é suficiente; usar identificadores como CA-01 somente quando ajudarem a rastrear uma spec maior.

Distinguir:

- Unitários: regras e comportamentos isolados.
- Integração: contratos entre componentes, persistência e interfaces reais.
- Regressão: comportamentos existentes que a mudança pode quebrar; não é necessariamente uma suíte ou ferramenta separada.
- E2E: jornada completa pela interface pública apropriada ao produto, com resultado observável no limite final relevante.
  Derivar cenários positivos, negativos, limites e estados aplicáveis das regras e dos contratos. Não presumir que cada critério precisa de um teste em todos os níveis. Para um bug, priorizar a reprodução automatizada da falha relatada. Para comportamentos existentes afetados, preservar ou acrescentar a cobertura de regressão pertinente.

Definir os cenários E2E nesta etapa, antes do desenvolvimento. Sua implementação ocorrerá depois que os testes iniciais e de regressão passarem, conforme o fluxo abaixo. Não inventar uma interface web para um projeto que só oferece API, CLI ou outro transporte.

Inspecionar scripts, configurações, ambiente de testes e ferramentas disponíveis antes de escolher comandos. Reutilizar o gerenciador de pacotes e o framework do projeto. Se faltar infraestrutura indispensável à tarefa, configurar apenas o necessário dentro do escopo autorizado, sem fingir que uma suíte vazia é uma validação. 3. Escrever os testes antes da implementação — Red
Criar ou atualizar primeiro os testes automatizados dos novos comportamentos e as proteções de regressão relevantes. Usar expectativas baseadas na spec, não em detalhes privados da implementação.

Executar os testes de comportamento novo ou corrigido e verificar que falham pelo motivo esperado. Uma falha de setup, dependência, sintaxe ou conexão não comprova o Red: corrigir a infraestrutura antes de continuar. Uma importação ausente pode ser a primeira falha de um teste novo; assim que houver estrutura mínima, confirmar a falha funcional pretendida.

Se um teste passar antes de alterar o código, investigar se o comportamento já existe ou se o cenário não exercita o requisito. Não produzir falhas artificiais nem quebrar código existente para simular TDD. Testes que protegem comportamento já atendido podem e devem permanecer verdes.

Usar dados fictícios e ambientes isolados. Substituir limites externos quando necessário, preservando a lógica sob teste. Um teste que simula a própria resposta da funcionalidade não comprova seu funcionamento. 4. Desenvolver conforme a spec — Green e Refactor
Implementar o menor incremento completo que satisfaça os testes e as diretrizes do projeto. Repetir o ciclo por comportamento, sem exigir que todos os testes da spec sejam escritos de uma só vez quando isso dificultar a execução incremental.

Executar os testes pertinentes a cada incremento. Refatorar com os testes verdes, mantendo contratos e escopo. Não enfraquecer expectativas, apagar testes, usar skip ou substituir regras reais por mocks para esconder falhas.

Se encontrar uma falha preexistente, distinguir sua evidência da mudança atual. Corrigir quando fizer parte do escopo; caso contrário, registrar a limitação, sem declarar a suíte integralmente aprovada. 5. Executar a suíte e conferir documentação de rotas
Ao completar a implementação, executar toda a suíte automatizada existente nos projetos afetados e as verificações obrigatórias do repositório. Em monorepos, incluir consumidores afetados por mudanças de contrato. Registrar os comandos realmente executados e os resultados.

Comparar as rotas da implementação com a base da tarefa, usando o diff quando disponível, incluindo alterações ainda não commitadas. Quando houver Swagger, OpenAPI ou outra documentação de API no projeto:

- Conferir que toda rota adicionada está documentada com método e caminho corretos.
- Atualizar operações alteradas e remover documentação de operações removidas.
- Conferir parâmetros, corpo, respostas, erros e autenticação aplicáveis contra os contratos efetivos.
- Executar a validação da especificação ou a geração existente, se disponível. Conferir os artefatos gerados; a presença de um comentário ou arquivo não prova que a operação aparece na documentação publicada pela aplicação.
  Não adicionar Swagger ou outra solução de documentação apenas para cumprir esta skill se o projeto não a utiliza nem a solicita. Nesse caso, informar que essa checagem não se aplica. Sem alterações de rotas, registrar essa condição de forma breve.

6. Implementar e executar E2E
   Depois que a suíte anterior passar e a documentação afetada estiver consistente, implementar os cenários E2E definidos a partir da spec. Reutilizar ou estender cobertura existente quando já comprovar a jornada, sem duplicar testes apenas para criar arquivos novos.

Exercitar a jornada real adequada ao projeto. No caso de uma aplicação com frontend, backend e persistência, verificar o fluxo entre essas partes em ambiente de teste; chamadas de API isoladas não comprovam a integração da interface. Simulações de serviços externos podem ser necessárias, mas devem ser identificadas, sem apresentar o trecho simulado como integração real validada.

Iniciar autonomamente os serviços locais necessários quando autorizado pela tarefa e pelas instruções do ambiente. Não pedir ao usuário para executar comandos de inicialização que o agente pode executar. Evitar alterações em ambientes de produção ou dados reais. Limpar dados e recursos criados pelos testes e encerrar somente processos iniciados para a tarefa que já não sejam necessários.

Executar os E2E novos ou afetados e a suíte E2E aplicável. Se falharem, corrigir a causa e repetir os cenários e verificações impactados. Mudanças em código compartilhado exigem repetir a suíte pertinente; não repetir checks já aprovados sem alteração ou preocupação nova.

Se faltar credencial, serviço ou recurso indispensável, concluir o que for verificável e informar precisamente o que não executou e por quê. Não tratar timeout, skip, ausência de testes ou execução com zero casos como sucesso.

Para mudanças exclusivamente documentais ou sem comportamento executável, explicar brevemente por que testes de comportamento e E2E não se aplicam, sem criar testes artificiais. 7. Concluir pelos critérios de aceite
Revisar a correspondência entre spec, código, testes e documentação. Cada critério deve ter evidência suficiente ou uma pendência explícita. Não declarar conclusão integral se um critério obrigatório ou E2E necessário não foi verificado.

Entregar um relato proporcional à tarefa contendo:

- Comportamento entregue e critérios atendidos.
- Testes e verificações executados, com falhas ou limitações reais.
- Situação da documentação das rotas, quando aplicável.
- Resultado dos E2E e limites de simulação.
- Critérios pendentes, se houver.
  Não inferir cobertura completa somente da porcentagem de cobertura e não alegar testes que não foram executados. Seguir os registros de desenvolvimento exigidos pelo projeto. A implementação desta skill não autoriza por si só commit, publicação, deploy ou mensagens externas.
