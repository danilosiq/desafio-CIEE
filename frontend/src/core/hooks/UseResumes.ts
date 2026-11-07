"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  scanResume,
  updateResume,
  type ResumeListPage,
} from "@/core/services/ResumeService";

export const resumeKeys = {
  all: ["resumes"] as const,
  detail: (id: string) => ["resumes", id] as const,
};

export function useResumes(limit = 30) {
  return useInfiniteQuery({
    queryKey: resumeKeys.all,
    queryFn: ({ pageParam }) => listResumes({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
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
      client.setQueryData<InfiniteData<ResumeListPage>>(resumeKeys.all, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.filter((row) => row.id !== id),
                total: Math.max(0, page.total - 1),
              })),
            }
          : data,
      );
      await client.invalidateQueries({ queryKey: resumeKeys.all });
    },
  });
}
