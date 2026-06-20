import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatMessage } from '../../core/models/chat.model';
import { renderLiteMarkdown } from '../../core/utils/markdown-lite';

@Component({
  selector: 'app-message-bubble',
  imports: [],
  templateUrl: './message-bubble.html',
  styleUrl: './message-bubble.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubble {
  readonly message = input.required<ChatMessage>();

  private readonly sanitizer: DomSanitizer;

  constructor() {
    this.sanitizer = inject(DomSanitizer);
  }

  readonly renderedContent = computed<string | SafeHtml>(() => {
    const msg = this.message();
    if (msg.role !== 'assistant') return msg.content;
    return this.sanitizer.bypassSecurityTrustHtml(renderLiteMarkdown(msg.content));
  });

  readonly timestamp = computed(() => {
    const date = new Date(this.message().createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
}
