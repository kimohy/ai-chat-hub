"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Message, Conversation } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversation } from '@/components/layout/main-layout';

export default function ChatsPage() {
  const router = useRouter();
  const { currentConversation } = useConversation();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollAreaRef.current && currentConversation?.messages) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [currentConversation?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentConversation) return;

    setIsLoading(true);
    setError('');

    try {
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      // Add user message to conversation
      await apiClient.addMessage(currentConversation.id, userMessage);
      
      // Send message to AI with complete conversation history
      const response = await apiClient.sendMessage({
        messages: [...currentConversation.messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1000
      });

      // Create AI message
      const aiMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      // Add AI message to conversation
      await apiClient.addMessage(currentConversation.id, aiMessage);
      
      // Clear input
      setMessage('');

      // Update current conversation with new messages
      const updatedConversation = await apiClient.getConversation(currentConversation.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('conversationUpdated', {
          detail: { conversationId: currentConversation.id }
        }));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation or create a new one
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Card className="flex-1 m-4">
        <CardHeader>
          <CardTitle>{currentConversation.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]" ref={scrollAreaRef}>
            {currentConversation.messages.map((msg: Message, index: number) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.timestamp && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
} 