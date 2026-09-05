export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  mode?: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  initialContent: string;
  turns: ChatTurn[];
  tags: string[];
  mood?: 'reflective' | 'grateful' | 'curious' | 'challenged' | 'energized' | 'neutral';
  summary?: string;
  createdAt: number;
  updatedAt: number;
}

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'reframe';

export interface ReflectionRequest {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  mode: ReflectionMode;
  context?: {
    title?: string;
    initialContent?: string;
    tags?: string[];
  };
}

export interface ReflectionResponse {
  reply: string;
  modelUsed: string;
  mode: ReflectionMode;
  attempts: Array<{ model: string; status: 'attempted' | 'failed' | 'succeeded'; error?: string }>;
}
