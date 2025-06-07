"use client"

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, LayoutDashboard, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';

interface ConversationContextType {
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isChatsPage = pathname === '/chats';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadConversations();

    // Listen for conversation updates
    const handleConversationUpdate = async (event: CustomEvent) => {
      const { conversationId } = event.detail;
      if (conversationId === currentConversation?.id) {
        // Update only the current conversation
        const updatedConversation = await apiClient.getConversation(conversationId);
        setCurrentConversation(updatedConversation);
      }
      // Reload conversations list
      loadConversations();
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate as EventListener);
    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate as EventListener);
    };
  }, [router, currentConversation?.id]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.listConversations();
      setConversations(data);
      
      // If we're on the chats page, handle current conversation
      if (isChatsPage) {
        if (currentConversation) {
          // Find and update the current conversation
          const updatedConversation = data.find(c => c.id === currentConversation.id);
          if (updatedConversation) {
            setCurrentConversation(updatedConversation);
          }
        } else if (data.length > 0) {
          // If no conversation is selected, select the first one
          setCurrentConversation(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      setIsLoading(true);
      const conversation = await apiClient.createConversation('New Conversation');
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConversationContext.Provider value={{ currentConversation, setCurrentConversation }}>
      <div className="flex h-screen bg-background">
        {/* Left Sidebar - All Navigation */}
        <div className="w-64 border-r bg-card">
          {/* Logo */}
          <div className="h-16 border-b px-4 flex items-center">
            <h1 className="font-semibold">AI Chat Hub</h1>
          </div>

          {/* Main Navigation */}
          <nav className="p-4 space-y-2">
            <Link href="/">
              <Button 
                variant={pathname === '/' ? "secondary" : "ghost"} 
                className="w-full justify-start"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/chats">
              <Button 
                variant={pathname === '/chats' ? "secondary" : "ghost"} 
                className="w-full justify-start"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chats
              </Button>
            </Link>
          </nav>

          {/* Chats Sub-navigation */}
          {isChatsPage && (
            <div className="px-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCreateConversation}
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isLoading ? 'Creating...' : 'New Chat'}
              </Button>
              <div className="text-sm font-semibold px-2 py-1">Conversations</div>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant={currentConversation?.id === conv.id ? "secondary" : "ghost"}
                    className="w-full justify-start mb-2"
                    onClick={() => setCurrentConversation(conv)}
                    disabled={isLoading}
                  >
                    {conv.title}
                  </Button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-card px-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8"
                />
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </ConversationContext.Provider>
  );
} 