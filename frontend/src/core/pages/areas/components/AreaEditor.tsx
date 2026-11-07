"use client";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Column, Text } from "@/core/components/Primitives";
import { areaSchema } from "@/core/lib/AreaValidation";
import { getApiError } from "@/core/lib/ApiError";
import { useSaveArea } from "@/core/hooks/UseAreas";
import type { AreaInput, AreaOfExpertise } from "@/core/types/AreaOfExpertise";
type AreaEditorProps = {
  initial?: AreaOfExpertise;
  onSaved: () => void;
  onCancel: () => void;
};
export function AreaEditor({ initial, onSaved, onCancel }: AreaEditorProps) {
  const id = useId();
  const mutation = useSaveArea(initial?.id);
  const form = useForm<AreaInput>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
    },
  });
  const save = form.handleSubmit(async (data) => {
    try {
      await mutation.mutateAsync(data);
      onSaved();
    } catch {
      /* O erro é apresentado abaixo preservando os campos. */
    }
  });
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <fieldset
        disabled={mutation.isPending}
        className="grid min-w-0 gap-5 p-5 sm:p-6"
      >
        <legend className="sr-only">Dados da área de atuação</legend>
        <Column className="gap-2">
          <label
            htmlFor={`${id}-name`}
            className="text-sm font-medium text-slate-700"
          >
            Nome da área *
          </label>
          <Input
            id={`${id}-name`}
            {...form.register("name")}
            required
            placeholder="Ex.: Educação"
            aria-invalid={!!form.formState.errors.name}
            aria-describedby={
              form.formState.errors.name ? `${id}-name-error` : undefined
            }
          />
          {form.formState.errors.name && (
            <Text
              role="alert"
              id={`${id}-name-error`}
              className="text-xs text-red-700"
            >
              {form.formState.errors.name.message}
            </Text>
          )}
        </Column>
        <Column className="gap-2">
          <label
            htmlFor={`${id}-description`}
            className="text-sm font-medium text-slate-700"
          >
            Descrição da área *
          </label>
          <Textarea
            id={`${id}-description`}
            {...form.register("description")}
            required
            placeholder="Descreva o que esta categoria abrange"
            aria-invalid={!!form.formState.errors.description}
            aria-describedby={
              form.formState.errors.description
                ? `${id}-description-error`
                : undefined
            }
          />
          {form.formState.errors.description && (
            <Text
              role="alert"
              id={`${id}-description-error`}
              className="text-xs text-red-700"
            >
              {form.formState.errors.description.message}
            </Text>
          )}
        </Column>
        {mutation.isError && (
          <Text role="alert" className="text-sm text-red-700">
            {getApiError(mutation.error).message}
          </Text>
        )}
      </fieldset>
      <div className="sticky bottom-0 isolate z-10 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white p-5 sm:px-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {mutation.isPending ? "Salvando..." : "Salvar área"}
        </Button>
      </div>
    </form>
  );
}
