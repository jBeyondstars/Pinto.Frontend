const API_BASE = "http://localhost:5150/api";

export interface Board {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
}

export interface UpdateBoardRequest {
  name: string;
  description?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const boardsApi = {
  getAll: async (): Promise<Board[]> => {
    const response = await fetch(`${API_BASE}/boards`);
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Board> => {
    const response = await fetch(`${API_BASE}/boards/${id}`);
    return handleResponse(response);
  },

  create: async (data: CreateBoardRequest): Promise<Board> => {
    const response = await fetch(`${API_BASE}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: UpdateBoardRequest): Promise<Board> => {
    const response = await fetch(`${API_BASE}/boards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },
};
