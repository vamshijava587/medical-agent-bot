import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ChatMessage } from '../../core/models/chat.model';
import { MessageBubble } from '../message-bubble/message-bubble';
import { WelcomeScreen } from '../welcome-screen/welcome-screen';

@Component({
  selector: 'app-chat-window',
  imports: [MessageBubble, WelcomeScreen],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWindow implements AfterViewInit, OnDestroy {
  readonly open = signal(true);

  private resizeHandler: (() => void) | null = null;

  readonly messages = input<ChatMessage[]>([]);
  readonly promptSelected = output<string>();
  readonly showScrollToBottom = signal(false);

  private readonly chatWindow = viewChild<ElementRef<HTMLDivElement>>('chatWindow');
  private readonly scrollAnchor = viewChild<ElementRef<HTMLDivElement>>('scrollAnchor');

  constructor() {
    effect(() => {
      // Re-run whenever message count or the latest message's content changes.
      const list = this.messages();
      const lastLength = list.at(-1)?.content.length ?? 0;
      void lastLength;
      void list.length;
      this.scrollToBottom();
    });
  }

  ngAfterViewInit(): void {
    this.updateScrollButtonState();
    // Start closed on small screens; open on desktop/tablet widths
    try {
      const isDesktop = window?.innerWidth >= 768;
      this.open.set(isDesktop);
    } catch {
      // noop in non-browser environments
    }

    // Keep a simple resize handler to optionally adapt initial behaviour
    this.resizeHandler = () => {
      // do not force state if user toggled manually; only adjust initial open when resizing from very small to large
      // if currently closed and screen becomes large, open it
      try {
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop && !this.open()) {
          this.open.set(true);
        }
      } catch {
        // noop
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  onScroll(): void {
    this.updateScrollButtonState();
  }

  scrollToBottom(): void {
    queueMicrotask(() => {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      this.showScrollToBottom.set(false);
    });
  }

  toggle(): void {
    this.open.set(!this.open());
  }

  private updateScrollButtonState(): void {
    const container = this.chatWindow()?.nativeElement;
    if (!container) {
      return;
    }

    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 16;
    this.showScrollToBottom.set(!isAtBottom);
  }
}
