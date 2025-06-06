"use client"

import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"
import { useEffect } from "react"

export interface ChatMessageProps {
  message: {
    role: "user" | "assistant"
    content: string
    timestamp?: Date
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  useEffect(() => {
    console.log("ChatMessage rendered:", message)
  }, [message])

  if (!message?.role || !message?.content) {
    console.error("Invalid message received:", message)
    return null
  }

  return (
    <div className={cn(
      "flex items-start gap-4 p-4",
      message.role === "user" ? "justify-end" : "justify-start"
    )}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className={cn(
          "rounded-lg p-3",
          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <p className="text-sm">{message.content}</p>
          {message.timestamp && (
            <p className="mt-1 text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 
