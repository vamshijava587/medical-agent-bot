import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ChatSession } from '../../core/models/chat.model';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly sessions = input<ChatSession[]>([]);
  readonly activeSessionId = input<string | null>(null);
  readonly collapsed = input<boolean>(false);

  readonly newSession = output<void>();
  readonly selectSession = output<string>();
  readonly deleteSession = output<string>();
  readonly toggleCollapsed = output<void>();

  relativeTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  onDelete(event: Event, sessionId: string): void {
    event.stopPropagation();
    this.deleteSession.emit(sessionId);
  }
}
