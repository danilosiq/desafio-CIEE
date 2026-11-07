import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Column, Text } from "@/core/components/Primitives";
type ResumeSubmitErrorProps = {
  error: { message: string; existingId?: string } | null;
};
export function ResumeSubmitError({ error }: ResumeSubmitErrorProps) {
  if (!error) return null;
  return (
    <Column
      role="alert"
      className="gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
    >
      <Text className="text-amber-900">{error.message}</Text>
      {error.existingId && (
        <Link
          href={`/candidatos/${error.existingId}/editar`}
          className="flex items-center gap-2 text-sm font-semibold text-blue-950 underline underline-offset-4"
        >
          Editar cadastro existente
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </Column>
  );
}
