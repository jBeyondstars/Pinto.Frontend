import { create } from "zustand";

interface BoardUIState {
  isCreateDialogOpen: boolean;
  editingBoardId: string | null;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  setEditingBoard: (id: string | null) => void;
}

export const useBoardUIStore = create<BoardUIState>((set) => ({
  isCreateDialogOpen: false,
  editingBoardId: null,
  openCreateDialog: () => set({ isCreateDialogOpen: true }),
  closeCreateDialog: () => set({ isCreateDialogOpen: false }),
  setEditingBoard: (id) => set({ editingBoardId: id }),
}));
