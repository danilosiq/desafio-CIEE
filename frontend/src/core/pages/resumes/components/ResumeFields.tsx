"use client";
import { useId } from "react";
import {
  UserRound,
  AlignLeft,
  BriefcaseBusiness,
  Mail,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Column, Text, Title } from "@/core/components/Primitives";
import { useAreas } from "@/core/hooks/UseAreas";
import type { ResumeFormState } from "@/core/hooks/UseResumeForm";
type ResumeFieldsProps = { form: ResumeFormState };
type ResumeFieldProps = ResumeFieldsProps & {
  name: "fullName" | "email" | "phone";
  id: string;
};
const inputFields = {
  fullName: {
    label: "Nome completo",
    placeholder: "Ex.: Maria Oliveira",
    type: "text",
    autoComplete: "name",
    Icon: UserRound,
    required: true,
  },
  email: {
    label: "E-mail",
    placeholder: "nome@exemplo.com",
    type: "email",
    autoComplete: "email",
    Icon: Mail,
    required: true,
  },
  phone: {
    label: "Telefone",
    placeholder: "(11) 99999-9999",
    type: "tel",
    autoComplete: "tel",
    Icon: Phone,
    required: false,
  },
};
function ResumeField({ form, name, id }: ResumeFieldProps) {
  const field = inputFields[name];
  return (
    <Column className="gap-2">
      <label
        htmlFor={`${id}-${name}`}
        className="flex items-center gap-2 text-xs font-medium text-slate-700"
      >
        <field.Icon aria-hidden="true" className="size-4 text-slate-500" />
        {field.label}
        {field.required && <span className="text-blue-800">*</span>}
      </label>
      <Input
        {...form.register(name)}
        id={`${id}-${name}`}
        type={field.type}
        autoComplete={field.autoComplete}
        required={field.required}
        value={form.values[name]}
        onChange={(event) => form.change(name, event.target.value)}
        placeholder={field.placeholder}
        aria-invalid={!!form.errors[name]}
        aria-describedby={form.errors[name] ? `${id}-${name}-error` : undefined}
      />
      {form.errors[name] && (
        <Text
          id={`${id}-${name}-error`}
          role="alert"
          className="text-xs text-red-700"
        >
          {form.errors[name]}
        </Text>
      )}
    </Column>
  );
}
export function ResumeAreaField({ form }: ResumeFieldsProps) {
  const id = useId();
  const query = useAreas();
  const areas = [...(query.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const other = form.values.areaChoice === "__other";
  return (
    <Column className="gap-2">
      <label
        htmlFor={`${id}-select`}
        className="flex items-center gap-2 text-xs font-medium text-slate-700"
      >
        <BriefcaseBusiness
          aria-hidden="true"
          className="size-4 text-slate-500"
        />
        Área de atuação
      </label>
      <select
        id={`${id}-select`}
        value={form.values.areaChoice}
        disabled={query.isPending}
        onChange={(event) => form.chooseArea(event.target.value)}
        className="h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-blue-800 disabled:opacity-50"
      >
        <option value="">
          {query.isPending ? "Carregando áreas..." : "Nenhuma área selecionada"}
        </option>
        {form.initialArea &&
          form.values.areaChoice === form.initialArea.id &&
          !areas.some((area) => area.id === form.initialArea!.id) && (
            <option value={form.initialArea.id}>{form.initialArea.name}</option>
          )}
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
        <option value="__other">Outros</option>
      </select>
      {query.isError && (
        <Text role="status" className="text-xs">
          Não foi possível listar as áreas. Você pode usar Outros.
        </Text>
      )}
      {other && (
        <>
          <label
            htmlFor={`${id}-custom`}
            className="mt-1 text-xs font-medium text-slate-700"
          >
            Informe a área de atuação
          </label>
          <Input
            {...form.register("areaOfExpertise")}
            id={`${id}-custom`}
            required
            value={form.values.areaOfExpertise}
            onChange={(event) =>
              form.change("areaOfExpertise", event.target.value)
            }
            placeholder="Escreva a área de atuação"
            aria-invalid={!!form.errors.areaOfExpertise}
            aria-describedby={
              form.errors.areaOfExpertise ? `${id}-error` : undefined
            }
          />
          {form.errors.areaOfExpertise && (
            <Text
              id={`${id}-error`}
              role="alert"
              className="text-xs text-red-700"
            >
              {form.errors.areaOfExpertise}
            </Text>
          )}
        </>
      )}
    </Column>
  );
}
export function ResumeFields({ form }: ResumeFieldsProps) {
  const id = useId();
  return (
    <fieldset disabled={form.isSaving} className="grid min-w-0 gap-4">
      <legend className="sr-only">Dados do candidato</legend>
      <ResumeField form={form} name="fullName" id={id} />
      <Column className="gap-2">
        <label
          htmlFor={`${id}-summary`}
          className="flex items-center gap-2 text-xs font-medium text-slate-700"
        >
          <AlignLeft aria-hidden="true" className="size-4 text-slate-500" />
          Resumo profissional
        </label>
        <Textarea
          {...form.register("professionalSummary")}
          id={`${id}-summary`}
          value={form.values.professionalSummary}
          onChange={(event) =>
            form.change("professionalSummary", event.target.value)
          }
          placeholder="Conte sobre a trajetória e os objetivos profissionais..."
          className="min-h-28"
        />
      </Column>
      <ResumeAreaField form={form} />
      <Column className="gap-4 border-t border-slate-200 pt-4">
        <Title as="h3" className="text-xs font-medium text-slate-600">
          Contatos
        </Title>
        <ResumeField form={form} name="email" id={id} />
        <ResumeField form={form} name="phone" id={id} />
      </Column>
    </fieldset>
  );
}
