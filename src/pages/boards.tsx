import { useState } from "react";
import { Link } from "react-router";
import { Plus, Pencil, Trash2, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBoards, useCreateBoard, useDeleteBoard } from "@/hooks/use-boards";

export function BoardsPage() {
  const { data: boards, isLoading, error } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newBoardName.trim()) return;
    await createBoard.mutateAsync({ name: newBoardName.trim() });
    setNewBoardName("");
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this board?")) {
      await deleteBoard.mutateAsync(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Pinto
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Boards</h1>
            <p className="text-muted-foreground">
              Create and manage your whiteboards
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Board
          </Button>
        </div>

        {isCreating && (
          <div className="mb-6 p-4 border rounded-lg bg-card">
            <h3 className="font-medium mb-3">Create New Board</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name"
                className="flex-1 px-3 py-2 border rounded-md bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={createBoard.isPending}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading boards...
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-destructive">
            Failed to load boards. Make sure the backend is running.
          </div>
        )}

        {boards && boards.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first whiteboard to get started
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>
        )}

        {boards && boards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    to={`/board/${board.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {board.name}
                  </Link>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link to={`/board/${board.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(board.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {board.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {board.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
