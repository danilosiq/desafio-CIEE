"use client";
import { useReducedMotion } from "@/core/hooks/UseReducedMotion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Layers3, UserRound, ArrowUpRight, Tags } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";
type AppShellProps = { children: ReactNode };
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f8fc] text-slate-900 selection:bg-blue-100">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-950 focus:p-3 focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <header className="px-4 pt-5 sm:px-8 sm:pt-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <Link
            href="/"
            aria-label="Banco de candidatos, início"
            className="flex items-center gap-3"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-950 text-white">
              <Layers3 aria-hidden="true" className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-blue-950">
              Banco de candidatos
              <span className="ml-2 hidden border-l border-slate-200 pl-2 text-xs font-normal text-slate-400 sm:inline">
                CIEE
              </span>
            </span>
          </Link>
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-4">
            <nav aria-label="Navegação principal">
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/areas-de-atuacao"
                  aria-current={
                    pathname === "/areas-de-atuacao" ? "page" : undefined
                  }
                  className="aria-[current=page]:border-blue-200 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-950"
                >
                  <Tags aria-hidden="true" />
                  Áreas de atuação
                </Link>
              </Button>
            </nav>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <UserRound aria-hidden="true" className="size-4 text-blue-900" />
              <span className="hidden sm:inline">
                Equipe de recrutamento CIEE
              </span>
              <span className="sm:hidden">Recrutamento</span>
            </div>
          </div>
        </div>
      </header>
      <main
        id="conteudo"
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-9"
      >
        <motion.div
          key={pathname}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
        >
          {children}
        </motion.div>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-9 sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="flex w-fit items-center gap-2 text-sm font-semibold text-blue-950"
            >
              <Layers3 aria-hidden="true" className="size-5" />
              Banco de candidatos
            </Link>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Um cadastro, novas possibilidades.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-900">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Demonstração · dados fictícios
            </span>
            <p className="text-xs text-slate-400">
              Desafio do CIEE feito por Danilo Dante Siqueira
            </p>
            <nav
              aria-label="Navegação do rodapé"
              className="flex flex-wrap items-center gap-3"
            >
              <Button asChild variant="outline" size="sm">
                <Link href="/areas-de-atuacao">
                  <Tags aria-hidden="true" />
                  Áreas de atuação
                </Link>
              </Button>
              <Link
                href="/"
                className="flex items-center gap-1 text-xs font-medium text-blue-900"
              >
                Voltar ao início
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
