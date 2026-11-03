---
name: Rally
description: A quiet, exact task board where work is handed from lane to lane.
colors:
  ground: "#ffffff"
  card: "#ffffff"
  overlay: "#ffffff"
  hover: "#eceeff"
  ink-1: "#20243a"
  ink-2: "#4d556f"
  ink-3: "#59627f"
  line-1: "#e6e8f5"
  line-2: "#d5d9ee"
  line-3: "#8593c6"
  action: "#5756d9"
  accent: "#5756d9"
  accent-tint: "#e7e8ff"
  danger: "#d94368"
  warning: "#bc7200"
  status-todo: "#6f6fe5"
  status-progress: "#2197bb"
  status-review: "#9a5bd0"
  status-done: "#20a581"
  priority-high: "#ad3e26"
typography:
  display:
    fontFamily: "Schibsted Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.011em"
  title:
    fontFamily: "Schibsted Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.011em"
  body:
    fontFamily: "Schibsted Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  control:
    fontFamily: "Schibsted Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.125rem"
  meta:
    fontFamily: "Schibsted Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  xs: "3px"
  sm: "5px"
  md: "7px"
  lg: "10px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    height: "30px"
    padding: "0 12px"
  button-quiet:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    height: "30px"
    padding: "0 8px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "12px"
  field:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 10px"
---

# Design System: Rally

`src/styles/tokens.css` holds every value, including the dark theme. This file says how to use them. If the two disagree about a value, the CSS wins.

Components live in `src/components/ui/` (shared primitives) and `src/components/features/` (feature-specific), one folder each with its own CSS Module, such as `ui/Button/Button.tsx` and `ui/Button/Button.module.css`.

## Overview

**Creative North Star: "The Relay Desk"**

Work moves through a team as a series of handoffs: someone picks it up, carries it, and passes it on. Rally is the desk where that work comes together. It is quiet and exact, like the tools people keep open all day, and it saves its one moment of character for the handoff itself.

The board is the page, not a set of boxes on a page. Lanes are separated by hairline rules on a single ground, so the eye goes to the cards. Density is that of a working tool: a full column stays readable and scannable at 14px, with no decoration competing for room. Light and dark both follow the system by default, because this is used through a full working day in changing light.

**Key Characteristics:**

- Neutral chrome, with colour reserved for data and focus
- Lanes as open columns on the ground, never containers
- A single filled action on screen at a time
- Dense, tabular and aligned to one gutter
- Motion that explains where a card went, and nothing else

## Colors

Cool neutrals on white carry the interface, with indigo as the one action colour. In light mode a soft pink and yellow wash sits behind the board. Other hues appear only where they mean something.

### Primary

- **Rally Indigo** (`--action`): the one filled button, the strongest thing on a neutral page.

### Secondary

- **Accent** (`--accent`): focus rings, selection, the lane under a dragged card and the drop slot. It shares the action colour, so anything the user can act on reads as one family.

### Tertiary

- **Lane colours** (`--status-*`): indigo To Do, cyan-blue In Progress, purple In Review, green Done. Used for the status mark and the load rule, with `-ink` variants for words.
- **Palette** (`--c-<name>-*`): ten hues for labels and people: rose, rust, ochre, olive, moss, teal, azure, cobalt, plum, graphite. Each has a tint and ink for chips and a solid and on-colour for avatars.
- **Due state**: `--warning-*` for due soon, `--danger-*` for overdue.

### Neutral

- **Ground** (`--surface-ground`, `--surface-ground-gradient`): the board and page, with its wash in light mode. Text on the board has to hold its contrast over the deepest point of the wash.
- **Card and Overlay** (`--surface-card`, `--surface-overlay`): cards and inputs; panels, menus and dialogs.
- **Ink 1, 2, 3** (`--ink-*`): titles and values; secondary text and resting icons; meta and placeholders. Ink 3 is the lightest colour allowed for words.
- **Lines 1, 2, 3** (`--line-*`): rules inside a surface; lane rules and card edges; form field edges, which are the only lines that must reach 3:1.

### Named Rules

**The Data Hue Rule.** Hue goes on data (status, labels, people, due state) and on focus. If a coloured thing on screen doesn't tell you a fact about a task or where the keyboard is, make it neutral.

**The Stored Name Rule.** Members and labels store a palette name such as `rose`, never a hex value, so every old chip and timeline entry follows the current theme. The database enforces this.

## Typography

**Font:** Schibsted Grotesk Variable, self-hosted through `@fontsource-variable/schibsted-grotesk`, imported by `src/styles/base.css`, falling back to the system sans.

**Character:** a slightly newsy grotesque with enough personality to stop the product reading as a default UI, and sturdy enough for 12px metadata.

### Hierarchy

- **Display** (600, 24px, 32px line): first-run and failure headings only.
- **Title** (600, 20px, 28px line): the task title in the panel.
- **Board name and stat figures** (500–600, 15px, 22px line).
- **Body** (400, 14px, 20px line): card titles at weight 500, descriptions and comments at 400. Keep prose under 65ch; the panel width already enforces this.
- **Control** (500, 13px, 18px line): buttons, inputs in dense rows, lane names.
- **Meta** (400, 12px, 16px line): chips, timestamps, counts.
- **Initials** (600, 11px): avatars only. Nothing is ever smaller.

### Named Rules

**The Weight Before Size Rule.** Inside a lane, hierarchy comes from weight and ink, not bigger type. A board with five sizes on one card is shouting.

**The Steady Numbers Rule.** Counts, dates and stats use tabular figures, so they don't shift as they update.

## Layout

The page is three fixed bands and an open board: top bar (52px), filter bar (44px), and the lanes, which take the remaining height and scroll independently.

- **One gutter.** Chrome, lane headers and cards share a 16px left edge.
- **Lanes** are equal columns with a 280px minimum. They are divided by a `--line-2` rule, and the board scrolls sideways before a lane gets narrower than that.
- **Lane headers** (44px) stay pinned while the lane scrolls.
- **Task panel** is a 540px drawer from the right. The board stays visible behind it, so moving between tasks keeps context.

Responsive behaviour:

- **Above 1100px:** four lanes fit side by side.
- **720–1100px:** lanes scroll horizontally. The panel still covers part of the board, with a scrim.
- **Below 720px:** each lane is `calc(100vw - 48px)` wide with scroll snapping, so the next lane peeks in. The filter bar collapses to search plus a Filters button. The panel becomes a bottom sheet. While dragging, a tray with the four lanes appears at the bottom edge, because dragging to a lane that's off screen is otherwise impossible.
- **Coarse pointers:** every target is at least 44px, inputs are 16px so iOS doesn't zoom, and a card is picked up by long press (250ms) so that scrolling still works.

## Elevation & Depth

Flat at rest. Everything on the board plane uses tonal layering and hairlines. Shadows are for what floats, plus a small resting shadow on filled and outlined buttons.

### Shadow Vocabulary

- **Button** (`--button-shadow`, `--button-shadow-hover`): a small shadow at rest that deepens on hover and disappears when pressed.
- **Menu** (`--shadow-menu`): menus, popovers and tooltips.
- **Toast** (`--shadow-toast`): toasts.
- **Panel** (`--shadow-panel`): the task panel, cast leftwards.
- **Drag** (`--shadow-drag`): a card while being carried. The largest shadow in the system, seen only during the handoff.

### Named Rules

**The Resting Card Rule.** A card on the board has a 1px `--line-2` edge and no shadow. Depth appears when it leaves the board plane.

## Shapes

Tight radii that step down when nested: 10px for dialogs and toasts, 7px for cards, inputs and menus, 5px for controls, 3px for chips. Only avatars are fully round. A rounded pill would read as a consumer app.

## Components

### Status mark (signature)

Four short vertical status bars in a row, drawn in SVG at 14×12px. They fill from the left as the task advances: one for To Do, two for In Progress, three for In Review, four for Done. Filled bars use the lane colour and the rest use `--status-off`. The mark always comes with the lane name or an accessible label, so it never relies on colour.

### Load rule (signature)

A 2px rule under each lane header. It is filled in the lane colour in proportion to that lane's share of the board, so the distribution of work can be read at a glance. It animates width with `--dur-reorder`.

### Cards

- **Shape:** 7px radius, `--surface-card`, 1px `--line-2` edge, 12px padding, 8px between cards.
- **Content, in order:** title (14px, 500, up to three lines), then labels, then a meta row with priority, due date and comment count on the left and avatars on the right.
- **Empty rows disappear.** A card with only a title is a single line.
- **Hover:** `--surface-card-hover` and `--line-3` edge. **Selected (panel open):** 1px accent edge.
- **Actions menu:** a button in the top-right corner opens View details and Delete task. It sits beside the card rather than inside it, because the card is itself a button, and nested controls break screen readers. It appears on hover or focus, and is always visible on touch screens.
- **Saving:** no spinner on the card. It's optimistic. If the write fails, the card returns to its place and a toast explains why.

### Drag and drop (the handoff)

1. **Lift** (140ms, `--ease-out`): scale 1.025, rotate 1.25°, drag shadow.
2. **Carry:** the source stays as a dashed slot. Neighbours make room in 200ms. The target lane fills with `--accent-wash`, and its slot with `--accent-slot`.
3. **Drop** (220ms, `--ease-out`): the overlay settles into the slot, with no bounce.
4. **Keyboard:** Space picks up, arrows move, Space drops, Escape cancels. Each step is announced to screen readers using the lane names.

### Buttons

- **Primary:** Desk Ink fill, one per view, usually "New task".
- **Quiet:** no fill, Ink 2 text, `--surface-hover` on hover.
- **Danger:** only inside a confirmation dialog.
- **Outline:** a light face with a 1px edge, for the secondary action in a row.
- **All:** 30px in toolbars, 36px in forms and dialogs, and 44px on touch screens. Filled and outlined buttons move 1px down when pressed, and never move on hover. Quiet buttons scale by `--press-scale`.

### Chips

Labels use a 3px radius with palette tint and ink, at 12px. Filter chips use the same language and add a remove control. Due chips use warning or danger tints plus an icon, so state doesn't depend on colour alone.

### Avatars

Solid palette colour with one or two initials, 24px on cards and 28px in the panel. Stacks sit side by side with a 2px gap, because any overlap at this size clips the initials, and collapse to `+N` after three.

### Inputs / Fields

- **Style:** the `.field` frame: `--surface-card`, 1px `--line-3`, 7px radius, 36px high.
- **Focus:** the frame takes a 2px `--focus-ring` ring. The input inside has no outline of its own.
- **Error:** `--danger` edge, with a message below in `--danger-ink` that names the recovery.
- **Inline editing in the panel:** no visible frame until hover or focus, so the panel reads as a document.

### Task panel

Header with status, close and delete. Then title, description, then a properties grid (status, priority, due date, assignees, labels). Below that, a combined chronological timeline of comments and activity, with a comment box pinned to the bottom. Slides in over 280ms with `--ease-drawer`, and out over 200ms. Escape closes it and returns focus to the card.

### Timeline

Compact one-line entries, such as "Moved from To Do → In Progress · 2 hours ago", in meta type with a small icon. Comments get a full row with the body at 14px. Absolute timestamps are available on hover through the `title` attribute.

### Stats

Three figures in the top bar: total, completed and overdue. Plain figures with labels at 13–15px. Overdue takes `--danger-ink` only when it is above zero.

### States

- **First run:** the session is created silently, and the board shows a short heading with one action to create the first task. Sample data is never invented.
- **Empty lane:** a single line in Ink 3, such as "Nothing in review", with no illustration. A lane stays a valid drop target when it is empty.
- **Filtered to nothing:** says so, and offers a "Clear filters" action.
- **Loading:** skeleton cards in `--surface-skeleton`, shaped like real cards, with no spinner on the page. A 150ms delay avoids a flash on fast connections.
- **Failure to reach the server:** display heading, plain explanation and a Retry button. Writes that fail show a toast and roll back. Toasts appear bottom-right, or bottom-centre on phones.
- **Offline or realtime dropped:** a quiet "Reconnecting…" note in the top bar. The board stays usable.

## Do's and Don'ts

### Do:

- **Do** keep one filled action per view.
- **Do** use `--line-3` for anything the user must recognise as a form control.
- **Do** write each colour once, as `light-dark(light, dark)`, and recheck the Contrast table after changing one. This needs Chrome 123, Firefox 120 or Safari 17.5.
- **Do** animate only `transform`, `opacity` and colour on the board.

### Don't:

- **Don't** tint chrome with the accent. No indigo fills on toolbars or headers.
- **Don't** put lanes in cards, or add shadows to resting cards.
- **Don't** set any text below 11px, or any words lighter than Ink 3.
- **Don't** use a spinner where a skeleton or an optimistic update will do.
- **Don't** use a colour alone to carry state. Status has its mark, and due state has an icon.
- **Don't** invent sample tasks for a new guest on the live site. The demo board in `supabase/seed.sql` is for local development only.

## Contrast

`e2e/14-axe.spec.ts` runs axe on the rendered screens in both themes, so it catches a component using the wrong token. It checks text contrast only, and only for what is on screen. Non-text contrast (WCAG 1.4.11), such as field edges, focus rings and status marks, has no automated check, so measure those pairs by hand after changing them.

Every colour change has to keep these minimums:

| Foreground | Surfaces | Minimum |
|---|---|---|
| `--ink-1`, `--ink-2`, `--ink-3` | ground, card, overlay, hover | 4.5:1 |
| `--ink-on-action` | action | 4.5:1 |
| `--on-danger` | danger | 4.5:1 |
| `--accent-ink` | accent-tint, accent-wash, accent-slot | 4.5:1 |
| `--danger-ink` | danger-tint, card, overlay, ground | 4.5:1 |
| `--warning-ink` | warning-tint, card, overlay | 4.5:1 |
| `--success-ink` | success-tint | 4.5:1 |
| `--status-*-ink` | ground, card, overlay | 4.5:1 |
| `--priority-high` | card, overlay | 4.5:1 |
| `--c-*-ink` | its `--c-*-tint` | 4.5:1 |
| `--c-*-on` | its `--c-*-solid` | 4.5:1 |
| `--line-3`, `--focus-ring`, `--status-*` marks | ground, card | 3:1 |
