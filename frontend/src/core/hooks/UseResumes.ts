"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  scanResume,
  updateResume,
} from "@/core/services/ResumeService";
export const resumeKeys = {
  all: ["resumes"] as const,
  detail: (id: string) => ["resumes", id] as const,
};
export function useResumes() {
  return useQuery({ queryKey: resumeKeys.all, queryFn: listResumes });
}
export function useResume(id: string) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => getResume({ id }),
    enabled: !!id,
    retry: false,
  });
}
export function useSaveResume(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createResume>[0]["data"]) =>
      id ? updateResume({ id, data }) : createResume({ data }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: resumeKeys.all });
    },
  });
}
export function useScanResume() {
  return useMutation({ mutationFn: scanResume });
}

export function useDeleteResume() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteResume,
    onSuccess: async (_, { id }) => {
      client.setQueryData<Awaited<ReturnType<typeof listResumes>>>(
        resumeKeys.all,
        (rows) => rows?.filter((row) => row.id !== id),
      );
      await client.invalidateQueries({ queryKey: resumeKeys.all, exact: true });
    },
  });
}
