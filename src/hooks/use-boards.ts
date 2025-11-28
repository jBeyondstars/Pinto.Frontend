import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi, type CreateBoardRequest, type UpdateBoardRequest, type UpdateCanvasRequest } from "@/lib/api";

export const boardKeys = {
  all: ["boards"] as const,
  detail: (id: string) => ["boards", id] as const,
};

export function useBoards() {
  return useQuery({
    queryKey: boardKeys.all,
    queryFn: boardsApi.getAll,
  });
}

export function useBoard(id: string) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => boardsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoardRequest) => boardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoardRequest }) =>
      boardsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(id) });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => boardsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useUpdateCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCanvasRequest }) =>
      boardsApi.updateCanvas(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(id) });
    },
  });
}
