"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EMPTY_RESUME,
  formatPhone,
  resumeFormSchema,
  validatePdf,
} from "@/core/lib/ResumeValidation";
import { selectScanSuggestions } from "@/core/lib/SelectScanSuggestions";
import { getApiError } from "@/core/lib/ApiError";
import { useSaveResume, useScanResume } from "./UseResumes";
import type {
  Resume,
  ResumeErrors,
  ResumeFormValues,
  ScanResult,
} from "@/core/types/Resume";
type UseResumeFormProps = {
  initial?: Resume;
  onSaved?: (resume: Resume) => void;
};
export function useResumeForm({ initial, onSaved }: UseResumeFormProps) {
  const defaults: ResumeFormValues = initial
    ? {
        fullName: initial.fullName,
        email: initial.email,
        phone: formatPhone(initial.phone),
        areaOfExpertise: initial.areaOfExpertiseId
          ? ""
          : initial.areaOfExpertise,
        areaOfExpertiseId: initial.areaOfExpertiseId ?? null,
        areaChoice:
          initial.areaOfExpertiseId ??
          (initial.areaOfExpertise ? "__other" : ""),
        professionalSummary: initial.professionalSummary,
      }
    : { ...EMPTY_RESUME, areaOfExpertiseId: null, areaChoice: "" };
  const methods = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const {
    register,
    watch,
    getValues,
    setValue,
    handleSubmit,
    reset,
    formState,
  } = methods;
  const values = watch();
  const errors: ResumeErrors = {};
  for (const key of Object.keys(defaults) as (keyof ResumeFormValues)[]) {
    if (formState.errors[key]?.message)
      errors[key] = formState.errors[key]!.message;
  }
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState<{
    message: string;
    existingId?: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const generation = useRef(0);
  const scanController = useRef<AbortController | null>(null);
  const editedFields = useRef(
    new Set<keyof ResumeFormValues>(
      initial
        ? (["fullName", "email", "phone"] as const).filter(
            (name) => !!initial[name],
          )
        : [],
    ),
  );
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  useEffect(
    () => () => {
      generation.current++;
      scanController.current?.abort();
    },
    [],
  );
  const save = useSaveResume(initial?.id);
  const scan = useScanResume();
  function change(name: keyof ResumeFormValues, value: string) {
    editedFields.current.add(name);
    setValue(name, name === "phone" ? formatPhone(value) : value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: formState.isSubmitted,
    });
    setSubmitError(null);
    setSaved(false);
  }
  function chooseArea(value: string) {
    setValue("areaChoice", value, {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted,
    });
    setValue("areaOfExpertiseId", value && value !== "__other" ? value : null, {
      shouldDirty: true,
    });
    setSubmitError(null);
    setSaved(false);
  }
  function pickFile(next: File | null) {
    generation.current++;
    scanController.current?.abort();
    scanController.current = null;
    setScanResult(null);
    setIsScanning(false);
    setFile(next);
    setFileError(next ? (validatePdf(next) ?? "") : "");
  }
  async function extract() {
    if (!file) return false;
    const problem = validatePdf(file);
    if (problem) {
      setFileError(problem);
      return false;
    }
    const ticket = ++generation.current;
    scanController.current?.abort();
    const controller = new AbortController();
    scanController.current = controller;
    setScanResult(null);
    setIsScanning(true);
    setFileError("");
    try {
      const result = await scan.mutateAsync({
        file,
        signal: controller.signal,
      });
      if (ticket !== generation.current) return false;
      setScanResult(result);
      const suggestions = selectScanSuggestions(
        result,
        editedFields.current,
        getValues(),
      );
      for (const name of ["fullName", "email", "phone"] as const) {
        if (suggestions[name]) {
          const value =
            name === "phone"
              ? formatPhone(suggestions[name]!)
              : suggestions[name]!;
          setValue(name, value, { shouldValidate: formState.isSubmitted });
        }
      }
      return true;
    } catch (error) {
      if (ticket === generation.current)
        setFileError(getApiError(error).message);
      return false;
    } finally {
      if (ticket === generation.current) {
        scanController.current = null;
        setIsScanning(false);
      }
    }
  }
  const submit = handleSubmit(async (data) => {
    setSubmitError(null);
    generation.current++;
    scanController.current?.abort();
    scanController.current = null;
    setIsScanning(false);
    try {
      const { areaChoice, ...input } = data;
      const result = await save.mutateAsync({
        ...input,
        areaOfExpertiseId:
          areaChoice && areaChoice !== "__other" ? areaChoice : null,
        areaOfExpertise: areaChoice === "__other" ? input.areaOfExpertise : "",
      });
      setSaved(true);
      onSaved?.(result);
    } catch (error) {
      setSubmitError(getApiError(error));
    }
  });
  function resetForm() {
    editedFields.current.clear();
    reset(defaults);
    setSubmitError(null);
    setSaved(false);
  }
  function clearForm() {
    editedFields.current.clear();
    reset({ ...EMPTY_RESUME, areaOfExpertiseId: null, areaChoice: "" });
    setSubmitError(null);
    setSaved(false);
  }
  return {
    values,
    initialArea: initial?.areaOfExpertiseId
      ? { id: initial.areaOfExpertiseId, name: initial.areaOfExpertise }
      : null,
    errors,
    register,
    change,
    chooseArea,
    file,
    fileError,
    scanResult,
    pickFile,
    extract,
    isScanning,
    submit,
    isSaving: save.isPending || formState.isSubmitting,
    submitError,
    saved,
    resetForm,
    clearForm,
    isDirty: formState.isDirty,
  };
}

export type ResumeFormState = ReturnType<typeof useResumeForm>;
