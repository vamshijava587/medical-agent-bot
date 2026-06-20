import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
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
export class ChatWindow {
  readonly messages = input<ChatMessage[]>([]);
  readonly promptSelected = output<string>();

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

  private scrollToBottom(): void {
    queueMicrotask(() => {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
}
