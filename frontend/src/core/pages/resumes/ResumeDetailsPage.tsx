"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  PencilLine,
  Trash2,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Column, Row, Panel, Text } from "@/core/components/Primitives";
import { LoadingState, ErrorState } from "@/core/components/Feedback";
import { ResponsiveDialog } from "@/core/components/ResponsiveDialog";
import { getApiError } from "@/core/lib/ApiError";
import { useDeleteResume, useResume } from "@/core/hooks/UseResumes";
import { ResumeProfile } from "./components/ResumeProfile";
type ResumeDetailsPageProps = { id: string };
export function ResumeDetailsPage({ id }: ResumeDetailsPageProps) {
  const query = useResume(id);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const params = useSearchParams();
  const router = useRouter();
  const deletion = useDeleteResume();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  if (query.isPending) return <LoadingState label="Carregando cadastro..." />;
  if (query.isError || !query.data)
    return (
      <Panel>
        <ErrorState
          message="Cadastro não encontrado ou indisponível."
          onRetry={() => void query.refetch()}
        />
        <Row className="justify-center pb-10">
          <Button asChild variant="outline">
            <Link href="/">Voltar aos candidatos</Link>
          </Button>
        </Row>
      </Panel>
    );
  const resume = query.data;
  async function remove() {
    setError("");
    try {
      await deletion.mutateAsync({ id });
      setConfirm(false);
      router.push("/?excluido=1");
    } catch (reason) {
      setError(getApiError(reason).message);
    }
  }
  return (
    <Column className="gap-6">
      <Row className="justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-950"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar aos candidatos
        </Link>
        <Row className="gap-2">
          <Button
            variant="ghost"
            size="icon"
            ref={deleteTrigger}
            aria-label="Excluir candidato"
            onClick={() => setConfirm(true)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
          <Button asChild size="sm">
            <Link href={`/candidatos/${id}/editar`}>
              <PencilLine aria-hidden="true" />
              Editar cadastro
            </Link>
          </Button>
        </Row>
      </Row>
      {params.get("salvo") === "1" && (
        <Row
          role="status"
          className="gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Cadastro salvo com sucesso na demonstração.
        </Row>
      )}
      <ResumeProfile resume={resume} />
      <ResponsiveDialog
        returnFocusTo={deleteTrigger.current}
        open={confirm}
        onOpenChange={(open) => {
          if (!deletion.isPending) setConfirm(open);
        }}
        title="Excluir candidato?"
        description={`O cadastro de ${resume.fullName} será removido desta demonstração.`}
        compact
      >
        <Column className="gap-5 p-5 sm:p-6">
          <Text>
            Confira o candidato antes de confirmar. Essa ação não afeta outros
            cadastros.
          </Text>
          {error && (
            <Text role="alert" className="text-red-700">
              {error}
            </Text>
          )}
          <Row className="justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirm(false)}
              disabled={deletion.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-700 hover:bg-red-800"
              onClick={() => void remove()}
              disabled={deletion.isPending}
            >
              {deletion.isPending && <LoaderCircle className="animate-spin" />}
              Confirmar exclusão
            </Button>
          </Row>
        </Column>
      </ResponsiveDialog>
    </Column>
  );
}
