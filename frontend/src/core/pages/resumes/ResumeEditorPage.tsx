"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Column, Panel, Text, Title } from "@/core/components/Primitives";
import { LoadingState, ErrorState } from "@/core/components/Feedback";
import { useResume } from "@/core/hooks/UseResumes";
import { ResumeForm } from "./components/ResumeForm";
import { ResumeProfile } from "./components/ResumeProfile";
type ResumeEditorPageProps = { id?: string };
export function ResumeEditorPage({ id }: ResumeEditorPageProps) {
  const router = useRouter();
  const query = useResume(id ?? "");
  const onSaved = (resume: { id: string }) =>
    router.push(`/candidatos/${resume.id}?salvo=1`);
  return (
    <Column className="gap-6">
      {(!id || !query.data) && (
        <Link
          href={id ? `/candidatos/${id}` : "/"}
          className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-950"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {id ? "Voltar aos detalhes" : "Voltar aos candidatos"}
        </Link>
      )}
      {id ? (
        query.isPending ? (
          <LoadingState />
        ) : query.isError || !query.data ? (
          <Panel>
            <ErrorState
              message="Cadastro não encontrado ou indisponível."
              onRetry={() => void query.refetch()}
            />
          </Panel>
        ) : (
          <ResumeProfile
            key={id}
            resume={query.data}
            editing
            onSaved={onSaved}
          />
        )
      ) : (
        <Column className="mx-auto w-full max-w-2xl gap-5">
          <Column className="gap-2">
            <Title className="text-2xl text-blue-950">
              Adicionar candidato
            </Title>
            <Text>Preencha os dados manualmente ou comece por um PDF.</Text>
          </Column>
          <ResumeForm onSaved={onSaved} />
        </Column>
      )}
    </Column>
  );
}
