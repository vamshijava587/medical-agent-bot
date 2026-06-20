# Agent Skill: Mobile-Responsive Chat UI (Hide conversations on mobile start)

## Purpose
This skill captures a step-by-step workflow to make the chat UI responsive for mobile devices and to prevent the conversation panel from opening automatically on small screens. The goal is a predictable mobile experience: show a compact toggle (button) on small screens; only open the chat window when the user taps it.

## Scope
- Workspace-scoped: applies to the project's frontend code (src/app and component files).
- Applies to CSS/SCSS changes, small component TS changes, and simple behavioral logic.

## Expected Outcome
- On small screens (mobile): the chat/conversation panel is hidden at startup and a visible toggle button (e.g., floating action button) is present; tapping it opens the chat.
- On larger screens (tablet/desktop): existing layout and auto-open behavior remain unchanged unless explicitly configured.

## Step-by-step Workflow

1. Inspect current chat components
   - Files to check: [src/app/components/chat-window/chat-window.ts](src/app/components/chat-window/chat-window.ts), [src/app/components/chat-window/chat-window.html](src/app/components/chat-window/chat-window.html), and any container layout files such as [src/app/app.html](src/app/app.html).
   - Goal: find where the chat is initialized and any code that auto-opens conversations on startup.

2. Add responsive CSS rules
   - Strategy A (preferred): use CSS media queries in `chat-window.scss` (or global `styles.scss`) to make the chat fullscreen or hidden on small screens.
     - Example breakpoint: `@media (max-width: 767px) { /* mobile */ }`.
   - Strategy B: use Bootstrap/tailwind utility classes if the project already uses them.

3. Change startup behavior in component logic
   - Locate the code that sets `openConversation = true` on init. Change it to conditionally open based on screen width (or better: never auto-open on small screens).
   - Example logic (pseudo):
     - In `ngOnInit()` or equivalent, replace unconditional open with:
       - `if (window.innerWidth >= 768) { openConversation = true; } else { openConversation = false; }`
     - Alternatively, always start closed and only auto-open on desktop if desired.

4. Add a mobile-visible toggle/button
   - Add a floating action button (FAB) or small toggle visible only on small screens via CSS (`display: none` on large). Clicking it toggles chat visibility.
   - Place button in a shared header or as a fixed element in `app.html`.

5. Smooth transitions and accessibility
   - Animate open/close for clarity (CSS transitions, height/transform).
   - Ensure toggle is keyboard-accessible, has ARIA labels, and focus management (trap focus when chat is open on mobile).

6. Test on devices and emulators
   - Verify on narrow widths (320px, 375px, 414px), mid (768px), and desktop (≥1024px).
   - Test orientation changes and ensure state is preserved sensibly.

## Decision Points & Branching Logic
- Where to control the behavior: component TS vs. global state (service).
  - Use component-local logic for simple apps. Use a service if many places need to show/hide the chat.
- Breakpoint choice: `768px` is common for switching between mobile and tablet/desktop, but adjust to your design system.

## Code Snippets (concrete examples)

- Example CSS (add to `chat-window.scss` or `styles.scss`):

  @media (max-width: 767px) {
    .chat-window {
      position: fixed;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      transform: translateY(100%);
      transition: transform 210ms ease-in-out;
    }
    .chat-window.open {
      transform: translateY(0);
    }
    .chat-toggle {
      display: block; /* visible on mobile */
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 9999;
    }
  }

- Example TS changes (simplified; put in `chat-window.ts`):

  export class ChatWindowComponent implements OnInit {
    open = false;

    ngOnInit() {
      // Start closed on small screens
      this.open = window.innerWidth >= 768;
      // optional: listen to resize and adapt if desired
      window.addEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
      // keep current state if user toggled manually; this is optional
    }

    toggle() { this.open = !this.open; }
  }

## Quality Criteria / Completion Checks
- Mobile: on initial load the chat panel is NOT visible; a toggle button is visible and opens the chat.
- Desktop: default behavior preserved (if previously auto-opened).
- No layout breaks, scroll remains usable, chat doesn't block essential controls.
- Accessibility: toggle has ARIA label and focus moves into chat when opened.

## Example prompts to run this skill
- "Make the chat hidden on mobile and add a FAB toggle."
- "Change chat startup so conversations don't open automatically on phones."

## Ambiguous Areas to Clarify (ask the user)
1. Should desktop keep the current behaviour (auto-open), or do you want explicit toggle everywhere?
2. Preferred breakpoint (default 768px is suggested)?
3. Do you want the chat state preserved across route changes or page reloads?

## Follow-ups & Related Customizations
- Add a responsive layout for the sidebar (collapse on mobile).
- Persist chat-open state in `sessionStorage` if you want the chat to reopen after refresh.
- Add a small animation and backdrop overlay for mobile to focus the conversation.

## Implementation Checklist (quick)
- [ ] Inspect components and identify auto-open logic
- [ ] Add media-query CSS to hide/adapt chat on small screens
- [ ] Add FAB toggle and ARIA attributes
- [ ] Update component init logic to avoid auto-open on mobile
- [ ] Test across device widths and orientations

---
Created for: workspace frontend responsive chat improvements.
