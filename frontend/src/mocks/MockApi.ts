import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { formatISO } from "date-fns";
import type { Resume, ResumeInput, ScanResult } from "@/core/types/Resume";
import { validatePdf, validateResume } from "@/core/lib/ResumeValidation";
import { readMockAreas, persistMockAreas, resetMockAreas } from "./AreaStore";
import { areaSchema } from "@/core/lib/AreaValidation";
import { SCAN_FIXTURE_NAMES } from "./ScanFixtures";
import { MOCK_STORAGE_KEY, resumeFixtures } from "./ResumeFixtures";
let rows: Resume[] | undefined;
function readRows(): Resume[] {
  if (rows) return rows;
  try {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(MOCK_STORAGE_KEY)
        : null;
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (r) =>
            r &&
            typeof r.id === "string" &&
            typeof r.fullName === "string" &&
            typeof r.email === "string",
        )
      ) {
        rows = parsed.map((row: Resume) => ({
          ...row,
          areaOfExpertiseId: Object.prototype.hasOwnProperty.call(
            row,
            "areaOfExpertiseId",
          )
            ? row.areaOfExpertiseId
            : (readMockAreas().find((area) => area.name === row.areaOfExpertise)
                ?.id ?? null),
        }));
        return rows!;
      }
    }
  } catch {
    /* Sem armazenamento, a demonstração continua em memória. */
  }
  rows = resumeFixtures.map((row) => ({ ...row }));
  return rows;
}
function persist() {
  try {
    if (typeof window !== "undefined")
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* O armazenamento local é opcional na demonstração. */
  }
}
export function resetMockData() {
  rows = undefined;
  resetMockAreas();
  try {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  } catch {
    /* Ambiente sem armazenamento. */
  }
}
function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
) {
  return {
    data,
    status,
    statusText: status < 400 ? "OK" : "Erro na demonstração",
    headers: new AxiosHeaders(),
    config,
  };
}
function fail(
  config: InternalAxiosRequestConfig,
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
): never {
  throw new AxiosError(
    message,
    "MOCK_ERROR",
    config,
    undefined,
    response(config, { message, ...extra }, status),
  );
}
function presentResume(row: Resume): Resume {
  const area = row.areaOfExpertiseId
    ? readMockAreas().find((item) => item.id === row.areaOfExpertiseId)
    : undefined;
  return { ...row, areaOfExpertise: area?.name ?? row.areaOfExpertise };
}
function normalize(data: ResumeInput): ResumeInput {
  return {
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    areaOfExpertise: data.areaOfExpertiseId ? "" : data.areaOfExpertise.trim(),
    areaOfExpertiseId: data.areaOfExpertiseId ?? null,
    professionalSummary: data.professionalSummary.trim(),
  };
}
export const mockApiAdapter: AxiosAdapter = async (config) => {
  const url = config.url ?? "";
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      process.env.NODE_ENV === "test" ? 0 : url === "/scan" ? 1100 : 320,
    ),
  );
  if (url === "/scan" && config.method === "post") {
    const form = config.data as FormData;
    const file = form.get("file");
    if (!(file instanceof File)) return fail(config, 422, "Selecione um PDF.");
    const problem = validatePdf(file);
    if (problem) return fail(config, 422, problem);
    const scenario =
      file.name === SCAN_FIXTURE_NAMES.error
        ? "error"
        : file.name === SCAN_FIXTURE_NAMES.partial
          ? "partial"
          : "success";
    if (scenario === "error")
      return fail(
        config,
        503,
        "Não foi possível ler o PDF. Você pode preencher o formulário manualmente.",
      );
    const result: ScanResult =
      scenario === "partial"
        ? { fullName: null, email: "camila.rocha@example.com", phone: null }
        : {
            fullName: "Camila Rocha",
            email: "camila.rocha@example.com",
            phone: "(11) 99123-4567",
          };
    return response(config, result);
  }
  if (url === "/areas-of-expertise" || url.startsWith("/areas-of-expertise/")) {
    const areas = readMockAreas();
    const areaId = url.startsWith("/areas-of-expertise/")
      ? url.slice("/areas-of-expertise/".length)
      : undefined;
    const index = areas.findIndex((area) => area.id === areaId);
    if (config.method === "get") {
      if (!areaId)
        return response(
          config,
          areas.map((area) => ({ ...area })),
        );
      if (index < 0) return fail(config, 404, "Área não encontrada.");
      return response(config, { ...areas[index] });
    }
    if (config.method === "delete") {
      if (index < 0) return fail(config, 404, "Área não encontrada.");
      if (readRows().some((row) => row.areaOfExpertiseId === areaId))
        return fail(
          config,
          409,
          "Esta área possui candidatos vinculados. Altere a área desses candidatos antes de excluir.",
        );
      areas.splice(index, 1);
      persistMockAreas();
      return response(config, null, 204);
    }
    if (config.method === "post" || config.method === "put") {
      const raw =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      const parsed = areaSchema.safeParse(raw);
      if (!parsed.success)
        return fail(config, 422, "Informe nome e descrição da área.");
      const now = formatISO(new Date());
      if (config.method === "put") {
        if (index < 0) return fail(config, 404, "Área não encontrada.");
        areas[index] = { ...areas[index], ...parsed.data, updatedAt: now };
        persistMockAreas();
        return response(config, { ...areas[index] });
      }
      const created = {
        ...parsed.data,
        id: globalThis.crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      areas.push(created);
      persistMockAreas();
      return response(config, { ...created }, 201);
    }
    return fail(config, 404, "Operação de área não disponível.");
  }
  const entries = readRows();
  const id = url.startsWith("/resumes/") ? url.slice(9) : undefined;
  if (config.method === "delete") {
    const index = entries.findIndex((row) => row.id === id);
    if (index < 0) return fail(config, 404, "Cadastro não encontrado.");
    entries.splice(index, 1);
    persist();
    return response(config, null, 204);
  }
  if (config.method === "get") {
    if (!id) return response(config, entries.map(presentResume));
    const item = entries.find((r) => r.id === id);
    if (!item) return fail(config, 404, "Cadastro não encontrado.");
    return response(config, presentResume(item));
  }
  if (config.method === "post" || config.method === "put") {
    const raw =
      typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    if (
      !raw ||
      [
        "fullName",
        "email",
        "phone",
        "areaOfExpertise",
        "professionalSummary",
      ].some((key) => typeof raw[key] !== "string")
    )
      return fail(config, 422, "Preencha os campos do cadastro.");
    if (
      raw.areaOfExpertiseId != null &&
      (typeof raw.areaOfExpertiseId !== "string" ||
        !readMockAreas().some((area) => area.id === raw.areaOfExpertiseId))
    )
      return fail(config, 422, "Selecione uma área cadastrada ou use Outros.");
    const data = normalize(raw as ResumeInput);
    const errors = validateResume(data);
    if (Object.keys(errors).length)
      return fail(config, 422, "Confira os campos obrigatórios.", { errors });
    const existing = entries.find(
      (r) => r.email.toLowerCase() === data.email && r.id !== id,
    );
    if (existing)
      return fail(config, 409, "Este e-mail já possui um cadastro.", {
        existingId: existing.id,
      });
    const now = formatISO(new Date());
    if (config.method === "put") {
      const index = entries.findIndex((r) => r.id === id);
      if (index < 0) return fail(config, 404, "Cadastro não encontrado.");
      entries[index] = { ...entries[index], ...data, updatedAt: now };
      persist();
      return response(config, presentResume(entries[index]));
    }
    const item: Resume = {
      ...data,
      id: globalThis.crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    entries.unshift(item);
    persist();
    return response(config, presentResume(item), 201);
  }
  return fail(config, 404, "Operação não disponível na demonstração.");
};
