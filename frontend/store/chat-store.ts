import { create } from "zustand"

export interface Message {
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  addMessage: (message: Message) => void
  setLoading: (isLoading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
})) 