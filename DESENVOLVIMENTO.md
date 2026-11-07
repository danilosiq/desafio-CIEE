# Registro de desenvolvimento com IA

Neste arquivo, será registrado a metodologia com o uso da IA (Codex) neste desafio, o foco é informar como utilizei e por que utilizei de tal maneira

## Organização e execução de trabalho

### Organização inicial - Preparação de uso de agentes de IA e bootstrap inicial do projeto

De começo, tive foco em definir os `Agents.md` e isso inclui

- Regras e restrições (tanto gerais, quanto especificos de cada tópico)
- Padronização de código
- definição da arquitetura dos projetos
- definições de stacks

Os beneficios e realizar este passo inicial é permitir padronizar o codigo e projeto desde a criação dele, realizando o uso da IA de maneira correta e padronizada, disso iniciei a instalação de libs iniciais

### Oganização no processo - uso de IA para organização de etapas do desenvolvimento

Com a junção do uso de IA no desenvolvimento e o plugin do Notion, foi criado uma base de divisão de tarefas e implementação, afim de esquematizar e organizar o passo a passo do desenvolvimento de uma visão mais geral. Usei o Notion simulando um Jira, no qual tinha as issues separas ja escrita em forma de spec, então a história seguia um padrão estrutural de

1. Cenário atual: Falando o atual momento do desenvolvimento, abordando o problema a ser resolvido
2. Necessidade: apresentaçao do problema a ser resolvido
3. Regras de negócio: Falar sobre restrições envolvendo fluxo do produto
4. Notas técnicas: Centralização da parte técnica da solução, falando mais sobre código e não de produto em si
5. Critério de aceite: quality gates

E no notion foi criado uma base dados, em formato de tabela, no qual possuia o titulo de cada tarefa, mais o status dela, separada por: Pendente, em andamento, concluido

### Execução do trabalho - Uso de Spec driven + skill propria

## Principais decições

Nesta seção, falarei um pouco mais de como a IA me ajudou a fazer algumas tomadas de decisões e descobertas para soluções

### Uso de Ollama + Qwen para a leitura de PDFs

A solução escolhida é executar o modelo `qwen2.5vl:7b` localmente pelo Ollama, integrado ao backend Node.js. O Ollama gerencia e executa o modelo; o Qwen, por ser um modelo de visão e linguagem, interpreta as imagens das páginas e identifica os dados solicitados.

O objetivo é reconhecer nome completo, e-mail e telefone para preencher o formulário, sempre permitindo revisão e correção antes de salvar. As capacidades de interpretação visual e extração estruturada estão descritas na [página oficial do modelo no Ollama](https://ollama.com/library/qwen2.5vl:7b). Isso fundamenta a escolha.

#### Fluxo planejado

1. O usuário envia um PDF para auxiliar o preenchimento.
2. O backend valida o limite de 5 MB e o conteúdo do arquivo antes do processamento.
3. O PDF.js (`pdfjs-dist`), com `@napi-rs/canvas`, renderiza as páginas do PDF em imagens no backend Node.js. As imagens podem ser mantidas em memória durante o processamento; se houver arquivos temporários, devem ser removidos ao final. Converter o PDF não é responsabilidade do Qwen. A escolha segue o [exemplo oficial de conversão para PNG no Node.js](https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs), sem exigir uma API Python adicional.
4. Um provider de infraestrutura envia as imagens e as instruções ao Ollama local, que executa o `qwen2.5vl:7b`. A API de visão recebe imagens junto do texto da solicitação, conforme a [documentação oficial](https://docs.ollama.com/capabilities/vision).
5. O modelo recebe um prompt mantido em arquivo próprio e um schema JSON com os campos esperados. As instruções devem exigir dados presentes no documento e `null` para informações não identificadas, sem inventar valores. O Ollama oferece [saídas estruturadas por schema](https://docs.ollama.com/capabilities/structured-outputs); o backend ainda deve validar a resposta e os valores extraídos.
6. O frontend recebe os campos para preencher o mesmo formulário utilizado no cadastro manual. A leitura não salva nem atualiza candidatos automaticamente.
7. Depois da revisão e confirmação do usuário, o backend aplica as regras de cadastro e persiste os dados no SQL Server. E-mails duplicados devem ser bloqueados, e o frontend deve oferecer a atualização do candidato existente por uma ação explícita.
8. O PDF e as imagens temporárias são descartados ao término do processamento, inclusive em caso de erro. Falhas de leitura não impedem o cadastro manual.

#### Motivos e benefícios

A integração direta com Node.js evita desenvolver, configurar e manter uma API Python adicional. Ainda existe uma dependência operacional: o Ollama precisa estar instalado, em execução e com o modelo baixado. A inicialização deve verificar essas condições e apresentar mensagens claras, preservando o funcionamento do cadastro manual quando a leitura estiver indisponível.

A execução local mantém o processamento dos currículos na infraestrutura controlada pelo projeto e dispensa uma API externa paga por token ou com cota de requisições. Isso não significa custo operacional zero: continuam existindo consumo de memória, processamento, energia e armazenamento do modelo.

Usar o Qwen para reconhecer e interpretar os campos reduz a quantidade de integrações nesta abordagem, mas não elimina possíveis erros de leitura ou interpretação.

O isolamento em um provider mantém Express, use cases e persistência independentes da forma de inferência. O prompt fica separado do código para facilitar revisão, versionamento e comparação de resultados, enquanto a resposta estruturada permite um contrato consistente com o formulário.

#### Escalabilidade e limites

A separação entre o backend e a inferência permite evoluir a capacidade de processamento de forma independente. Se houver aumento de demanda, será possível avaliar controle de concorrência, filas e outras instâncias de inferência, com distribuição de requisições, sem mover regras de cadastro para o modelo. Essas são possibilidades futuras, não funcionalidades já implementadas.

O Ollama oferece configurações de paralelismo e fila, mas a quantidade de requisições simultâneas depende da memória disponível e do contexto de cada requisição. Aumentar a concorrência não garante maior desempenho e pode elevar o consumo de memória. A [documentação operacional do Ollama](https://docs.ollama.com/faq) serve de referência para esses ajustes.

O processamento local não possui uma franquia de tokens de uma API hospedada. Há, porém, limite de contexto por requisição, consumo de recursos pelas imagens e tempo de execução. PDFs com várias páginas exigirão uma estratégia de processamento e consolidação que preserve os dados relevantes, a ser validada na implementação.

## Implementação do frontend com mocks

### Escopo e organização

Foi implementado o card de frontend com mocks da Sprint 1: formulário manual e por PDF simulado, listagem com busca e filtro por área, detalhes e edição. O design utiliza azul-marinho como cor primária e tema claro, conforme a orientação do autor.

O trabalho começou a partir de `dev`, na branch `front-end(feat)-mocks`. O nome solicitado usava dois-pontos, caractere não permitido pelo Git; foi substituído por hífen. Durante a execução, o checkout compartilhado passou para uma branch do backend. Para preservar esse trabalho paralelo, a entrega do frontend foi transferida para um worktree isolado na branch já criada, com conferência dos arquivos antes de remover somente as alterações próprias da origem. Não foram realizados commits, push, merge ou deploy.

As rotas do Next.js encaminham para as páginas em `src/core/pages`. Services Axios concentram o contrato de comunicação, hooks TanStack Query gerenciam queries e mutations e os mocks ficam isolados em `src/mocks`. O adapter simula latência, persistência local, validação, duplicidade e os três cenários de leitura do PDF. Os componentes base de UI seguem o padrão shadcn/ui, com composições e layout em `src/core/components`.

### Participação da IA e decisões revisadas

O Codex ajudou a consolidar a spec do Notion, escrever os testes antes do comportamento, implementar as telas e verificar a aplicação. Exemplos de orientações aproveitadas foram usar a skill `danilosiq-spec-driven`, manter os mocks isolados, usar Jest com arquivos `.spec.ts`, permitir cadastro após falha de leitura e adotar azul-marinho em tema claro.

As instruções e respostas foram incorporadas ao escopo do card; a integração com backend, SQL Server e Ollama permaneceu fora desta entrega. Nenhuma inferência de modelo foi executada para ler currículos: as sugestões do PDF são fixtures. A identificação exata do modelo utilizado pelo Codex nesta sessão não foi exposta ao projeto; não foi presumida ou registrada como se estivesse confirmada.

Na revisão, foram ajustados tipos de consultas dos testes, separada a tabela de candidatos em componente próprio, removida uma verificação redundante e desativada a geração automática de regras do Next.js para preservar o AGENTS.md do autor. A política de npm foi incluída na suíte Jest. Os campos editados manualmente são preservados diante de sugestões do PDF e respostas antigas não são aplicadas após a troca ou remoção do arquivo.

### Verificação e evidências

- A primeira execução teve 20 testes falhando e três passando. As falhas demonstraram a ausência de validação, operações simuladas e campos do formulário, sem depender de erro de instalação.
- A suíte final tem 34 testes passando em cinco arquivos `.spec.ts`, incluindo validação de nome/e-mail, limite de PDF, conflito de cadastro, atualização, busca/filtros, recuperação de erro e política de npm.
- `npm run fullcheck` passou: formatação, verificação de arquitetura, TypeScript, Jest com cobertura e build de produção.
- A cobertura medida pelo Jest foi de 81,31% das linhas e 63,67% das ramificações. Isso não representa cobertura integral; parte da navegação, detalhes e edição é exercitada pelos E2E sem instrumentação de cobertura do navegador.
- Sete E2E executados pelo Jest, usando Playwright somente como biblioteca do navegador, passaram contra o build de produção com o adapter real de mocks. Incluem cadastro e edição, validação, duplicidade, leitura simulada, ausência de campos, falha de leitura e resposta de arquivo removido.
- Desktop de 1440 px e mobile de 390 px foram conferidos em Chromium. Não foram observados erros de execução no navegador nem estouro horizontal no formulário mobile. As capturas ficam em `frontend/test-results/`, ignoradas pelo Git.
- Nenhuma rota HTTP de backend foi criada nesta tarefa; documentação Swagger não se aplica às rotas de navegação do frontend.

### Limites e próximos passos

Os dados da demonstração são fictícios e ficam no localStorage deste navegador, com fallback em memória. O PDF não é efetivamente interpretado, e as respostas de extração são fixas. Os E2E desta entrega comprovam a interface com mocks, não persistência em SQL Server, qualidade de OCR ou inferência real. A integração desses serviços permanece nos cards próprios.

A avaliação de acessibilidade foi limitada à semântica básica, labels, nomes das ações, estados e navegação verificados; não houve auditoria completa com leitores de tela. Não foi criada funcionalidade de exclusão nesta atividade de design e mocks; ela está prevista no CRUD e na integração real. O tempo humano dedicado ao desafio deve ser informado pelo autor; não foi estimado pela IA.

## Adequação ao wireframe — 06/11/2026

### Especificação da alteração

**Cenário atual:** a primeira versão navegável com mocks usava uma estrutura visual diferente do wireframe enviado pelo autor.

**Necessidade:** reproduzir as quatro telas propostas (lista, cards, perfil e edição no próprio perfil), preservando o tema claro e o azul-marinho. As cores verde, vermelho e laranja da imagem identificam componentes e anotações; não são tokens visuais da aplicação.

**Regras:** manter a ordem nome, e-mail, telefone e área na lista; permitir trocar a visualização sem perder filtros; validar e-mail e formatar telefone; desfazer alterações sem persistir; salvar apenas após confirmação. Dialogs de cadastro e exclusão viram bottom sheets no celular. A exclusão foi adicionada ao mock nesta revisão, substituindo a limitação registrada na entrega anterior.

**Notas técnicas:** React Hook Form com `zodResolver` e schema Zod único para os formulários. Radix Dialog fornece semântica, contenção de foco e Escape; a composição responsiva controla apresentação e retorno do foco. Services Axios e hooks TanStack Query continuam isolados dos componentes. Playwright permanece como biblioteca de automação executada pelo Jest em arquivos `.spec.ts`.

**Critérios de aceite:** quatro telas com cabeçalho e rodapé compartilhados; lista/cards com os mesmos registros; perfil com identificação, resumo e datas; edição com Desfazer/Concluir; validação acessível; dialogs centralizados no desktop e ancorados no rodapé no celular; cadastro e exclusão utilizáveis em 390 × 844, sem overflow horizontal; testes e build aprovados.

### Implementação e verificação

Os testes iniciais para alternância de visualização, máscara de telefone e exclusão falharam antes da implementação (3 falhas, 34 sucessos). Depois foram adicionados testes da edição inline e regressões no navegador. O `frontend/AGENTS.md` passou a exigir React Hook Form + Zod nos formulários e regressão Playwright em desktop e celular para alterações de interface.

A interface agora usa cabeçalho horizontal, boas-vindas e ações, barra de filtros, lista ou grade de três colunas, perfil com resumo à direita e edição nos mesmos campos. A exclusão de dados fictícios pede confirmação. A lista é atualizada imediatamente após excluir. O acionador recupera foco ao fechar dialogs. Na comparação visual, o link de retorno e as ações da edição foram alinhados na mesma linha, conforme o desenho.

- `npm run fullcheck`: aprovado, incluindo 40 testes em 6 suítes, TypeScript, arquitetura, formatação e build de produção.
- Cobertura Jest de linhas: 75,44%; a cobertura dos E2E não está instrumentada nesse número.
- `npm run test:e2e`: 12 testes com Jest e Playwright, incluindo criação manual pelo bottom sheet móvel, PDF simulado, duplicidade, edição, Desfazer, máscara, busca, lista/cards e cancelamento/confirmação de exclusão.
- Revisão no navegador integrado: lista, cards, perfil, edição, bottom sheet móvel e retorno do foco após Escape.
- Comparação com o desenho e capturas estão registradas em `design-qa.md`; imagens locais em `frontend/test-results` (ignoradas pelo Git).

Continuam sendo mocks: não há envio ou interpretação real de PDF, nem integração com a API e SQL Server. A verificação mobile usa Chromium com viewport reduzido; teclado virtual físico, Safari e leitor de tela não foram auditados nesta etapa.

## Refinamento de interação e ordenação — 06/11/2026

**Cenário atual:** a barra mostrava um seletor de área e um ícone sem ação. Os contatos e o espaço dos cards/linhas não abriam o perfil; botões não tinham cursor de ação consistente.

**Necessidade e regras:** remover o filtro de áreas e transformar o ícone em um botão que abre “Organizar por”. Oferecer Ordem alfabética (padrão), Alterações mais antigas e Alterações mais novas, usando `updatedAt` para as duas últimas, sem perder busca ou visualização. Usar o nome como desempate. Toda a superfície da linha/card deve abrir o perfil como um único link acessível; chevron permanece apenas decorativo. Botões habilitados usam `cursor-pointer`. Menus e dialogs entram com fade/slide para cima e saem com fade/slide para baixo; a troca lista/cards também anima e respeita movimento reduzido.

**Notas técnicas:** Radix Popover para posicionamento, Escape, clique externo e foco do menu. Motion controla entrada/saída mantendo o conteúdo montado até terminar. A navegação tem animação de entrada, sem reter páginas antigas durante a mudança de rota, preservando o estado dos formulários e dados atualizados. Continua sem novos arquivos CSS. As regras reutilizáveis foram adicionadas ao `frontend/AGENTS.md`.

**Critérios de aceite e testes:** ausência do seletor de áreas, três ordenações aplicadas à última alteração, busca/cards preservados, clique nos contatos abrindo o perfil em ambos os modos, cursores, menu em 390 px e transições de entrada/saída e movimento reduzido. Os testes iniciais demonstraram quatro falhas funcionais antes da implementação; os testes de ordenação usam datas de criação/alteração diferentes para evitar uma ordenação pela data errada.

Validação final do refinamento: `npm run fullcheck` aprovado (43 testes, arquitetura, formatação, TypeScript e build). Os 17 E2E passaram contra a versão de produção, incluindo os frames reais de fade/slide de entrada e saída, a alteração de movimento reduzido em tempo de execução, cursores e navegação pelo contato em listas/cards. O teste de cancelamento móvel aguarda a desmontagem animada antes de consultar o conteúdo de fundo. Os dados continuam fictícios; nenhuma rota de API foi adicionada ou alterada e não há mudança em Swagger. Trabalho mantido na branch `front-end(feat)-mocks`, originada de `dev`, sem commit ou push.

## Cards obrigatórios no celular — 07/11/2026

**Cenário atual:** o seletor lista/cards também aparecia no celular. **Necessidade:** abaixo do breakpoint `sm` (40rem), mostrar somente cards e ocultar esse controle. No desktop, manter ambas as opções.

**Regras e critérios de aceite:** o modo mobile efetivo é sempre cards, mesmo após selecionar lista no desktop. Ao voltar à largura de desktop, recuperar a escolha anterior. Busca e ordenação permanecem disponíveis. O limite de largura acompanha o mesmo breakpoint do Tailwind, com atualização ao redimensionar.

**Implementação:** `useIsMobile` acompanha a media query com `useSyncExternalStore`; a página deriva a visualização efetiva sem sobrescrever a preferência desktop. Há uma única coleção renderizada. O seletor usa visibilidade responsiva, ficando fora da navegação por teclado e da árvore de acessibilidade no celular.

**TDD:** o novo teste falhou inicialmente porque a visualização móvel ainda era `list`; passou após a alteração. A regressão de navegador cobre 390, 639 e 640 px, ausência dos controles no celular, cards obrigatórios, retorno à preferência desktop e preservação da busca. Não houve alteração de rotas de API. Branch mantida: `front-end(feat)-mocks`, baseada em `dev`.

Validação final: `npm run fullcheck` aprovado com 44 testes de componentes/regras, TypeScript e build; suíte completa de 18 E2E aprovada. Captura móvel em `frontend/test-results/MobileCardsOnly.png`.

## Modais de criação e fluxo móvel por PDF — 07/11/2026

**Cenário atual:** a criação usava um formulário e o upload empilhados, com controles de demonstração. O novo wireframe propõe PDF à esquerda e campos à direita no desktop, com seleção, arquivo selecionado, processamento e revisão separados no celular.

**Regras:** selecionar/trocar/remover PDF com nome e tamanho visíveis; processar somente após ação explícita; revisar antes de confirmar; voltar ao arquivo preservando alterações manuais; limpar os campos sem salvar. Nome, resumo, área, e-mail e telefone seguem a ordem do desenho. O seletor usa áreas já existentes, conforme resposta do autor, e o campo livre permite outra área. O botão Adicionar abre diretamente o cadastro manual no celular. A leitura continua simulada nesta entrega com mocks.

**Ajustes pedidos durante a revisão:** remover Usar PDF de exemplo, Cenários da demonstração e Preencher manualmente de dentro do modal; retirar o stepper sem eliminar o fluxo em etapas; retirar o cabeçalho redundante da revisão, a instrução de obrigatoriedade e o banner de leitura concluída. O cadastro manual permanece disponível por Adicionar, inclusive após fechar uma leitura que falhou.

**Implementação:** React Hook Form + Zod permanecem como fonte de estado e validação. `ResumeFields` compartilha os campos e centraliza a escolha de área. `PdfUpload` mostra arquivo ou processamento; `ResumeForm` coordena a revisão sem persistência automática. A leitura cancelada ou substituída invalida a resposta anterior. Não há arquivos CSS novos nem rotas HTTP novas; a checagem de Swagger não se aplica a esta alteração de interface.

Os antigos cenários controlados pela UI foram removidos do formulário e do multipart enviado pelo service. Para manter regressões de sucesso, extração parcial e falha, o adapter local reconhece os nomes reservados de arquivos em `src/mocks/ScanFixtures.ts`. Isso existe somente na infraestrutura de mocks; não é uma regra do backend nem uma interpretação real de PDF. Os testes enviam arquivos pelo input em vez de depender de atalhos visuais.

**Barra de ações:** o teste de regressão reproduziu 17 px de área abaixo do rodapé, onde o telefone podia aparecer. O modal passou a separar o cabeçalho e a região rolável, com recorte próprio; o rodapé tem fundo opaco e camada explícita. A geometria é conferida no navegador em 390 × 844, junto da validação e do salvamento após rolar o formulário.

**Evidências:** capturas em `frontend/test-results/CreationDesktop*.png`, `CreationMobile*.png`, comparação de fonte/render em `CreationComparisonDesktop.png` e `CreationComparisonMobile.png`, e antes/depois do rodapé em `CreationActionsComparison.png`. O navegador integrado confirmou o modal desktop, o fluxo inicial móvel e o rodapé sem campos abaixo. O console observado não apresentou erros.

Os primeiros testes novos falharam para ausência de etapas e Limpar dados; os testes adicionais reproduziram a presença dos controles que o autor pediu para remover. A suíte de componentes/regras ficou em 48 testes passando; `npm run fullcheck` passou com tipos, arquitetura, formatação, cobertura e build. Uma execução E2E foi interrompida por falta de espaço ao gravar PNGs; somente o cache gerado em `frontend/.next/cache` foi limpo antes de repetir a validação. O teste de animação captura mutações/frames desde antes do clique, sem depender de conseguir capturar um frame intermediário após o clique em uma máquina ocupada.

Trabalho mantido na branch `front-end(feat)-mocks`, originada de `dev`, sem commit, push ou deploy. Os limites permanecem: dados fictícios, sem OCR/IA real ou persistência SQL Server; teste móvel em Chromium, sem auditoria de teclado físico/Safari/leitor de tela.

Resultado final após os ajustes do autor e a correção do rodapé: 48 testes de componentes/regras aprovados, `npm run fullcheck` aprovado e suíte completa de 23 E2E aprovada, sem skips. A ação secundária de troca de arquivo é conferida após a transição de cores, e a barra móvel fica alinhada ao limite da região rolável. `npm run typecheck` e `npm run format:check` também passaram após a atualização dos E2E.

## Catálogo de áreas e navegação — 07/11/2026

**Fonte:** atividade atualizada no Notion, [[FRONT END] Criação do front e design + mock](https://app.notion.com/p/410532791c7880838206f809da5ede20). O incremento corresponde aos critérios CA-07 a CA-13: catálogo AreaOfExpertise, seleção referenciada e Outros. O pedido no chat acrescenta acesso pelo header e pelo footer.

**Cenário atual e necessidade:** não havia uma página de gerenciamento das categorias; o seletor anterior reunia textos dos candidatos. Criar uma página Áreas de atuação com mocks isolados, listagem, cadastro, consulta, edição e exclusão, conectada à navegação global. A seleção nos candidatos deve usar o catálogo e separar referência de texto livre.

**Regras consolidadas:** nome e descrição da área são obrigatórios. A área do candidato é opcional; Outros exige texto não vazio e não cria uma categoria automaticamente. Uma categoria escolhida prevalece sobre texto livre anteriormente digitado. Preservar escolha/texto ao consultar, recarregar e editar, inclusive no fluxo PDF. Confirmar exclusão e permitir cancelar. Por decisão expressa do autor nesta conversa, bloquear exclusão enquanto houver candidatos vinculados.

**Implementação:** rota Next `/areas-de-atuacao`, com botões Áreas de atuação no header e no footer, navegação ativa, busca e cards responsivos. Dialogs são bottom sheets no celular. React Hook Form + Zod validam a categoria, e Axios/TanStack Query cuidam das operações por services/hooks. O adapter e o armazenamento do catálogo ficam em `/mocks`; o formulário do candidato não depende mais de extrair áreas dos próprios currículos.

O estado do formulário usa uma escolha explícita entre vazio, ID do catálogo e Outros. O payload distingue `areaOfExpertiseId` de `interestArea`, usado como texto livre quando não há referência; o adapter projeta o nome atual da categoria na resposta do candidato. Renomear uma categoria atualiza a exibição dos candidatos vinculados; excluir exige ausência desses vínculos. Registros legados sem o campo de referência são reconciliados por nome com o catálogo inicial, preservando textos sem correspondência como livres. Novos registros com referência nula explícita não são vinculados automaticamente por coincidência de nome.

As operações simuladas usam `/areas-of-expertise` no adapter, incluindo consulta individual, atualização e exclusão, sem criar uma API Next. A integração real e o mapeamento final de endpoints/payloads permanecem nos cards próprios; nada foi presumido como implementado no backend. Não há rota HTTP de servidor nova a documentar em Swagger.

**TDD e regressão:** os testes iniciais falharam para os acessos ausentes, catálogo inexistente e validação condicional de Outros. A suíte cobre criação/consulta/edição/exclusão, bloqueio com vínculos, renomeação projetada no candidato, ausência de inclusão automática para Outros, estados vazio/erro e preservação do formulário após falha. O navegador integrado conferiu os acessos, a página desktop, o bloqueio de exclusão e o cadastro em bottom sheet.

**Escopo e limites:** frontend com dados fictícios em localStorage e fallback em memória, sem backend, SQL Server ou Ollama reais. Branch reutilizada: `front-end(feat)-mocks`, originada de `dev`. Sem commit, push ou deploy. Não foi alterado o checkout do backend.

**Validação final do catálogo:** 59 testes de componentes/regras aprovados, incluindo preservação de nome e descrição após erro de operação. `npm run fullcheck` passou para o código de produção deste incremento (arquitetura, formatação, tipos, testes com cobertura e build). Após acrescentar a regressão de erro, a suíte completa e o TypeScript passaram novamente. Os 28 E2E passaram, cobrindo navegação pelo header/footer em desktop e celular, CRUD completo, consulta de detalhes, cancelamento, bloqueio com vínculos, desvinculação e exclusão posterior, renomeação refletida no candidato e em seletores, restauração após reload, Outros manual e no PDF e cadastro de área por bottom sheet. O carregamento das opções é aguardado antes de conferir a seleção restaurada. A rotina E2E agora aguarda o encerramento do servidor que ela iniciou.

Capturas deste incremento: `frontend/test-results/AreasDesktop.png`, `AreasMobile.png` e `AreaEditorMobile.png`. O navegador integrado confirmou ambos os acessos, a listagem, o formulário móvel e a recusa de exclusão da área Design de produto enquanto vinculada; console observado sem erros. Nenhuma evidência anterior foi usada como prova dos novos fluxos.

## Revisão dos critérios da sprint — 07/11/2026

**Cenário atual:** o catálogo já estava implementado, mas o card ainda indicava pendência e evidências anteriores. A revisão dos critérios encontrou falhas na edição: conflito de e-mail sem ação para abrir o cadastro existente; nome de categoria tratado como texto livre ao trocar para Outros; seleção vinculada sem identificação após falha de consulta do catálogo. Também havia uma gravação de área antiga capaz de fechar um novo formulário.

**Necessidade e aceite:** manter o mesmo tratamento de duplicidade na criação e na edição, preservar a identificação da área vinculada durante erros de consulta, separar o nome projetado do catálogo de um texto realmente digitado em Outros e preservar um novo rascunho quando uma gravação anterior termina. A exclusão de categoria vinculada continua bloqueada. O acompanhamento da sprint deve refletir as evidências atuais.

**TDD e implementação:** regressões falharam pela ausência do link de edição, ausência da opção selecionada, preenchimento indevido de Outros e fechamento da sessão nova. O teste de concorrência confere o estado aberto do dialog após concluir a gravação anterior. O erro de submissão agora é compartilhado entre criação e edição; a área original é metadado separado do texto livre; a sessão da gravação é conferida antes de fechar o formulário. O teste da troca para Outros aguarda o seletor ficar habilitado para exercitar a interação efetiva.

**Instalação:** foi encontrado um lockfile lockfile npm anterior incompatível com o npm 11.6.2 declarado e um package-lock residual. O lockfile foi regenerado com o Yarn do projeto, mantendo a configuração original; o package-lock foi retirado com cópia em `/tmp/ciee-frontend-package-lock-before-yarn.json`. A instalação imutável passou. Não foram adicionadas dependências.

**Escopo:** mesma branch `front-end(feat)-mocks`, baseada em `dev`, sem commit, push ou deploy. Nenhuma rota de API real foi criada ou alterada; Swagger não se aplica ao adaptador de mocks. A integração com backend permanece nos cards próprios.

**Validação final desta revisão:** `npm run fullcheck` aprovado com 63 testes em nove suítes, cobertura de 83,89% das linhas, formatação, arquitetura, TypeScript e build. Depois da inclusão dos novos E2E, `npm run typecheck` passou e a suíte completa `npm run test:e2e` passou com 30 casos em 103,077 s, sem skips. Os novos cenários desktop/mobile validam a troca de categoria para Outros, a preservação do texto livre ao alternar opções, o conflito durante a edição, a abertura do cadastro existente e a ausência de atualização silenciosa do candidato de origem. Capturas `frontend/test-results/EditConflict-desktop.png` e `EditConflict-celular.png` conferidas visualmente, sem overflow horizontal. A revisão de componentes preservou a separação entre hooks/services/UI, o uso compartilhado do erro e os controles acessíveis. CA-01 a CA-13 conferidos contra as evidências atuais; card atualizado com esses resultados e com a decisão de bloquear exclusão enquanto houver vínculos.

## Auditoria de dependências do frontend — 07/11/2026

A instalação havia deixado novamente um lockfile lockfile npm anterior e package-lock residual. O lockfile foi regenerado pelo npm 11.6.2 declarado e o package-lock removido. A auditoria recursiva identificou advisories em glob, minimatch e deepmerge e depreciação de whatwg-encoding. Foram fixados glob 14.0.4, minimatch 11.0.5, deepmerge 4.1.1 (fora da faixa afetada >=4.2.0 <=4.3.1) e jsdom 27.4.0, compatível com Node 22.12.0. O CLI shadcn foi retirado das dependências locais; componentes gerados permanecem no projeto. O gerenciador oficial passa a ser npm; dependências e versões devem ser validadas pelo lockfile npm. `npm audit --json` retornou sucesso sem alertas, sem exclusões ou supressões de advisories. Auditoria reflete a base de avisos consultada nesta data.

Validação da correção de dependências: instalação `npm ci` aprovada; auditoria recursiva sem alertas; `npm run fullcheck` aprovado com 63 testes, tipos, arquitetura, formatação e build; 30 E2E aprovados em 95,516 s. `npm run format:check` e `git diff --check` passaram. Sem alterações de rotas de API, commits ou push.
