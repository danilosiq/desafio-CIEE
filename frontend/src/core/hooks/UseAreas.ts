"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAreas,
  createArea,
  updateArea,
  deleteArea,
} from "@/core/services/AreaService";
import type { AreaInput } from "@/core/types/AreaOfExpertise";
import { resumeKeys } from "./UseResumes";
export const areaKeys = { all: ["areas-of-expertise"] as const };
export function useAreas() {
  return useQuery({ queryKey: areaKeys.all, queryFn: listAreas });
}
export function useSaveArea(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: AreaInput) =>
      id ? updateArea({ id, data }) : createArea({ data }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: areaKeys.all }),
        client.invalidateQueries({ queryKey: resumeKeys.all }),
      ]);
    },
  });
}
export function useDeleteArea() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteArea,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: areaKeys.all });
    },
  });
}
