"use client";
import { useIsMobile } from "@/core/hooks/UseIsMobile";
import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/core/components/ResponsiveDialog";
import { ResumeForm } from "./ResumeForm";
type CreateResumeDialogProps = {
  mode: "manual" | "pdf";
  open: boolean;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
};
export function CreateResumeDialog({
  mode,
  open,
  onClose,
  returnFocusTo,
}: CreateResumeDialogProps) {
  const router = useRouter();
  const mobile = useIsMobile();
  return (
    <ResponsiveDialog
      open={open}
      wide
      returnFocusTo={returnFocusTo}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        mode === "pdf" ? "Adicionar candidato por PDF" : "Adicionar candidato"
      }
      description={
        mobile
          ? "Revise os dados antes de confirmar."
          : mode === "pdf"
            ? "Envie o currículo e revise os dados antes de concluir."
            : "Preencha os dados do candidato. O PDF não é obrigatório."
      }
    >
      <ResumeForm
        showPdf={!mobile || mode === "pdf"}
        mobileSteps={mode === "pdf"}
        onCancel={onClose}
        onSaved={(resume) => {
          onClose();
          router.push(`/candidatos/${resume.id}?salvo=1`);
        }}
      />
    </ResponsiveDialog>
  );
}
