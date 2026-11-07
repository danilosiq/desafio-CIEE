Este arquivo registra os combinados do projeto para reutilização nos próximos chats.


---

## Fluxo de IA

Seguir **Spec Driven Implementation**: a especificação orienta a implementação e a validação de cada tarefa.

1. **Entender o contexto:** ler as instruções aplicáveis, a especificação fornecida e o código existente antes de propor alterações.
2. **Definir a especificação:** antes de codificar, registrar objetivo, escopo, comportamentos esperados, regras, contratos e critérios de aceite verificáveis. Reutilizar a especificação existente; para tarefas simples, uma descrição curta no chat é suficiente.
3. **Resolver lacunas:** não inventar requisitos ou comportamentos. Perguntar somente quando uma ambiguidade impedir uma decisão funcional ou de contrato; decisões técnicas rotineiras podem seguir os padrões do projeto.
4. **Planejar pela especificação:** identificar as camadas e os arquivos afetados e os cenários necessários para verificar os critérios de aceite.
5. **Implementar o escopo:** desenvolver somente o comportamento especificado, respeitando a arquitetura e os contratos existentes. Exemplos deste documento não representam requisitos de funcionalidades.
6. **Validar pelos requisitos:** derivar testes e verificações da especificação, incluindo cenários de sucesso, erros e casos de borda aplicáveis. Não usar apenas a implementação como fonte do resultado esperado.
7. **Manter alinhamento:** quando os requisitos mudarem, atualizar a especificação, a implementação, os testes e a documentação afetada. Não alterar a especificação apenas para justificar uma implementação divergente.
8. **Concluir com evidências:** conferir os critérios de aceite e informar o que foi entregue, as verificações executadas e eventuais pendências ou limitações.

Não exigir aprovação adicional para decisões já autorizadas pela tarefa. A profundidade da especificação e do planejamento deve ser proporcional à complexidade da mudança.

---

## Objetivo

Este repositório contém o frontend da aplicação de leitura de curriculos, responsável pela interface com o usuário, pelos fluxos de navegação e pela integração com os serviços de backend.

---

## Princípios arquiteturais

- Utilizar organização modular por pages
- Separar lógica de UI, serviços e tipos
- Não misturar regras de interface com comunicação de API
- Não chamar Axios diretamente dentro de componentes
- Centralizar chamadas HTTP em `services`
- Formulários devem utilizar React Hook Form com validação por schema Zod, integrado por zodResolver. Não duplicar as mesmas regras em validações manuais independentes.
- Schemas devem ser reutilizados nas fronteiras de validação e manter mensagens acessíveis junto aos campos.
- Hooks devem concentrar lógica reutilizável
- Componentes próprios, globais e reutilizáveis devem ficar em `src/core/components`
- Componentes específicos devem ficar dentro da própria page
- `src/components/ui` é reservado exclusivamente aos componentes nativos instalados pelo shadCn
- Wrappers, adaptações e derivações de componentes shadCn devem ficar em `src/core/components`
- Reutilizar componentes existentes antes de criar novos

---

## Regras e restrições gerais

- Não alterar estrutura de pastas, contratos ou arquivos existentes sem solicitação
- Não criar código fora do escopo solicitado
- Não implementar funcionalidades não pedidas explicitamente
- Em caso de dúvida, perguntar antes de implementar
- Não introduzir novas dependências externas sem necessidade explícita
- Não duplicar lógica existente
- Não criar código morto ou incompleto
- Não deixar `console.log` em código final
- Não deixar estados, imports ou componentes sem uso
- Não quebrar compatibilidade com APIs existentes
- Toda entrada de usuário deve possuir validação
- Toda chamada assíncrona deve tratar loading e erro
- Toda feature deve considerar estados vazios, erro e carregamento
- Toda implementação visual deve seguir as cores, fontes e padrões definidos no setup
- Todo o uso de datas e formatações, deverá ser usado `date-fns`

---

## Stack

- NextJs
- TypeScript
- TailwindCSS
- Axios
- Tanstack Query
- React Hook Form para gerenciamento de formulários
- Zod com @hookform/resolvers para schemas e validação
- Playwright para regressão e E2E de navegador, executados pelo Jest
- Lucide Icons
- shadCn
- date-fns

---

## Componentes base do shadcn/ui

Os componentes instalados pelo shadcn/ui devem permanecer em:

```text
src/components/ui/
```

Esses componentes constituem a base do Design System da aplicação e podem ser modificados diretamente quando a alteração representar uma capacidade genérica, reutilizável e independente das regras de negócio.

Exemplos:

- Adicionar estado `loading` estilizado ao Button.
- Adicionar variantes ou tamanhos.
- Ajustar estilos e comportamentos globais.
- Estender propriedades genéricas de componentes existentes.

**Não criar wrappers apenas para adicionar propriedades ou comportamentos genéricos que podem ser incorporados ao componente base.**

### Componentes próprios e derivados

Componentes que representam composições, abstrações ou comportamentos específicos da aplicação devem ser criados em:

```text
src/core/components/
```

Esses componentes devem reutilizar os primitivos existentes em `@/components/ui/`, evitando duplicação de implementação.

Exemplos:

- `ConfirmDialog` — composição de Dialog e Button.
- `SearchInput` — Input com comportamento de pesquisa.
- `UserSelect` — seleção de usuários com regras específicas.

---

### Critério de decisão

Antes de criar ou modificar um componente:

1. Verificar se a funcionalidade é genérica e aplicável ao componente base. Nesse caso, estender o componente em `/ui`.
2. Verificar se representa uma composição reutilizável ou comportamento próprio da aplicação. Nesse caso, criar em `/core/components`.
3. Evitar wrappers sem benefício arquitetural claro.
4. Preservar compatibilidade com a API existente e evitar alterações que introduzam regras de negócio nos componentes base.

---

# Componentes específicos de feature

Componentes usados somente por uma feature devem permanecer dentro da própria
feature, mesmo quando utilizarem ou derivarem componentes shadCn.

```text
src/core/pages/home/components
```

Não promover um componente específico para `src/core/components` antes que ele
seja realmente compartilhado.

## Padronização de código

nesta sessão, trabalharemos com a tomada de decisão e padronização de código

---

### Props

1. Toda pagina,componente ou função, deve seguir com uma padronagem de nomenclatura terminada com Props, como

- ButtonProps
- FooterProps

2. As props deve ser tipadas, segue exemplo

```tsx
type ItemCardProps = {
  title: string;
};

export function ItemCard({ title }: ItemCardProps) {
  return (
    <Column className="gap-3 rounded-xl border border-gray-200 p-4">
      <Title>{title}</Title>
      <Button>Abrir</Button>
    </Column>
  );
}
```

### Componentes

Um componente deve fazer apenas uma coisa.

Se o componente estiver grande demais, separar em componentes menores.,

Exemplo:

```text
Footer
HeaderButton
LanguageSelect
SubmitButton
```

---

#### Componentes e hooks

Componentes podem consumir hooks.

Exemplo:

```tsx
export function SaveItemButton() {
  const { saveItem, isPending } = useSaveItem();

  return (
    <Column className="gap-4">
      ...
      <Button
        onClick={() => saveItem({ title: "Novo item" })}
        disabled={isPending}
      >
        Salvar
      </Button>
    </Column>
  );
}
```

Componentes não devem consumir services diretamente.

Evitar:

```tsx
await itemsService.create(...)
```

---

#### Estados obrigatórios

Quando aplicável, componentes devem tratar:

- loading
- erro
- estado vazio
- sucesso
- disabled

Exemplo:

```tsx
<Button disabled={isPending}>
  {isPending ? "Criando..." : "Criar função"}
</Button>
```

---

#### Interação e movimento

- Botões habilitados devem exibir `cursor-pointer`, incluindo botões de ícone e controles de visualização.
- Itens de lista/cards navegáveis devem oferecer toda a superfície como um único link acessível, sem exigir clique no título ou chevron e sem links aninhados.
- Menus, dialogs e transições de conteúdo devem entrar com fade e slide para cima e sair com fade e slide para baixo. Preservar a montagem durante a animação de saída e respeitar `prefers-reduced-motion`.

#### Dialogs e adaptação mobile

- Dialogs devem aparecer centralizados no desktop e como bottom sheets no celular, preservando o mesmo conteúdo, formulário e validação.
- Manter título e descrição acessíveis, contenção de foco, fechamento por Escape e retorno do foco ao acionador.
- O conteúdo deve permitir rolagem com teclado virtual, sem esconder as ações nem gerar rolagem horizontal.

#### Acessibilidade

Componentes devem possuir o mínimo necessário de acessibilidade.

- Inputs devem ter label.
- Botões devem ter texto claro e compatibilidade para tooltips.
- Estados disabled devem ser visíveis.
- Modais devem ter título.
- Ícones sozinhos devem possuir descrição acessível quando necessário com tooltip.

---

### hooks

O objetivo é manter os componentes limpos, centralizar lógica reutilizável e padronizar chamadas HTTP, mutations e queries.

#### Objetivo

Hooks devem concentrar lógica reutilizável da aplicação.

Eles podem ser usados para:

- buscar dados
- executar mutations
- encapsular regras de UI reutilizáveis
- consumir services
- integrar estado global com componentes

Hooks **não** devem conter JSX.

---

#### Regras gerais

- Todo hook deve começar com `use`.
- Cada hook deve possuir responsabilidade única.
- Hooks HTTP devem utilizar TanStack Query.
- Hooks HTTP devem consumir `services`.
- Hooks não devem chamar Axios diretamente.
- Hooks devem retornar dados e estados necessários para a UI.
- Não duplicar hooks existentes.
- Não criar hooks genéricos sem necessidade real.
- Não colocar regra visual complexa dentro de componentes quando puder ser extraída para hook.

#### Exemplo de código

- Hooks de Query
  Usar `useQuery` para buscar dados.

Retorno esperado:

- data
- isLoading
- isFetching
- isError
- error
- refetch

Exemplo:

```ts
export function useItemById(itemId: string) {
  const query = useQuery({
    queryKey: itemQueryKeys.detail(itemId),
    queryFn: () => itemsService.findById(itemId),
    enabled: !!itemId,
  });

  return {
    item: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
```

---

- Hooks de Mutation

Usar `useMutation` para criar, atualizar, remover ou executar ações.

Retorno esperado:

- função de ação com nome claro
- data
- isPending
- isSuccess
- isError
- error
- reset

Exemplo:

```ts
export function useSaveItem() {
  const mutation = useMutation({
    mutationFn: itemsService.create,
  });

  return {
    saveItem: mutation.mutate,
    item: mutation.data,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
```

---

- Query Keys

Query keys devem ser centralizadas por domínio.

Exemplo:

```ts
export const itemQueryKeys = {
  all: ["items"] as const,
  detail: (itemId: string) => ["items", itemId] as const,
};
```

Uso:

```ts
useQuery({
  queryKey: itemQueryKeys.detail(itemId),
  queryFn: () => itemsService.findById(itemId),
});
```

Evitar:

```ts
useQuery({
  queryKey: ["item", itemId],
  queryFn: () => itemsService.findById(itemId),
});
```

---

### Services

O objetivo é centralizar toda comunicação externa da aplicação, mantendo componentes e hooks desacoplados da infraestrutura.

Os services são responsáveis por toda comunicação externa da aplicação.

Eles podem realizar:

- chamadas HTTP
- comunicação Socket.IO
- integração com APIs externas

Os services **não** devem conter lógica de interface ou regras de negócio.

#### Regras gerais

- Toda chamada HTTP deve passar por um service.
- Utilizar Axios para comunicação HTTP.
- Não realizar requests diretamente em componentes.
- Não realizar requests diretamente em hooks.
- Não utilizar `fetch`.
- Cada domínio deve possuir seu próprio service.
- Services devem retornar apenas `response.data`.
- Não tratar loading dentro do service.
- Não exibir toast dentro do service.
- Não acessar componentes React dentro do service.

---

#### Cliente Axios

Toda comunicação HTTP deve utilizar um client centralizado.

Exemplo:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

Todos os services devem importar este client.

---

#### Estrutura dos services

Cada função representa uma ação da API.

Exemplo:

```ts
export async function getItem(params: GetItemParams) {
  const response = await api.get(`/items/${params.itemId}`);

  return response.data;
}
```

#### Passagem de parâmetros

Utilizar objetos como parâmetro da função.

Correto:

```ts
type GetItemParams = {
  itemId: string;
};

export async function getItem(params: GetItemParams) {
  const response = await api.get(`/items/${params.itemId}`);

  return response.data;
}
```

Evitar:

```ts
export async function getItem(itemId: string);
```

Objetos facilitam evolução futura da API.

---

#### Tratamento de erro

Os services **não** devem capturar erros apenas para repassá-los.

Evitar:

```ts
try {
    ...
} catch (error) {
    throw error
}
```

Permitir que o erro seja tratado pelo TanStack Query.

---

#### Retorno

Sempre retornar:

```ts
return response.data;
```

Evitar:

```ts
return response;
```

---

### Nomenclatura de arquivo

todos os arquivos, devemos usar PascalCase

---

### Pages

Objetivo: Garantir que todas as paginas sigam o mesmo padrão visual, estrutural e arquitetural.

#### Regras gerais

- Evitar utilizar tags HTML diretamente em componentes de pages
- Arquivos e componentes de páginas devem terminar com `Page`, por exemplo `IdentificationPage.tsx` e `ItemsPage`.
- Rotas são definidas em `src/app`; seus arquivos devem encaminhar para as páginas em `src/core/pages`, mantendo lógica e interface nos respectivos módulos.
- Manter os nomes reservados do Next.js (`page.tsx`, `layout.tsx`, `not-found.tsx` etc.) dentro de `src/app`; essa é a exceção à nomenclatura PascalCase.
- Não substituir rotas por condicionais de estado que alternam páginas no App.
- Utilizar apenas TailwindCSS para estilização
- Não criar arquivos `.css`, `.scss` ou estilos inline sem solicitação explícita
- Não utilizar styled-components, CSS Modules ou outras soluções de estilo
- Não adicionar bibliotecas visuais novas sem aprovação
- Reutilizar componentes globais existentes antes de criar componentes novos
- Componentes específicos da pagina devem ficar dentro da própria pagina
- Manter componentes pequenos e com responsabilidade única

---

### Testes

Objetivo: Garantir que as funcionalidades do frontend tenham testes automatizados
e que mudanças não causem regressões nos fluxos existentes.

#### Regras gerais

- Utilizar obrigatoriamente Jest como executor dos testes, com React Testing Library e ambiente jsdom nos testes de componentes.
- Todos os arquivos de teste devem terminar em `.spec.ts`, como `CreateCandidate.spec.ts`. Não utilizar `.test.ts` ou `.spec.tsx`.
- A convenção `.spec.ts` também se aplica aos testes de integração, regressão e E2E. Nos testes de componentes, utilizar sintaxe compatível com arquivos `.ts`, sem JSX.
- Toda implementação ou alteração de comportamento deve acompanhar testes novos
  ou atualização dos testes afetados, incluindo validação de entradas e estados
  de sucesso, erro, vazio e disabled, quando aplicáveis.
- Derivar os cenários dos requisitos e contratos, incluindo caminhos negativos.
  Em caso de contrato indefinido, perguntar antes de definir o resultado esperado.
- Priorizar interações acessíveis e resultados visíveis ao usuário. Não testar
  detalhes internos, replicar a implementação ou usar snapshots como única prova.
- Mockar somente limites externos, como navegação e APIs do navegador ausentes
  no jsdom. Não substituir a lógica da funcionalidade em teste.
- Utilizar somente dados fictícios e não depender de backend ou serviços reais.
- Antes de concluir, revisar todos os testes e executar a suíte completa com
  `npm run test:coverage` e a checagem do repositório com `npm run fullcheck`.
- Revisar cobertura e cenários ausentes; não declarar cobertura integral com
  base apenas na porcentagem.
- Não apagar, enfraquecer ou usar `skip` em testes para esconder falhas.
- Alterações de tamanho, layout e responsividade também devem ser conferidas no
  navegador, pois jsdom não calcula o layout real.
- Aplicar testes unitários, de regressão e E2E.
- Testes de regressão do frontend com Playwright são requisito básico de entrega para alterações de fluxos e interfaces. Utilizar Playwright como biblioteca de automação dentro do Jest, mantendo arquivos `.spec.ts`.
- Cobrir desktop e celular, navegação, validação dos formulários, alternância de visualização e dialogs/bottom sheets afetados. Conferir overflow, ações de confirmação/cancelamento e preservação de dados.
- Executar `npm run test:e2e` contra o build da versão alterada antes de concluir; snapshots ou capturas isoladas não substituem testes de interação.

#### Comandos

- `npm test`: executa toda a suíte Jest.
- `npm run test:watch`: acompanha os testes durante o desenvolvimento.
- `npm run test:coverage`: gera cobertura em `coverage/`.
- `npm run test:e2e`: executa regressão de navegador com Jest e Playwright, em desktop e celular.
- `npm run fullcheck`: valida arquitetura, formatação, tipos, testes e build.

---

### Gerenciador de pacotes

Objetivo: Garantir instalações e comandos consistentes em todas as máquinas.

#### Regras gerais

- Utilizar obrigatoriamente Yarn para instalar dependências, executar scripts e
  rodar testes. Não utilizar npm, npx, pnpm ou Bun neste repositório.
- Usar a versão exata declarada em `packageManager` no `package.json`, por meio
  do Corepack. Ativar com `corepack enable` após selecionar o Node da `.nvmrc`.
- Versionar somente `yarn.lock` como lockfile. Não criar `package-lock.json`,
  `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `bun.lock` ou `bun.lockb`.
- Após clonar e em verificações automatizadas, executar `yarn install --immutable`
  para garantir que a instalação não altere o lockfile.
- Adicionar pacotes com `yarn add` ou `yarn add -D`; remover com `yarn remove`.
- Executar ferramentas locais com `yarn exec` ou scripts do projeto.
- Manter `nodeLinker: node-modules` em `.yarnrc.yml`.
- Manter os testes da política de npm junto da suíte Jest. Toda entrega deve
  passar por `yarn fullcheck`, incluindo a validação do gerenciador de pacotes.
- Os nomes reservados `package.json`, `yarn.lock` e `.yarnrc.yml` são exceções
  à nomenclatura PascalCase, assim como os arquivos reservados do framework.

---

## Git, branches e CI/CD

- É proibido desenvolver ou realizar commits diretamente na `main`, salvo permissão explícita do usuário para a tarefa em questão. Solicitar uma implementação não constitui essa permissão.
- Utilizar `dev` como base de integração e criar as branches de trabalho a partir dela. Não desenvolver diretamente na `dev`.
- Antes de alterar código ou testes, obter o nome da branch na spec ou nas instruções do usuário. Se não tiver sido informado, solicitar o nome antes de criar a branch e iniciar a implementação.
- Conferir a branch atual e as alterações locais. Reutilizar uma branch da tarefa já criada a partir de `dev` quando apropriado; não criar outra sem necessidade.
- Ao criar uma branch, sincronizar a base `dev` com a origem existente por fast-forward quando possível e criar a branch com o nome informado. Não descartar alterações locais, executar reset destrutivo ou sobrescrever branches para forçar essa preparação.
- Se o repositório, a branch `dev` ou a origem necessária não estiver disponível, informar o impedimento; não usar `main` silenciosamente como base alternativa.
- CI e CD fazem parte da entrega do projeto para sustentar o fluxo entre branches de trabalho, `dev` e `main`, com verificações automatizadas e promoção controlada entre os ambientes definidos.
- Mudanças em instruções ou skills não autorizam, por si só, commit, push, merge ou deploy. Seguir a autorização da tarefa para essas ações.

