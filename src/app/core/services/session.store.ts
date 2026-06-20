import { Injectable, computed, signal } from '@angular/core';
import { ChatMessage, ChatSession } from '../models/chat.model';

const STORAGE_KEY = 'medai.sessions.v1';
const MAX_TITLE_LENGTH = 42;

function createId(): string {
  return crypto.randomUUID();
}

function loadFromStorage(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessions = signal<ChatSession[]>(loadFromStorage());
  private readonly activeId = signal<string | null>(null);

  readonly allSessions = computed(() =>
    [...this.sessions()].sort((a, b) => b.createdAt - a.createdAt),
  );

  readonly activeSession = computed(
    () => this.sessions().find((s) => s.id === this.activeId()) ?? null,
  );

  readonly activeMessages = computed<ChatMessage[]>(() => this.activeSession()?.messages ?? []);

  constructor() {
    const first = this.allSessions()[0];
    if (first) {
      this.activeId.set(first.id);
    } else {
      this.createSession();
    }
  }

  createSession(): string {
    const session: ChatSession = {
      id: createId(),
      title: 'New consultation',
      createdAt: Date.now(),
      messages: [],
    };
    this.sessions.update((list) => [session, ...list]);
    this.activeId.set(session.id);
    this.persist();
    return session.id;
  }

  selectSession(id: string): void {
    this.activeId.set(id);
  }

  deleteSession(id: string): void {
    this.sessions.update((list) => list.filter((s) => s.id !== id));
    if (this.activeId() === id) {
      const next = this.allSessions()[0];
      if (next) {
        this.activeId.set(next.id);
      } else {
        this.createSession();
      }
    }
    this.persist();
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    this.sessions.update((list) =>
      list.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s)),
    );
    this.maybeSetTitle(sessionId, message);
    this.persist();
  }

  appendToMessage(sessionId: string, messageId: string, chunk: string): void {
    this.sessions.update((list) =>
      list.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, content: m.content + chunk } : m,
          ),
        };
      }),
    );
  }

  setMessageStatus(sessionId: string, messageId: string, status: ChatMessage['status']): void {
    this.sessions.update((list) =>
      list.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => (m.id === messageId ? { ...m, status } : m)),
        };
      }),
    );
    this.persist();
  }

  private maybeSetTitle(sessionId: string, message: ChatMessage): void {
    if (message.role !== 'user') return;
    this.sessions.update((list) =>
      list.map((s) => {
        if (s.id !== sessionId || s.title !== 'New consultation') return s;
        const trimmed = message.content.trim();
        const title =
          trimmed.length > MAX_TITLE_LENGTH ? `${trimmed.slice(0, MAX_TITLE_LENGTH)}…` : trimmed;
        return { ...s, title: title || s.title };
      }),
    );
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions()));
    } catch {
      // Storage full or unavailable — fail silently, in-memory state still works.
    }
  }
}
