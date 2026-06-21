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
  private readonly chat: ChatService;
  protected readonly store: SessionStore;

  protected readonly sidebarCollapsed = signal(false);
  protected readonly isStreaming = signal(false);

  protected readonly connected: any;
  protected readonly activeSessionTitle: any;

  private readonly resizeHandler: () => void;

  constructor() {
    this.chat = inject(ChatService);
    this.store = inject(SessionStore);

    this.connected = this.chat.connected;
    this.activeSessionTitle = computed(
      () => this.store.activeSession()?.title ?? 'New consultation',
    );

    // keep sidebar collapsed on small screens by default
    this.resizeHandler = () => {
      const isSmall = window.innerWidth <= 880;
      this.sidebarCollapsed.set(isSmall);
    };

    // set initial state and listen for changes so layout adapts responsively
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  onNewSession(): void {
    this.store.createSession();
  }

  onSelectSession(id: string): void {
    this.store.selectSession(id);
    // On small screens, hide the sidebar after the user selects a session
    if (window.innerWidth <= 880) this.sidebarCollapsed.set(true);
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

    // If the user manually stopped the stream, mark the active assistant
    // streaming message as 'done' so it doesn't display as an error.
    const session = this.store.activeSession();
    if (!session) return;
    const streamingMsg = [...session.messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.status === 'streaming');
    if (streamingMsg) {
      this.store.setMessageStatus(session.id, streamingMsg.id, 'done');
    }
  }
}
