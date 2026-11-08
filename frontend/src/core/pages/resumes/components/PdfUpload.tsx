"use client";
import { useId, useRef } from "react";
import {
  FileText,
  UploadCloud,
  Sparkles,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Column, Row, Text, Title } from "@/core/components/Primitives";
import { cn } from "@/core/lib/Utils";
type PdfUploadProps = {
  compact?: boolean;
  file: File | null;
  error: string;
  isScanning: boolean;
  onFile: (file: File | null) => void;
  onExtract: () => void;
};
export function PdfUpload({
  compact = false,
  file,
  error,
  isScanning,
  onFile,
  onExtract,
}: PdfUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  return (
    <Column className="gap-5">
      {!compact && (
        <Row className="items-start gap-3">
          <Sparkles
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-blue-950"
          />
          <Column className="gap-1">
            <Title as="h2" className="text-sm text-blue-950">
              Preencha automaticamente via PDF
            </Title>
            <Text className="text-xs">
              Opcional · PDFs precisam ter texto selecionável. Revise os dados
              antes de confirmar.
            </Text>
          </Column>
        </Row>
      )}
      <input
        ref={input}
        id={id}
        aria-label="Selecionar currículo em PDF"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {isScanning ? (
        <Column
          role="status"
          className="min-h-64 items-center justify-center gap-5 text-center"
        >
          <LoaderCircle
            aria-hidden="true"
            className="size-12 animate-spin text-blue-950 motion-reduce:animate-none"
          />
          <Column className="gap-1">
            <Title as="h3" className="text-base text-blue-950">
              Lendo seu currículo
            </Title>
            <Text className="text-sm">Processando o arquivo...</Text>
            <Text className="text-xs">
              Aguarde para revisar os dados encontrados.
            </Text>
          </Column>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFile(null)}
            aria-label="Remover PDF"
          >
            Cancelar leitura
          </Button>
        </Column>
      ) : (
        <>
          {file ? (
            <Column
              className={cn(
                "relative min-h-44 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-7 py-6 text-center",
                compact && "min-h-32 gap-2 px-6 py-4",
              )}
            >
              <Button
                className="absolute right-2 top-2 text-slate-500"
                variant="ghost"
                size="icon"
                aria-label="Remover PDF"
                onClick={() => onFile(null)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-950",
                  compact && "size-10",
                )}
              >
                <FileText aria-hidden="true" className="size-6" />
              </span>
              <Column className="w-full gap-1">
                <Text className="break-all font-medium text-slate-800">
                  {file.name}
                </Text>
                <Text className="text-xs">
                  {file.size >= 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} MB`
                    : `${Math.max(1, Math.ceil(file.size / 1024))} KB`}
                </Text>
              </Column>
            </Column>
          ) : (
            <label
              htmlFor={id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onFile(event.dataTransfer.files[0] ?? null);
              }}
              className={cn(
                "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-center transition hover:border-blue-500 hover:bg-blue-50",
                compact && "min-h-40",
              )}
            >
              <UploadCloud
                aria-hidden="true"
                className="size-8 text-blue-900"
              />
              <span className="text-sm font-medium leading-6 text-blue-950">
                Clique ou arraste o currículo aqui
              </span>
              <span className="text-xs text-slate-500">PDF de até 5 MB</span>
            </label>
          )}
          <Column className="gap-2">
            {file ? (
              <>
                <Button variant="ghost" onClick={() => input.current?.click()}>
                  Escolher outro arquivo
                </Button>
                <Button onClick={onExtract} disabled={!!error}>
                  Processar dados
                </Button>
              </>
            ) : (
              <Button onClick={() => input.current?.click()}>
                Selecionar arquivo
              </Button>
            )}
          </Column>
        </>
      )}
      {error && (
        <Text
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </Text>
      )}
    </Column>
  );
}
