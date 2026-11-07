import { api } from "./Api";
import type { Resume, ResumeInput, ScanResult } from "@/core/types/Resume";

type ResumeListResponse = Resume[] | { items: Resume[] };

export async function listResumes(): Promise<Resume[]> {
  const data = (await api.get<ResumeListResponse>("/resumes")).data;
  return Array.isArray(data) ? data : data.items;
}
export async function getResume({ id }: { id: string }): Promise<Resume> {
  return (await api.get<Resume>(`/resumes/${id}`)).data;
}
export async function createResume({
  data,
}: {
  data: ResumeInput;
}): Promise<Resume> {
  return (await api.post<Resume>("/resumes", data)).data;
}
export async function updateResume({
  id,
  data,
}: {
  id: string;
  data: ResumeInput;
}): Promise<Resume> {
  return (await api.put<Resume>(`/resumes/${id}`, data)).data;
}
export async function scanResume({
  file,
}: {
  file: File;
}): Promise<ScanResult> {
  const data = new FormData();
  data.append("file", file);
  return (await api.post<ScanResult>("/scan", data)).data;
}

export async function deleteResume({ id }: { id: string }): Promise<void> {
  await api.delete(`/resumes/${id}`);
}
