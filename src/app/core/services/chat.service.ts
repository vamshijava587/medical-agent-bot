import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface StreamHandlers {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Talks to the Spring AI backend's /chat endpoint.
 * The backend returns a Flux<String> as text/event-stream (SSE), so the
 * raw HTTP response body is a stream of `data: <token>\n\n` frames.
 * fetch() + ReadableStream lets us read and render those frames as they
 * arrive instead of waiting for the full response.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly connected = signal(true);

  private activeController: AbortController | null = null;

  send(message: string, handlers: StreamHandlers): void {
    this.activeController = new AbortController();

    fetch(`${environment.apiBaseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message }),
      signal: this.activeController.signal,
    })
      .then((response) => {
        if (!response.ok || !response.body) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        this.connected.set(true);
        return this.readStream(response.body, handlers);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          handlers.onDone();
          return;
        }
        this.connected.set(false);
        handlers.onError(err instanceof Error ? err.message : 'Connection to the agent failed.');
      });
  }

  stop(): void {
    this.activeController?.abort();
    this.activeController = null;
  }

  private async readStream(body: ReadableStream<Uint8Array>, handlers: StreamHandlers): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const text = this.extractFrameText(frame);
          if (text.length > 0) handlers.onChunk(text);
        }
      }

      // Flush whatever is left in the buffer (handles servers that don't
      // terminate the last frame with a trailing blank line).
      const remaining = this.extractFrameText(buffer);
      if (remaining.length > 0) handlers.onChunk(remaining);

      handlers.onDone();
    } catch (err) {
      handlers.onError(err instanceof Error ? err.message : 'Stream interrupted.');
    } finally {
      this.activeController = null;
    }
  }

  private extractFrameText(frame: string): string {
    if (!frame) return '';

    const dataLines = frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''));

    // Plain SSE frame: one or more `data:` lines.
    if (dataLines.length > 0) {
      return dataLines.join('\n');
    }

    // Fallback: backend sent a raw chunk with no SSE framing at all.
    return frame;
  }
}
