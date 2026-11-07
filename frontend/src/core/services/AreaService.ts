import { api } from "./Api";
import type { AreaInput, AreaOfExpertise } from "@/core/types/AreaOfExpertise";
export async function listAreas(): Promise<AreaOfExpertise[]> {
  return (await api.get<AreaOfExpertise[]>("/areas-of-expertise")).data;
}
export async function getArea({
  id,
}: {
  id: string;
}): Promise<AreaOfExpertise> {
  return (await api.get<AreaOfExpertise>(`/areas-of-expertise/${id}`)).data;
}
export async function createArea({
  data,
}: {
  data: AreaInput;
}): Promise<AreaOfExpertise> {
  return (await api.post<AreaOfExpertise>("/areas-of-expertise", data)).data;
}
export async function updateArea({
  id,
  data,
}: {
  id: string;
  data: AreaInput;
}): Promise<AreaOfExpertise> {
  return (await api.put<AreaOfExpertise>(`/areas-of-expertise/${id}`, data))
    .data;
}
export async function deleteArea({ id }: { id: string }): Promise<void> {
  await api.delete(`/areas-of-expertise/${id}`);
}
