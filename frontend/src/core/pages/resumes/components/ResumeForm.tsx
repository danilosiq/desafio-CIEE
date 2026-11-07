"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Column, Row } from "@/core/components/Primitives";
import { AnimatedContent } from "@/core/components/AnimatedContent";
import { useResumeForm } from "@/core/hooks/UseResumeForm";
import { useIsMobile } from "@/core/hooks/UseIsMobile";
import { PdfUpload } from "./PdfUpload";
import { ResumeSubmitError } from "./ResumeSubmitError";
import { ResumeFields } from "./ResumeFields";
import type { Resume } from "@/core/types/Resume";
export type ResumeFormProps = {
  initial?: Resume;
  onSaved?: (resume: Resume) => void;
  showPdf?: boolean;
  onCancel?: () => void;
  mobileSteps?: boolean;
};
export function ResumeForm({
  initial,
  onSaved,
  showPdf = true,
  onCancel,
  mobileSteps = false,
}: ResumeFormProps) {
  const form = useResumeForm({ initial, onSaved });
  const mobile = useIsMobile();
  const [review, setReview] = useState(false);
  const stepped = mobileSteps && mobile && showPdf && !initial;
  const phase = form.isScanning ? "processing" : review ? "review" : "upload";
  const showFields = !stepped || phase === "review";
  async function extract() {
    const success = await form.extract();
    if (success) setReview(true);
  }
  const upload = (
    <PdfUpload
      compact={stepped}
      file={form.file}
      error={form.fileError}
      isScanning={form.isScanning}
      onFile={form.pickFile}
      onExtract={() => void extract()}
    />
  );
  return (
    <Column>
      <AnimatedContent contentKey={stepped ? phase : "form"}>
        {stepped && !showFields ? (
          <Column className="min-h-96 gap-4 px-5 py-6">{upload}</Column>
        ) : (
          <div
            className={
              showPdf && !initial && !stepped
                ? "grid items-start gap-0 md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"
                : ""
            }
          >
            {showPdf && !initial && !stepped && (
              <aside
                aria-label="Preenchimento por PDF"
                className="border-b border-slate-200 p-5 sm:p-6 md:sticky md:top-0 md:border-b-0 md:border-r"
              >
                {upload}
              </aside>
            )}
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void form.submit();
              }}
              className="min-w-0"
            >
              <Column className="gap-5 p-5 sm:p-6">
                {stepped && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReview(false)}
                    className="-ml-3 w-fit"
                  >
                    <ArrowLeft aria-hidden="true" />
                    Voltar ao arquivo
                  </Button>
                )}
                <ResumeFields form={form} />
                <ResumeSubmitError error={form.submitError} />
                {form.saved && (
                  <Row
                    role="status"
                    className="gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800"
                  >
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    Cadastro salvo com sucesso.
                  </Row>
                )}
              </Column>
              <div
                data-testid="resume-form-actions"
                className="sticky bottom-0 isolate z-10 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6"
              >
                <Row className="justify-center gap-1">
                  {onCancel ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancel}
                      disabled={form.isSaving}
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/">Cancelar</Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={form.clearForm}
                    disabled={form.isSaving || form.isScanning}
                  >
                    <RotateCcw aria-hidden="true" />
                    Limpar dados
                  </Button>
                </Row>
                <Button
                  type="submit"
                  disabled={form.isSaving || form.isScanning}
                  className="w-full sm:w-auto"
                >
                  {form.isSaving ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  {form.isSaving
                    ? "Salvando..."
                    : initial
                      ? "Salvar alterações"
                      : "Confirmar dados"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </AnimatedContent>
    </Column>
  );
}
