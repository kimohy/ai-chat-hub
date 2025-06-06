"use client"

import { useState } from "react"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    setIsLoading(true)
    const newMessage: Message = { 
      role: "user", 
      content: message,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, newMessage])

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const responseMessage: Message = {
      role: "assistant",
      content: "This is a mock response. In a real application, this would be the AI's response.",
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, responseMessage])
    setIsLoading(false)
  }

  console.log("Current messages:", messages)

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => {
            console.log("Rendering message:", message)
            return (
              <ChatMessage
                key={`${message.role}-${index}`}
                message={message}
              />
            )
          })}
        </div>
      </div>
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  )
} 