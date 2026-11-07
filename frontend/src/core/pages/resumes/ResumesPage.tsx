"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatedContent } from "@/core/components/AnimatedContent";
import { ErrorState, LoadingState } from "@/core/components/Feedback";
import { Column, Row, Text, Title } from "@/core/components/Primitives";
import { useIsMobile } from "@/core/hooks/UseIsMobile";
import { useResumes } from "@/core/hooks/UseResumes";
import { compareAsc, parseISO } from "date-fns";
import {
  FilePlus2,
  FolderOpen,
  LayoutGrid,
  List,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CreateResumeDialog } from "./components/CreateResumeDialog";
import { ResumeCollection } from "./components/ResumeCollection";
import { ResumeSortMenu, type ResumeSort } from "./components/ResumeSortMenu";

export function ResumesPage() {
  const query = useResumes();
  const trigger = useRef<HTMLElement | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ResumeSort>("alphabetical");
  const [view, setView] = useState<"list" | "grid">("list");
  const isMobile = useIsMobile();
  const displayView = isMobile ? "grid" : view;
  const [dialog, setDialog] = useState<{
    mode: "manual" | "pdf";
    open: boolean;
    session: number;
  } | null>(null);
  function openDialog(mode: "manual" | "pdf", element: HTMLElement) {
    trigger.current = element;
    setDialog((previous) => ({
      mode,
      open: true,
      session: (previous?.session ?? 0) + 1,
    }));
  }
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !query.hasNextPage || query.isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void query.fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, rows.length]);
  const filtered = rows
    .filter((row) =>
      `${row.fullName} ${row.email} ${row.phone} ${row.areaOfExpertise}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => {
      const alphabetical = a.fullName.localeCompare(b.fullName, "pt-BR", {
        sensitivity: "base",
      });
      if (sort === "alphabetical") return alphabetical;
      const chronological = compareAsc(
        parseISO(a.updatedAt),
        parseISO(b.updatedAt),
      );
      return (
        (sort === "oldest" ? chronological : -chronological) || alphabetical
      );
    });

  return (
    <Column className="gap-6">
      <Row className="flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-6 sm:items-center">
        <Column className="max-w-xl gap-2">
          <Title className="text-2xl leading-tight text-blue-950 sm:text-3xl">
            Bem-vindo ao banco de candidatos!
          </Title>
          <Text className="text-xs">
            Desafio do CIEE feito por Danilo Dante Siqueira
          </Text>
        </Column>
        <Row className="w-full flex-wrap gap-2 sm:w-auto">
          <Button
            variant="outline"
            onClick={(event) => {
              openDialog("pdf", event.currentTarget);
            }}
            className="flex-1 sm:flex-none"
          >
            <FilePlus2 aria-hidden="true" />
            Adicionar por PDF
          </Button>
          <Button
            onClick={(event) => {
              openDialog("manual", event.currentTarget);
            }}
            className="flex-1 sm:flex-none"
          >
            <Plus aria-hidden="true" />
            Adicionar
          </Button>
        </Row>
      </Row>
      <Row className="flex-wrap justify-between gap-4">
        <Row className="flex-wrap gap-3">
          <Row className="gap-2">
            <Users aria-hidden="true" className="size-4 text-blue-900" />
            <Title as="h2" className="text-sm">
              Candidatos
            </Title>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-950">
              {filtered.length}
            </span>
          </Row>
          <ResumeSortMenu value={sort} onChange={setSort} />
        </Row>
        <Row className="w-full gap-3 sm:w-auto">
          <div
            role="group"
            aria-label="Visualização dos candidatos"
            className="hidden shrink-0 rounded-lg border border-slate-200 bg-white p-1 sm:flex"
          >
            <button
              aria-label="Visualizar em lista"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className="flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:text-blue-950 focus-visible:outline-2 focus-visible:outline-blue-800 aria-pressed:bg-blue-50 aria-pressed:text-blue-950"
            >
              <List aria-hidden="true" className="size-4" />
            </button>
            <button
              aria-label="Visualizar em cards"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className="flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:text-blue-950 focus-visible:outline-2 focus-visible:outline-blue-800 aria-pressed:bg-blue-50 aria-pressed:text-blue-950"
            >
              <LayoutGrid aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="relative min-w-0 flex-1 sm:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400"
            />
            <Input
              aria-label="Buscar candidatos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar candidatos..."
              className="pl-9"
            />
          </div>
        </Row>
      </Row>
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          message="Não foi possível carregar os cadastros."
          onRetry={() => void query.refetch()}
        />
      ) : filtered.length === 0 ? (
        <Column className="items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
          <FolderOpen aria-hidden="true" className="size-9 text-blue-300" />
          <Title as="h3" className="text-lg">
            Nenhum candidato encontrado
          </Title>
          <Text>
            {search
              ? "Tente outra pesquisa ou remova os filtros."
              : "Adicione o primeiro candidato ao banco."}
          </Text>
          {search ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
              }}
            >
              Limpar filtros
            </Button>
          ) : (
            <Button
              onClick={(event) => {
                openDialog("manual", event.currentTarget);
              }}
            >
              Adicionar candidato
            </Button>
          )}
        </Column>
      ) : (
        <Column className="gap-3">
          {displayView === "list" && (
            <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_minmax(0,.9fr)_minmax(0,1fr)_24px] gap-4 px-5 text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:grid">
              <span>Nome</span>
              <span>E-mail</span>
              <span>Telefone</span>
              <span>Área de atuação</span>
              <span className="sr-only">Ações</span>
            </div>
          )}
          <AnimatedContent contentKey={`${displayView}-${sort}`}>
            <ResumeCollection rows={filtered} view={displayView} />
          </AnimatedContent>
          <div ref={sentinel} aria-hidden="true" />
          {query.isFetchingNextPage && <LoadingState />}
          <Text className="mt-1 text-xs">
            {filtered.length} de {total || rows.length} candidatos
          </Text>
        </Column>
      )}
      {dialog && (
        <CreateResumeDialog
          key={dialog.session}
          returnFocusTo={trigger.current}
          mode={dialog.mode}
          open={dialog.open}
          onClose={() =>
            setDialog((current) =>
              current ? { ...current, open: false } : null,
            )
          }
        />
      )}
    </Column>
  );
}
