Frontend UX/UI and Implementation Specification — CareerMitra

Overview

This document is a complete, senior-level frontend specification for the CareerMitra project. It defines pages, exact button labels, component behavior, data flows to the backend, animations, accessibility, testing, and design tokens so you (or a design-to-code tool such as Stitch/Antigravity) can produce a polished, production-grade React + Vite app.

Goals
- Fast, accessible, and friendly experience for jobseekers to evaluate resumes vs job descriptions.
- Clear onboarding, low friction resume upload, high-quality results visualization, and easy export/share flows.
- Smooth micro-interactions and modern motion language (Framer Motion recommended).

Tech stack recommendations
- React + Vite (already in project)
- Tailwind CSS for utility styling
- Framer Motion for animations and page transitions
- React Query or SWR for server data caching and mutation
- React Hook Form for forms and validation
- Headless UI for accessible primitives (modals, dialogs)

Design system (tokens)
- Primary Color: #0F172A (Indigo-900) — deep anchor
- Accent Gradient: linear-gradient(90deg,#7C3AED,#06B6D4) (purple → teal)
- Success: #10B981 (green-500)
- Warning: #F59E0B (amber-500)
- Danger: #EF4444 (red-500)
- Neutral: slate palette (Tailwind: slate-50..900)
- Radius: base 12px (rounded-lg)
- Elevation: subtle shadows for cards
- Typography: Inter or Poppins; sizes: 14/16/20/28/36

Global layout
- Full-screen layout with a top nav bar and content container (max-width 1200px). Use centered container with 24px padding.
- Left: (optional) collapsible sidebar on Dashboard pages for navigation (Profile, History, Export), mobile-first adapt to bottom sheet.

Pages & exact UI elements

1) Landing (Route: /)
- Hero section: headline "Make your resume work — not the other way around"; subhead: "Match, learn, and improve with AI-powered analysis."; primary CTA button: "Get Started" (primary) — scrolls to upload area or navigates to /dashboard.
- Secondary CTA: "How it works" (ghost) — opens a micro modal with 3-step animated illustration.
- Top nav buttons: "Sign in" (text), "Get Started" (accent). On mobile: hamburger icon.
- Footer links: About, Docs, Privacy, Contact.

2) Dashboard / Upload (Route: /dashboard)
- Page header: "Analyze Resume" + small subtitle with session id.
- Components in order of prominence:
  - UploadCard (center column)
    - Dropzone area: big dashed rectangle, icon, text: "Drop PDF or click to upload"; max 10 MB. Support click to open file picker and drag-n-drop. Accepts only .pdf.
    - Beneath: "Or paste job description" textarea placeholder: "Paste job description or job URL here" (multi-mode toggle). Default: JD input mode.
    - Exact buttons inside card (horizontal row):
      - "Choose file" (secondary) — opens file dialog
      - "Paste JD" (secondary toggle) — toggles to JD textarea instead of URL
      - "Analyze" (primary, large) — triggers upload+analysis. Disabled until file + JD present.
  - Session controls (top-right of card): small buttons "Guest session" label, icon-only button "Reset session" (tooltip: "Start new session").
- Keyboard shortcuts: Enter triggers primary action when focus within form.

3) Results view (Route: /results/:analysisId or in-panel)
- Page header: score summary bar with large circular ScoreBadge showing match_score (0–100) in gradient fill and color-coding (>=80 green, 50–79 amber, <50 red).
- Breakdown cards (grid two-column desktop, single-column mobile):
  - Missing Skills (Card): list of items. Each item has: skill name, confidence badge, small "Learn" button (link to resource search) and a subtle hover reveal.
  - Scam Risk (Card): shows scam_probability_score and red flags list with expandable details.
  - Study Recommendations (Card): bullet actions with estimated time (e.g., "Take Intro to Networking — 6 hours") and quick resource button "Open".
  - Detailed JSON export card: "Export as JSON" (button) and "Download PDF" (button) — uses backend `/analysis/export` and frontend PDF rendering (jsPDF optional).

4) History / Sessions (Route: /history)
- List of previous analyses with timestamp, job title (from parsed JD), score preview, and quick action buttons: "Open", "Export", "Delete".

5) Settings / Profile (Route: /profile)
- API key area (hidden by default for guest sessions), toggles for privacy, model choice dropdown (defaults to gemini-pro but allow switching), preference sliders for verbosity.

Shared components and exact labels
- Header
  - Left: logo (SVG) + product name
  - Center: nav: "Dashboard", "History", "Docs"
  - Right: session chip: "Guest · copy" (small), icon button for settings (tooltip: "Settings")
- UploadCard
  - Dropzone: alt text and aria label "Upload resume PDF"
  - JD Input: placeholder text: "Paste job description (min 40 chars)"
  - Buttons row: "Choose file" | "Paste JD" | "Analyze"
- ScoreBadge
  - Circular progress ring showing value; exact label inside: "{score}%" and small caption "Match".
- ResultCard
  - Title, short explanation, bullet list (max 6 items) with ellipsis.
  - CTA inside card: "Save as Note" (secondary) and "Learn More" (link)
- Toast / Snackbar
  - Top-right stack, auto-dismiss after 4s, types: success (green), error (red), info (blue)

Motion & animations (senior-level)
- Page transitions: use Framer Motion's AnimatePresence. Slide left/right for route changes, 300ms duration, ease: [0.22,1,0.36,1].
- Hero entrance: staggered fade/scale for headline, subtitle, and CTA (delay 0.12s each).
- Dropzone: small hover lift and shadow (translateY -4px) on dragenter; pulse ring animation while uploading.
- ScoreBadge animation: when result arrives, animate from 0 to value with smooth spring and bounce (use motion value tweening), plus confetti if >=90 (subtle).
- Card hover: gentle lift (translateY -6px), box-shadow increase, and reveal quick actions with fade-in.
- Button micro-interactions: scale 0.98 on active, ripple effect optional.

Accessibility
- All interactive controls keyboard-focusable with visible focus outline (contrast). Use aria-live region for analysis progress updates.
- Ensure semantic HTML: headings (h1/h2), form labels associated, inputs with aria-describedby for helper text.
- Color contrast meeting WCAG 2.1 AA for primary text and backgrounds.

API wiring (exact endpoints and payloads)
- POST /auth/guest-login -> returns { token, user_id, expires_at } (store X-Session-Token header)
- POST /parse-job-url { url } -> returns { source_url, source_domain, title, job_description }
- POST /analyze (multipart/form-data): fields: job_description (string), resume (file). Header: X-Session-Token. Response: AnalysisResponse JSON schema below.
- GET /analysis/export -> Header X-Session-Token -> returns { analysis }

Data shapes (from backend)
- AnalysisResponse
  - match_score: int
  - scam_probability_score: int
  - scam_red_flags: string[]
  - missing_skills: string[]
  - study_recommendations: string[]

Frontend state & data flow
- Use React Query for the /analyze mutation (optimistic UI: show processing spinner with progress steps). Cache analysis by hash of (resume bytes + jd string) so UI can show cached copy instantly.
- Show progress states: uploading (0-30%), parsing (30-60%), contacting AI (60-95%), finalizing (95-100%). Use a determinate progress bar with labeled steps.

Exact button list (copy-paste ready)
- Landing: "Get Started" (primary), "How it works" (ghost)
- UploadCard: "Choose file", "Paste JD", "Analyze"
- Results: "Download JSON", "Download PDF", "Save", "Learn"
- History: "Open", "Export", "Delete"
- Profile: "Save settings", "Clear API key"

Error handling and states
- If /analyze returns 500 or 502: show full-screen modal with message: "Analysis failed — try again or export your data." Buttons: "Retry" (primary) and "Export Draft" (secondary).
- If rate limit hit (429): toast message "Rate limit exceeded — try again in an hour." and disable Analyze button for 60s with countdown.
- If missing GEMINI key and running locally: show a prominent banner with instructions to configure the key.

Testing
- Unit tests for components (Jest/React Testing Library): UploadCard, ScoreBadge, ResultCard
- Integration tests: Cypress end-to-end flow: upload PDF + JD -> analyze -> view results -> export.
- Accessibility tests: axe-core integration in CI.

Performance & optimization
- Lazy-load heavy components (Results view) and non-critical fonts.
- Use image optimization for hero assets; serve SVGs where possible.
- Use service worker (optional) to cache static assets and last results for offline viewing.

Assets & icons
- Use a single SVG sprite for icons (or Lucide/heroicons). Keep hero artwork in SVG for crisp scaling.

Design handoff notes for Stitch/Antigravity
- Provide the following to the tool: full-screen Figma slices for Landing, Dashboard (upload), Results (desktop and mobile), and Modals.
- Provide exact tokens (colors, font sizes, radius) — included above.
- For animations, provide Lottie or Framer Motion keyframes: page transitions (slide), ScoreBadge progress tween, and dropzone pulsing.
- If you attach a custom design, ensure the tool maps components to these exact labels and props (e.g., component UploadCard must expose `onFileSelected(file)`, `onAnalyze()` callbacks).

Developer tasks (sprint plan)
- Sprint 1 (2 days): Implement core UploadCard, JD input, and wire to `/analyze` with progress UI.
- Sprint 2 (2 days): Results view, ScoreBadge animations, export buttons.
- Sprint 3 (2 days): History page, session management, and settings.
- Sprint 4 (1 day): Accessibility QA, tests, and polish animations.

Example component contract (UploadCard)
- Props:
  - onAnalyze(jobDescription: string, file: File): Promise<any>
  - onFileChange(file: File | null)
  - initialJobDescription?: string
- Events:
  - emits `analysisStarted`, `analysisProgress`, `analysisComplete`

Deliverable file: this spec (FRONTEND_SPEC.md) has everything Stitch/Antigravity or a frontend developer needs to implement the UI exactly as requested.

If you want, next I can:
- Generate a component scaffold (React + Tailwind) for UploadCard, ScoreBadge, and ResultsCard (fully wired to backend endpoints), or
- Convert the spec into a Figma-friendly tokens JSON and Framer Motion snippets for immediate handoff to your design tool.

Which would you like me to do next? (I can start implementing components immediately.)
