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
