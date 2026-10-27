# Slots design system

## Concept and visual language

“Зав байна” means that free time is available. The identity uses a time grid:
free slots are signal-lime, confirmed slots are ink with a check, and open
space is shown with a dashed outline. Keep the system editorial and precise:
large Mongolian headlines, small indexed labels, hairline rules, flat planes,
and generous whitespace. Customer and worker surfaces share the same system;
staff screens are outside this redesign.

Do not use gradients, glows, pastel decoration, emoji, cartoon illustrations,
or card shadows. Only a floating header and dialogs may use a soft shadow.
The lime is a fill with ink foreground, never text on a light background.
Status colours appear only in labelled status pills.

## Tokens and layout

All public colours are declared once in `src/app/globals.css`. Use the names
`--ink`, `--ink-2`, `--paper`, `--surface`, `--line`, `--line-strong`,
`--muted`, `--muted-on-ink`, `--signal`, `--signal-hover`, `--signal-soft`,
`--on-signal`, `--link`, `--focus`, `--ok`, `--ok-bg`, `--warn`, `--warn-bg`,
`--err`, and `--err-bg`. Radius, spacing, type-scale, easing, and duration
tokens are defined there as well. Do not add raw colour literals to public
components.

Use a light theme, a 12-column grid, a responsive page gutter, section spacing,
and a 1440px content maximum. Prefer `100dvh`, safe-area insets on fixed bars,
container queries for tile internals, and scroll padding that accounts for the
header. Use a single variable sans with Mongolian Cyrillic and
Cyrillic-Extended coverage. Display headings are bold and compact; body text
is readable and relaxed. Long Cyrillic words must wrap without overflowing.

Buttons have a minimum 48px height (52px primary), 12px corners, and a clear
focus ring. Primary buttons are ink with white text and a lime arrow marker;
accent buttons are lime with ink text; secondary buttons are outlined. Links
are underlined. Inputs use labels above controls, a 52px minimum height, and
visible error text with an icon. Cards are white with a one-pixel line and
20px corners.

## Components

Shared public components live in `src/components/ds/`. Keep server components
as the default. The system includes `SlotStrip` (board, divider, loader),
`Marquee`, `Reveal`, `Faq`, `AudienceSwitch`, `AuthDialog`, `CalendarDemo`,
`Button`, `ButtonLink`, `Chip`, `StatusPill`, `Field`, `Skeleton`, and `Toast`.

`SlotStrip` is decorative and has adjacent screen-reader text; any realistic
sample is labelled “Жишээ”. Its grid has twelve columns per row. Free cells are
lime, booked cells ink with a check, and empty cells dashed. `CalendarDemo` is
an explicitly labelled, local-only example; its selection is not saved.
`Faq` uses disclosure semantics. Auth uses a native dialog with focus handling
and Escape support. Forms and links preserve the existing host routes and
server actions.

## Page structures and behavior

### Customer landing

The order is: hero with order prefill and a five-day example board; job-type
marquee; active non-sensitive job bento; four-step process; dark trust
statements; lime worker cross-link; FAQ; closing order call-to-action; footer.
On phones, a safe-area-aware order action appears after the hero and never
covers a focused field.

### Worker landing

The order is: hero with a local calendar example; job-type marquee; four
benefit tiles; four-step start process; dark requirements and install
instructions; FAQ; registration call-to-action; footer. On phones, a
safe-area-aware registration action is available without covering content.

### Auth and application

Login, registration, forgot-password, and reset-password pages use the same
forms as the auth dialog, presented in a centered 480px card with a slot-rule
detail. Customer and worker app screens retain all current routes, data,
validation, navigation, server actions, and authorization. Their navigation
uses a desktop top bar and a safe-area-aware phone tab bar; lists use ruled
rows, statuses use labelled pills, and calendars reuse the slot states.

## Motion and accessibility

Motion is CSS-first and limited to transform, opacity, and clip-path. Scroll
reveals are progressive enhancement: unsupported browsers render the final
state. Never start above-the-fold text hidden. Respect reduced motion by
removing movement while preserving state changes. Any self-running sequence
must stop after three loops and provide a visible pause control. Controls need
visible focus, keyboard access, accessible names, and at least 44px touch
targets. Do not animate layout properties.

## Acceptance checks

- `npm run check:design`: no legacy public palette, raw public colour literals,
  unsafe HTML, hidden hero text, or layout-property animations.
- `npm run check:landing`: correct heading count, section structure, and
  header actions on both public landings.
- `npm run contrast`: required public and staff contrast pairs pass.
- `npm run layout`: supported viewport widths have no horizontal overflow or
  fixed-bar overlap.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run verify`, and
  `npm run smoke` pass; unavailable infrastructure is recorded explicitly.
- The selected font renders Mongolian Ү/ү and Ө/ө. Motion and pause controls,
  native dialog behavior, mobile/desktop layouts, and the local calendar demo
  are manually checked.
