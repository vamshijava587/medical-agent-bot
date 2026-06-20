import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInput {
  readonly disabled = input<boolean>(false);
  readonly streaming = input<boolean>(false);

  readonly send = output<string>();
  readonly stop = output<void>();

  protected value = '';

  private readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  private static readonly QUICK_PROMPTS = [
    'What is diabetes?',
    'Symptoms of seasonal flu',
    'How do antibiotics work?',
    'When should I see a doctor for a fever?',
  ];

  readonly quickPrompts = ChatInput.QUICK_PROMPTS;

  onSubmit(event: Event): void {
    event.preventDefault();
    this.trySend();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.trySend();
    }
  }

  useQuickPrompt(prompt: string): void {
    this.value = prompt;
    this.trySend();
  }

  autoGrow(): void {
    const el = this.textarea()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  private trySend(): void {
    const trimmed = this.value.trim();
    if (!trimmed || this.disabled()) return;
    this.send.emit(trimmed);
    this.value = '';
    queueMicrotask(() => this.autoGrow());
  }
}
