import { api } from "./Api";
import { normalizeResume, type ApiResume } from "./ResumeMapper";
import type { Resume, ResumeInput, ScanResult } from "@/core/types/Resume";

export type ResumeListPage = {
  items: Resume[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ResumeListResponse =
  (Omit<ResumeListPage, "items"> & { items: ApiResume[] }) | ApiResume[];

export async function listResumes({
  page = 1,
  limit = 30,
  search,
  areaOfExpertiseId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  areaOfExpertiseId?: string;
} = {}): Promise<ResumeListPage> {
  const q = search?.trim();
  const area = areaOfExpertiseId?.trim();
  const data = (
    await api.get<ResumeListResponse>("/resumes", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(area ? { areaOfExpertiseId: area } : {}),
      },
    })
  ).data;
  if (Array.isArray(data))
    return {
      items: data.map(normalizeResume),
      page,
      limit,
      total: data.length,
      totalPages: 1,
    };
  return { ...data, items: data.items.map(normalizeResume) };
}
export async function getResume({ id }: { id: string }): Promise<Resume> {
  return normalizeResume((await api.get<ApiResume>(`/resumes/${id}`)).data);
}
export async function createResume({
  data,
}: {
  data: ResumeInput;
}): Promise<Resume> {
  return normalizeResume((await api.post<ApiResume>("/resumes", data)).data);
}
export async function updateResume({
  id,
  data,
}: {
  id: string;
  data: ResumeInput;
}): Promise<Resume> {
  return normalizeResume(
    (await api.put<ApiResume>(`/resumes/${id}`, data)).data,
  );
}
export async function scanResume({
  file,
  signal,
}: {
  file: File;
  signal?: AbortSignal;
}): Promise<ScanResult> {
  const data = new FormData();
  data.append("file", file);
  return (await api.post<ScanResult>("/scan", data, { signal })).data;
}

export async function deleteResume({ id }: { id: string }): Promise<void> {
  await api.delete(`/resumes/${id}`);
}
