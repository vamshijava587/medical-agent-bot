import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChatService } from './core/services/chat.service';
import { SessionStore } from './core/services/session.store';
import { ChatMessage } from './core/models/chat.model';
import { Sidebar } from './components/sidebar/sidebar';
import { VitalsHeader } from './components/vitals-header/vitals-header';
import { ChatWindow } from './components/chat-window/chat-window';
import { ChatInput } from './components/chat-input/chat-input';

function createId(): string {
  return crypto.randomUUID();
}

@Component({
  selector: 'app-root',
  imports: [Sidebar, VitalsHeader, ChatWindow, ChatInput],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly chat = inject(ChatService);
  protected readonly store = inject(SessionStore);

  protected readonly sidebarCollapsed = signal(false);
  protected readonly isStreaming = signal(false);

  protected readonly connected = this.chat.connected;

  protected readonly activeSessionTitle = computed(
    () => this.store.activeSession()?.title ?? 'New consultation',
  );

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  onNewSession(): void {
    this.store.createSession();
  }

  onSelectSession(id: string): void {
    this.store.selectSession(id);
  }

  onDeleteSession(id: string): void {
    this.store.deleteSession(id);
  }

  onSend(text: string): void {
    const session = this.store.activeSession();
    if (!session) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: text,
      status: 'done',
      createdAt: Date.now(),
    };
    this.store.addMessage(session.id, userMessage);

    const assistantMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: Date.now(),
    };
    this.store.addMessage(session.id, assistantMessage);

    this.isStreaming.set(true);

    this.chat.send(text, {
      onChunk: (chunk) => {
        this.store.appendToMessage(session.id, assistantMessage.id, chunk);
      },
      onDone: () => {
        this.store.setMessageStatus(session.id, assistantMessage.id, 'done');
        this.isStreaming.set(false);
      },
      onError: (message) => {
        this.store.setMessageStatus(session.id, assistantMessage.id, 'error');
        if (!assistantMessage.content) {
          this.store.appendToMessage(session.id, assistantMessage.id, message);
        }
        this.isStreaming.set(false);
      },
    });
  }

  onStop(): void {
    this.chat.stop();
    this.isStreaming.set(false);
  }
}
