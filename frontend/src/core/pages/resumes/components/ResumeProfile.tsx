"use client";
import Link from "next/link";
import { useId } from "react";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  LoaderCircle,
  Check,
  Undo2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ResumeSubmitError } from "./ResumeSubmitError";
import { useResumeForm } from "@/core/hooks/UseResumeForm";
import { ResumeAreaField } from "./ResumeFields";
import { formatPhone } from "@/core/lib/ResumeValidation";
import type { Resume, ResumeInput } from "@/core/types/Resume";
import { Column, Row, Panel, Text, Title } from "@/core/components/Primitives";
type ResumeProfileProps = {
  resume: Resume;
  editing?: boolean;
  onSaved?: (resume: Resume) => void;
};
const labels: Record<
  Exclude<keyof ResumeInput, "areaOfExpertiseId">,
  string
> = {
  fullName: "Nome completo",
  email: "E-mail",
  phone: "Telefone",
  interestArea: "Área ou cargo de interesse",
  professionalSummary: "Resumo profissional",
};
export function ResumeProfile({
  resume,
  editing = false,
  onSaved,
}: ResumeProfileProps) {
  const form = useResumeForm({ initial: resume, onSaved });
  const id = useId();
  function input(name: keyof typeof labels, extra = "") {
    return (
      <Column className={extra}>
        <label className="sr-only" htmlFor={`${id}-${name}`}>
          {labels[name]}
        </label>
        <Input
          {...form.register(name)}
          id={`${id}-${name}`}
          type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
          required={name === "fullName" || name === "email"}
          value={form.values[name]}
          placeholder={labels[name]}
          aria-invalid={!!form.errors[name]}
          aria-describedby={
            form.errors[name] ? `${id}-${name}-error` : undefined
          }
          onChange={(e) => form.change(name, e.target.value)}
          className={
            name === "fullName"
              ? "h-12 text-lg font-semibold text-blue-950"
              : "text-sm"
          }
        />
        {form.errors[name] && (
          <Text
            id={`${id}-${name}-error`}
            role="alert"
            className="mt-1 text-xs text-red-700"
          >
            {form.errors[name]}
          </Text>
        )}
      </Column>
    );
  }
  return (
    <form
      id="resume-profile-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void form.submit();
      }}
    >
      <Column className="gap-5">
        {editing && (
          <Row className="flex-wrap justify-between gap-3">
            <Link
              href={`/candidatos/${resume.id}`}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-950"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Voltar aos detalhes
            </Link>
            <Row className="gap-2">
              <Button
                variant="ghost"
                onClick={form.resetForm}
                disabled={form.isSaving}
              >
                <Undo2 aria-hidden="true" />
                Desfazer
              </Button>
              <Button type="submit" disabled={form.isSaving}>
                {form.isSaving ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Check />
                )}
                {form.isSaving ? "Salvando..." : "Concluir"}
              </Button>
            </Row>
          </Row>
        )}
        <fieldset
          disabled={form.isSaving}
          className="grid min-w-0 items-start gap-5 md:grid-cols-[290px_minmax(0,1fr)]"
        >
          <legend className="sr-only">
            {editing
              ? "Editar informações do candidato"
              : "Informações do candidato"}
          </legend>
          <Panel className="p-5 sm:p-6">
            <Column className="gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                <UserRound aria-hidden="true" className="size-6" />
              </span>
              {editing ? (
                <Column className="gap-3">
                  {input("fullName")}
                  <ResumeAreaField form={form} />
                </Column>
              ) : (
                <Column className="gap-2">
                  <Title className="break-words text-2xl leading-tight text-blue-950">
                    {resume.fullName}
                  </Title>
                  <span className="w-fit max-w-full rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900">
                    {resume.interestArea || "Área não informada"}
                  </span>
                </Column>
              )}
              <Column className="gap-4 border-t border-slate-100 pt-4">
                <Row className="items-start gap-2.5">
                  <Mail
                    aria-hidden="true"
                    className="mt-3 size-4 shrink-0 text-slate-400"
                  />
                  {editing ? (
                    input("email", "w-full")
                  ) : (
                    <Column>
                      <Text className="text-[11px]">E-mail</Text>
                      <a
                        className="break-all text-sm text-slate-700 hover:underline"
                        href={`mailto:${resume.email}`}
                      >
                        {resume.email}
                      </a>
                    </Column>
                  )}
                </Row>
                <Row className="items-start gap-2.5">
                  <Phone
                    aria-hidden="true"
                    className="mt-3 size-4 shrink-0 text-slate-400"
                  />
                  {editing ? (
                    input("phone", "w-full")
                  ) : (
                    <Column>
                      <Text className="text-[11px]">Telefone</Text>
                      <Text className="text-sm text-slate-700">
                        {formatPhone(resume.phone) || "Não informado"}
                      </Text>
                    </Column>
                  )}
                </Row>
              </Column>
            </Column>
          </Panel>
          <Column className="gap-5">
            <Panel className="min-h-44 p-5 sm:p-6">
              <Row className="mb-4 gap-2">
                <BriefcaseBusiness
                  aria-hidden="true"
                  className="size-4 text-blue-900"
                />
                <Title as="h2" className="text-base text-blue-950">
                  Resumo
                </Title>
              </Row>
              {editing ? (
                <>
                  <label
                    htmlFor={`${id}-professionalSummary`}
                    className="sr-only"
                  >
                    Resumo profissional
                  </label>
                  <Textarea
                    {...form.register("professionalSummary")}
                    id={`${id}-professionalSummary`}
                    value={form.values.professionalSummary}
                    onChange={(e) =>
                      form.change("professionalSummary", e.target.value)
                    }
                    className="min-h-36"
                    placeholder="Conte sobre a trajetória e os objetivos profissionais..."
                  />
                </>
              ) : (
                <Text className="whitespace-pre-wrap leading-7 text-slate-600">
                  {resume.professionalSummary ||
                    "O candidato ainda não possui um resumo profissional."}
                </Text>
              )}
            </Panel>
            <Panel className="p-5 sm:p-6">
              <Row className="flex-wrap gap-x-12 gap-y-4">
                <Row className="gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-slate-400"
                  />
                  <Column>
                    <Text className="text-[11px]">Criado em</Text>
                    <Text className="text-xs font-medium text-slate-700">
                      {format(
                        parseISO(resume.createdAt),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR },
                      )}
                    </Text>
                  </Column>
                </Row>
                <Column>
                  <Text className="text-[11px]">Última atualização</Text>
                  <Text className="text-xs font-medium text-slate-700">
                    {format(
                      parseISO(resume.updatedAt),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </Text>
                </Column>
              </Row>
            </Panel>
          </Column>
        </fieldset>
        <ResumeSubmitError error={form.submitError} />
      </Column>
    </form>
  );
}
