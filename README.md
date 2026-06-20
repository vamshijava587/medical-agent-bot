# MedAI — Medical Agent Bot (Angular 21)

A dark, glassmorphism-styled chat client for the Spring AI `/chat` endpoint, with real
token-by-token streaming, multiple consultation sessions, and a live ECG-style status trace.

## Stack

- Angular 21 (standalone components, signals, **zoneless** change detection)
- SCSS, no UI framework — custom design system (see `src/styles.scss` for tokens)
- Native `fetch` + `ReadableStream` for SSE consumption (works with Spring's `Flux<String>`)
- Sessions persisted to `localStorage` — no backend session storage needed

## Run it

```bash
npm install
npm start
```

Opens on `http://localhost:4200`. The backend URL is set in
`src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
};
```

Change `apiBaseUrl` if your Spring Boot app runs elsewhere.

## ⚠️ CORS — you must enable this on the backend

Angular runs on `http://localhost:4200`, your Spring Boot app on `http://localhost:8080`.
Browsers block cross-origin requests by default, so **the `/chat` endpoint will fail until
you add CORS support** to the controller (or globally). Easiest fix, on the controller you shared:

```java
@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {
    // ...
}
```

Or globally, in a `@Configuration` class:

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                    .allowedOrigins("http://localhost:4200")
                    .allowedMethods("GET", "POST");
        }
    };
}
```

Without this, you'll see a CORS error in the browser console and the chat will show
"Couldn't reach the agent."

## How streaming works

Your backend returns `Flux<String>` as `text/event-stream`. The frontend's
`ChatService` (`src/app/core/services/chat.service.ts`) calls `fetch()` directly (not
`HttpClient`, which buffers the whole response) and reads the response body as a
`ReadableStream`, parsing `data: ...` SSE frames as they arrive and pushing each chunk into
the active message in real time — that's what gives the token-by-token typing effect.

If your backend ever changes to emit raw chunks without SSE framing, the parser already
falls back to treating each flushed chunk as plain text, so it won't break.

## Project structure

```
src/app/
├── core/
│   ├── models/chat.model.ts       # ChatMessage, ChatSession, ChatRequest types
│   ├── services/
│   │   ├── chat.service.ts        # SSE streaming client (fetch + ReadableStream)
│   │   └── session.store.ts       # Signal-based session state + localStorage
│   └── utils/markdown-lite.ts     # Minimal markdown renderer for assistant replies
├── components/
│   ├── vitals-header/             # Signature ECG trace + connection status
│   ├── sidebar/                   # Consultation history, new chat
│   ├── chat-window/                # Message list + auto-scroll
│   ├── message-bubble/            # User/assistant bubbles, markdown rendering
│   ├── chat-input/                 # Auto-growing textarea, quick prompts, stop button
│   └── welcome-screen/            # Empty-state suggestion cards
├── app.ts / app.html / app.scss   # Root shell, wires everything together
```

## Design notes

- **Palette**: void black (`#05080f`) base, teal (`#00e5c7`) as the primary signal color,
  violet (`#6e5bff`) for user messages — see `:root` tokens in `src/styles.scss`.
- **Type**: Space Grotesk (display), Inter (body), JetBrains Mono (status/timestamps).
- **Signature element**: the animated ECG trace in the header is idle/dim normally and
  speeds up + glows teal while the assistant is streaming a response — ties the "medical"
  subject matter to the AI's live state instead of a generic spinner.
- Respects `prefers-reduced-motion`.

## Things you may want to adjust

- **Stop button**: calls `AbortController.abort()` on the fetch — Spring's `Flux` will see
  the client disconnect and cancel the subscription server-side, no extra backend work needed.
- **Quick prompts** in the empty composer are hardcoded in `chat-input.ts` — edit
  `QUICK_PROMPTS` to match your bot's actual strengths.
- **Markdown rendering** is intentionally minimal (bold, italics, code, lists, headings) —
  swap in `ngx-markdown` or `marked` if your model returns richer formatting.
