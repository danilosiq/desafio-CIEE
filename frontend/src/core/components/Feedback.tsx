import { AlertCircle, LoaderCircle } from "lucide-react";
import { Column, Text } from "./Primitives";
import { Button } from "@/components/ui/Button";
type LoadingStateProps = { label?: string };
export function LoadingState({
  label = "Carregando cadastros...",
}: LoadingStateProps) {
  return (
    <Column role="status" className="items-center gap-3 py-20">
      <LoaderCircle
        aria-hidden="true"
        className="size-6 animate-spin text-blue-950"
      />
      <Text>{label}</Text>
    </Column>
  );
}
type ErrorStateProps = { message: string; onRetry?: () => void };
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Column role="alert" className="items-center gap-4 py-16 text-center">
      <AlertCircle aria-hidden="true" className="size-8 text-amber-600" />
      <Text>{message}</Text>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </Column>
  );
}
