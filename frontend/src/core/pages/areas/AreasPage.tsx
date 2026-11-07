"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Tags,
  Search,
  PencilLine,
  Trash2,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Column, Row, Text, Title, Panel } from "@/core/components/Primitives";
import { LoadingState, ErrorState } from "@/core/components/Feedback";
import { ResponsiveDialog } from "@/core/components/ResponsiveDialog";
import { useAreas, useDeleteArea } from "@/core/hooks/UseAreas";
import { getApiError } from "@/core/lib/ApiError";
import { AreaEditor } from "./components/AreaEditor";
import type { AreaOfExpertise } from "@/core/types/AreaOfExpertise";
type AreaDialog = {
  mode: "create" | "details" | "edit" | "delete";
  area?: AreaOfExpertise;
  open: boolean;
  session: number;
};
export function AreasPage() {
  const query = useAreas();
  const deletion = useDeleteArea();
  const trigger = useRef<HTMLElement | null>(null);
  const session = useRef(0);
  const addButton = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<AreaDialog | null>(null);
  const rows = [...(query.data ?? [])]
    .filter((area) =>
      `${area.name} ${area.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  function open(
    mode: AreaDialog["mode"],
    element: HTMLElement,
    area?: AreaOfExpertise,
  ) {
    trigger.current = element;
    deletion.reset();
    session.current += 1;
    setDialog({ mode, area, open: true, session: session.current });
  }
  function close() {
    if (!deletion.isPending)
      setDialog((current) => (current ? { ...current, open: false } : null));
  }
  function saved() {
    setNotice(
      dialog?.mode === "edit"
        ? "Área atualizada com sucesso."
        : "Área cadastrada com sucesso.",
    );
    if (session.current !== dialog?.session) return;
    trigger.current = addButton.current;
    setDialog((current) => (current ? { ...current, open: false } : null));
  }
  async function remove() {
    if (!dialog?.area) return;
    try {
      await deletion.mutateAsync({ id: dialog.area.id });
      setNotice("Área excluída com sucesso.");
      trigger.current = addButton.current;
      setDialog((current) => (current ? { ...current, open: false } : null));
    } catch {
      /* O dialog preserva contexto e apresenta a falha. */
    }
  }
  const title =
    dialog?.mode === "create"
      ? "Cadastrar área de atuação"
      : dialog?.mode === "edit"
        ? "Editar área de atuação"
        : dialog?.mode === "delete"
          ? "Excluir área de atuação?"
          : "Detalhes da área de atuação";
  return (
    <Column className="gap-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-950"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar aos candidatos
      </Link>
      <Row className="flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <Column className="gap-2">
          <Title className="text-2xl text-blue-950 sm:text-3xl">
            Áreas de atuação
          </Title>
          <Text>
            Gerencie as categorias usadas nos cadastros dos candidatos.
          </Text>
        </Column>
        <Button
          ref={addButton}
          onClick={(event) => open("create", event.currentTarget)}
        >
          <Plus aria-hidden="true" />
          Cadastrar área
        </Button>
      </Row>
      {notice && (
        <Row
          role="status"
          className="gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950"
        >
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          {notice}
        </Row>
      )}
      <Row className="flex-wrap justify-between gap-3">
        <Text className="text-sm">
          {rows.length}{" "}
          {rows.length === 1 ? "área cadastrada" : "áreas cadastradas"}
        </Text>
        <div className="relative w-full sm:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400"
          />
          <Input
            aria-label="Buscar áreas de atuação"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar categorias..."
            className="pl-9"
          />
        </div>
      </Row>
      {query.isPending ? (
        <LoadingState label="Carregando áreas..." />
      ) : query.isError ? (
        <ErrorState
          message="Não foi possível carregar as áreas de atuação."
          onRetry={() => void query.refetch()}
        />
      ) : !rows.length ? (
        <Column className="items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Tags aria-hidden="true" className="size-8 text-blue-300" />
          <Title as="h2" className="text-lg">
            Nenhuma área encontrada
          </Title>
          <Text>
            {search
              ? "Tente outra pesquisa."
              : "Cadastre a primeira categoria de área de atuação."}
          </Text>
          {search && (
            <Button variant="outline" onClick={() => setSearch("")}>
              Limpar pesquisa
            </Button>
          )}
        </Column>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((area) => (
            <Panel key={area.id} className="flex flex-col overflow-hidden">
              <button
                aria-label={`Consultar área ${area.name}`}
                onClick={(event) => open("details", event.currentTarget, area)}
                className="flex flex-1 flex-col items-start gap-3 p-5 text-left outline-none transition hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-800"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-950">
                  <Tags aria-hidden="true" className="size-5" />
                </span>
                <Title as="h2" className="break-words text-base text-blue-950">
                  {area.name}
                </Title>
                <Text className="break-words text-sm">{area.description}</Text>
              </button>
              <Row className="justify-end gap-1 border-t border-slate-100 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar área ${area.name}`}
                  onClick={(event) => open("edit", event.currentTarget, area)}
                >
                  <PencilLine aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Excluir área ${area.name}`}
                  onClick={(event) => open("delete", event.currentTarget, area)}
                >
                  <Trash2 aria-hidden="true" />
                  Excluir
                </Button>
              </Row>
            </Panel>
          ))}
        </div>
      )}
      {dialog && (
        <ResponsiveDialog
          key={dialog.session}
          open={dialog.open}
          onOpenChange={(value) => {
            if (!value) close();
          }}
          title={title}
          description={
            dialog.mode === "delete"
              ? "Áreas vinculadas a candidatos não podem ser excluídas."
              : "Catálogo de categorias de áreas de atuação."
          }
          returnFocusTo={trigger.current}
          compact
        >
          {dialog.mode === "create" || dialog.mode === "edit" ? (
            <AreaEditor
              initial={dialog.area}
              onSaved={saved}
              onCancel={close}
            />
          ) : dialog.mode === "details" ? (
            <Column className="gap-5 p-5 sm:p-6">
              <Column className="gap-2">
                <Title as="h3" className="break-words text-xl text-blue-950">
                  {dialog.area?.name}
                </Title>
                <Text className="whitespace-pre-wrap break-words">
                  {dialog.area?.description}
                </Text>
              </Column>
              <Row className="justify-end gap-2">
                <Button variant="ghost" onClick={close}>
                  Fechar
                </Button>
                <Button
                  onClick={(event) =>
                    open("edit", event.currentTarget, dialog.area)
                  }
                >
                  <PencilLine aria-hidden="true" />
                  Editar área
                </Button>
              </Row>
            </Column>
          ) : (
            <Column className="gap-5 p-5 sm:p-6">
              <Text>
                Excluir a categoria{" "}
                <strong className="text-slate-800">{dialog.area?.name}</strong>?
              </Text>
              {deletion.isError && (
                <Text
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {getApiError(deletion.error).message}
                </Text>
              )}
              <Row className="flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={close}
                  disabled={deletion.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-red-700 hover:bg-red-800"
                  onClick={() => void remove()}
                  disabled={deletion.isPending}
                >
                  {deletion.isPending && (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  )}
                  Confirmar exclusão
                </Button>
              </Row>
            </Column>
          )}
        </ResponsiveDialog>
      )}
    </Column>
  );
}
