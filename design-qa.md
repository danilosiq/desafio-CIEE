# QA visual — criação de candidatos

Fonte atual: `/Users/daniloosiq/Downloads/Untitled-2026-08-20-0934.png`, 12916 × 13352 pixels, substituída pelo autor para incluir os modais. As comparações anteriores de listagem permanecem nos artefatos históricos; esta revisão trata do novo fluxo de criação.

Implementação: `http://localhost:3000/`, tema claro com azul-marinho. As cores de anotação e a caligrafia do wireframe não são tokens da interface. Não há raster ou logo final no desenho; os ícones Lucide existentes foram mantidos.

## Estados e evidências

- Recortes da fonte: `frontend/test-results/CreationSourceDesktop.png` (1400 × 604) e `CreationSourceMobile.png` (1400 × 1059), ambos reduzidos proporcionalmente, sem distorção.
- Comparação integral no mesmo input: `CreationComparisonDesktop.png` e `CreationComparisonMobile.png`, em `frontend/test-results/`, fonte acima e renderizações correspondentes abaixo.
- Desktop: `CreationDesktopEmpty.png` e `CreationDesktopSelected.png`, viewport 1440 × 1000, densidade 1. São comparados modal sem arquivo e com arquivo selecionado.
- Mobile: `CreationMobileUpload.png`, `CreationMobileSelected.png`, `CreationMobileProcessing.png`, `CreationMobileReview.png` e `CreationMobileReviewContacts.png`, viewport 390 × 844, densidade 1. A revisão tem rolagem; o último arquivo registra os contatos e as ações, complementando o enquadramento superior.
- Rodapé: `CreationMobileActionsBefore.png`, `CreationMobileActions.png` e `CreationActionsComparison.png` (antes/depois juntos em 780 × 884, mesmos viewport e formulário com telefone preenchido).

O wireframe não define densidade ou viewport CSS. As renderizações foram reduzidas proporcionalmente para comparação estrutural, sem alegar igualdade de pixels. O quarto desenho móvel representa conteúdo mais alto que o dispositivo; por isso a evidência da revisão se divide entre início e contatos. Em telas desktop baixas, o corpo do modal também permite rolagem.

## Iterações e achados

1. [P2 corrigido] Título/cópia repetidos e controles auxiliares deixavam o upload móvel mais alto e carregado que no desenho. Evidência inicial: `CreationComparisonMobileBeforeCompact.png`. O bloco PDF foi compactado no celular. Em seguida, por solicitação explícita do autor, os atalhos de demonstração, o stepper, o atalho manual interno e os avisos da revisão foram removidos. O fluxo de etapas continua existindo sem indicador visual.
2. [P1 corrigido] O telefone podia aparecer sob a barra de ações. O E2E reproduziu uma diferença de 17 px entre o fim do rodapé e a região rolável. O cabeçalho e o corpo do modal foram separados; o corpo tem recorte e rolagem próprios e o rodapé possui fundo opaco/camada própria. Evidência focal antes/depois: `CreationActionsComparison.png`. O teste verifica alinhamento, opacidade, validação e salvamento.
3. As capturas de arquivo selecionado aguardam a transição de cores terminar antes de comparar a ação secundária “Escolher outro arquivo”. Capturar imediatamente após a troca podia registrar a cor intermediária do botão anterior, sem representar o estado final.

## Conferência do resultado

- Layout desktop: upload opcional à esquerda, divisória, campos na ordem nome/resumo/área/contatos à direita, ações ao final.
- Fluxo mobile: seleção → arquivo selecionado → processamento → revisão. Os campos não aparecem durante a escolha ou a leitura. Voltar preserva o preenchimento revisado e confirmar é a única ação que cadastra.
- Áreas: opções derivadas dos cadastros existentes, escolha refletida no campo editável e possibilidade de texto livre, conforme decisão do autor.
- Interações: arquivo inválido, remoção/troca, revisão, limpar dados, validação, duplicidade e cadastro manual continuam exercitados com mocks. Falha na leitura permite fechar e usar Adicionar.
- Movimento e acesso: fade/slide preservados, movimento reduzido respeitado, Escape e foco dos dialogs mantidos. Controles removidos também ficam ausentes da árvore de acessibilidade.
- Navegador integrado: modal desktop e móvel e barra de ações conferidos. Console observado sem erros.

## Limites

A leitura é simulada; nenhum PDF é enviado ao backend/Ollama nesta etapa. Não houve auditoria em Safari, teclado virtual físico ou leitor de tela. Imagens são evidências locais ignoradas pelo Git; não são snapshots pixel a pixel automatizados. As instruções posteriores do autor prevalecem sobre elementos presentes no desenho original.

## Validação final

`yarn fullcheck` aprovado: 48 testes de componentes/regras, tipos, arquitetura, formatação, cobertura e build. Suíte E2E completa: 23 aprovados, sem skips, incluindo barra móvel, fluxo em etapas, áreas existentes/personalizadas, remoções de UI, troca de arquivo e movimento reduzido. A execução interrompida por disco cheio não foi considerada sucesso; os resultados acima são da repetição concluída após remover somente cache gerado do frontend.

Nenhum achado P0/P1/P2 permanece aberto. As diferenças de paleta/caligrafia e o recorte rolável da revisão são intencionais e estão descritos acima.

## Incremento de catálogo — 07/11/2026

Fonte funcional: atividade atualizada no Notion, https://app.notion.com/p/410532791c7880838206f809da5ede20, critérios CA-07 a CA-13, e pedido de botões no header/footer. Não foi fornecido um wireframe específico para o catálogo; a interface reutiliza o estilo claro/azul-marinho já aprovado. Esta conferência valida consistência e responsividade, sem alegar comparação pixel a pixel com um desenho inexistente.

Evidências: `frontend/test-results/AreasDesktop.png` (1440 px, página inteira), `AreasMobile.png` (390 px, página inteira), `AreaEditorMobile.png` (390 × 844), densidade 1. Header e footer apresentam o mesmo acesso Áreas de atuação. A página possui categorias com nome/descrição, consulta, criação, edição, exclusão confirmada e busca. O cadastro móvel é um bottom sheet, sem overflow horizontal verificado.

A seleção do candidato agora usa o catálogo AreaOfExpertise e a opção Outros. Apenas Outros exibe texto livre obrigatório; isso substitui a decisão anterior de mostrar permanentemente um campo livre ao lado da escolha de área. IDs e texto livre permanecem distintos no payload dos mocks. Exclusão com vínculos é bloqueada, conforme decisão expressa do autor.

No navegador integrado foram conferidos os dois acessos, o catálogo desktop, o bottom sheet e a mensagem de área vinculada. Console sem erros observados. Testes do incremento: 59 de componentes/regras e 28 E2E completos aprovados; TypeScript e build aprovados. A leitura de PDF e a persistência continuam simuladas, e a integração real permanece fora deste incremento.

final result: passed

## Revisão final da sprint — 07/11/2026

Capturas `frontend/test-results/EditConflict-desktop.png` e `EditConflict-celular.png`, em 1440 e 390 px, conferidas após a execução. Tema claro/azul-marinho preservado; campos preenchidos e ação Editar cadastro existente ficam visíveis após conflito na edição. No celular, conteúdo e mensagem se organizam em uma coluna, sem overflow horizontal. O campo Outros preserva o texto efetivamente digitado ao alternar opções; o nome de uma categoria vinculada não é reutilizado como texto livre. A perda de consulta do catálogo preserva o rótulo original no seletor.

Validação atual: 63 testes Jest e 30 E2E aprovados; fullcheck e build aprovados. Persistência, catálogo e extração continuam simulados. Capturas não equivalem a validação em Safari ou teclado virtual físico.
