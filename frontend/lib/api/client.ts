import { TokenResponse, User, Message, Conversation, ChatRequest, ChatResponse, SystemStatus } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface CreateConversationRequest {
  title: string;
  messages: Message[];
}

class ApiClient {
  private token: string | null = null;
  private tokenExpiration: number | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      const expiration = localStorage.getItem('tokenExpiration');
      if (expiration) {
        this.tokenExpiration = parseInt(expiration, 10);
      }
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiration) return true;
    return Date.now() >= this.tokenExpiration;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers,
    });

    if (this.token) {
      if (this.isTokenExpired()) {
        this.logout('token_expired');
        throw new Error('401 Unauthorized: Token expired');
      }
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear token on unauthorized
          this.logout('unauthorized');
          throw new Error('401 Unauthorized');
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Login failed: Invalid credentials');
      }

      const data = await response.json();
      this.token = data.access_token;
      // Set token expiration (30 minutes from now)
      this.tokenExpiration = Date.now() + 30 * 60 * 1000;
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('tokenExpiration', this.tokenExpiration.toString());
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Chat endpoints
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { messages, provider, model, temperature, ...otherParams } = request;
    
    // Format messages to match backend's Message model
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));

    return this.request<ChatResponse>(`/chat/${provider}`, {
      method: 'POST',
      body: JSON.stringify({
        messages: formattedMessages,
        model_params: {
          model: model || 'gpt-4o',
          temperature: temperature || 0.7,
          max_tokens: 1000,
          ...otherParams
        }
      }),
    });
  }

  async sendStreamMessage(
    request: ChatRequest,
    onMessage: (message: Message) => void
  ): Promise<void> {
    try {
      const headers = new Headers({
        'Content-Type': 'application/json',
      });
      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      const response = await fetch(`${API_BASE_URL}/chat/${request.provider}/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.token = null;
          localStorage.removeItem('token');
          throw new Error('401 Unauthorized');
        }
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const message = JSON.parse(line);
            onMessage(message);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        }
      }
    } catch (error) {
      console.error('Stream message error:', error);
      throw error;
    }
  }

  // Conversation endpoints
  async createConversation(title: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations?title=${encodeURIComponent(title)}`, {
      method: 'POST',
    });
  }

  async listConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations');
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`);
  }

  async addMessage(conversationId: string, message: Message): Promise<Message> {
    console.log('Adding message:', message);
    return this.request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.request(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getSystemStatus(): Promise<SystemStatus> {
    return this.request<SystemStatus>('/admin/status');
  }

  logout(error?: string): void {
    this.token = null;
    this.tokenExpiration = null;
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    // Redirect to login page with error message if provided
    if (typeof window !== 'undefined') {
      const redirectUrl = error ? `/login?error=${encodeURIComponent(error)}` : '/login';
      window.location.href = redirectUrl;
    }
  }
}

export const apiClient = new ApiClient(); 