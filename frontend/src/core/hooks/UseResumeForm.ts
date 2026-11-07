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
import { getApiError } from "@/core/lib/ApiError";
import { useSaveResume, useScanResume } from "./UseResumes";
import type {
  Resume,
  ResumeErrors,
  ResumeFormValues,
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
        interestArea: initial.areaOfExpertiseId ? "" : initial.interestArea,
        areaOfExpertiseId: initial.areaOfExpertiseId ?? null,
        areaChoice:
          initial.areaOfExpertiseId ?? (initial.interestArea ? "__other" : ""),
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
    setValue,
    getFieldState,
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
  const [isScanning, setIsScanning] = useState(false);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const save = useSaveResume(initial?.id);
  const scan = useScanResume();
  function change(name: keyof ResumeFormValues, value: string) {
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
    setIsScanning(true);
    setFileError("");
    try {
      const result = await scan.mutateAsync({ file });
      if (ticket !== generation.current) return false;
      for (const name of ["fullName", "email", "phone"] as const) {
        if (!getFieldState(name).isDirty && result[name])
          setValue(
            name,
            name === "phone" ? formatPhone(result[name]!) : result[name]!,
            { shouldValidate: formState.isSubmitted },
          );
      }
      return true;
    } catch (error) {
      if (ticket === generation.current)
        setFileError(getApiError(error).message);
      return false;
    } finally {
      if (ticket === generation.current) setIsScanning(false);
    }
  }
  const submit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const { areaChoice, ...input } = data;
      const result = await save.mutateAsync({
        ...input,
        areaOfExpertiseId:
          areaChoice && areaChoice !== "__other" ? areaChoice : null,
        interestArea: areaChoice === "__other" ? input.interestArea : "",
      });
      setSaved(true);
      onSaved?.(result);
    } catch (error) {
      setSubmitError(getApiError(error));
    }
  });
  function resetForm() {
    reset(defaults);
    setSubmitError(null);
    setSaved(false);
  }
  function clearForm() {
    reset({ ...EMPTY_RESUME, areaOfExpertiseId: null, areaChoice: "" });
    setSubmitError(null);
    setSaved(false);
  }
  return {
    values,
    initialArea: initial?.areaOfExpertiseId
      ? { id: initial.areaOfExpertiseId, name: initial.interestArea }
      : null,
    errors,
    register,
    change,
    chooseArea,
    file,
    fileError,
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
