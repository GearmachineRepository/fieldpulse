# CruPoint Design System

Single source of truth for all UI decisions. Every component, page, and layout in the CruPoint codebase references these tokens, patterns, and rules.

Token files live in `src/ui/tokens/` and are imported once via `src/ui/tokens/index.css`. All custom properties are globally available to every CSS Module.

---

## Foundations

### Color Tokens

All colors are defined as CSS custom properties on `:root`. Dark mode overrides activate via `[data-theme="dark"]` on `<html>`.

#### Surface

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg` | `#F4F5F7` | `#0E1117` | Page background |
| `--s1` | `#FFFFFF` | `#161B23` | Card / panel surface |
| `--s2` | `#F0F2F5` | `#1D2430` | Input background, hover state |
| `--s3` | `#E8EDF2` | `#242D3A` | Tertiary surface |

#### Borders

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bd` | `#DDE2E8` | `#252D3A` | Default border (cards, inputs) |
| `--bd2` | `#C8D0D8` | `#2E3848` | Stronger border (filter inputs, hover) |
| `--bd3` | `#B0BBC6` | `#3A4557` | Strongest border (emphasis) |

#### Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--t1` | `#0F1923` | `#E8EDF3` | Primary text (headings, body) |
| `--t2` | `#4A5568` | `#8A97A8` | Secondary text (descriptions, labels) |
| `--t3` | `#8896A4` | `#4E5D6E` | Muted text (placeholders, captions) |

#### Accent (Amber -- Primary Brand)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--amb` | `#D97706` | `#E8930A` | Primary accent (buttons, links, active states) |
| `--amb2` | `#E8930A` | `#F5A623` | Hover accent |
| `--amb-dim` | `#FEF3DC` | `#2A1F08` | Accent background (selected cards, focus rings) |
| `--amb-mid` | `#FDE8B4` | `#3D2D0A` | Accent border |
| `--amb-text` | `#1A0D00` | `#1A0D00` | Text color ON amber backgrounds |

#### Status Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--grn` | `#059669` | `#16A37F` | Active, success, approved |
| `--grn-dim` | `#ECFDF5` | `#0C2420` | Success background |
| `--red` | `#DC2626` | `#E05252` | Error, danger, issue |
| `--red-dim` | `#FEF2F2` | `#281414` | Error background |
| `--blu` | `#2563EB` | `#4A90D9` | Informational, link |
| `--blu-dim` | `#EBF2FF` | `#0E1E30` | Info background |

#### Sidebar & Rail (Dark Warm Palette)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--rail-bg` | `hsl(30, 8%, 11%)` | `hsl(30, 6%, 8%)` | Icon rail background |
| `--sb-bg` | `hsl(30, 8%, 14%)` | `hsl(30, 6%, 10%)` | Sidebar background |
| `--sb-text` | `hsl(30, 8%, 70%)` | `hsl(30, 8%, 65%)` | Sidebar text |
| `--sb-text-active` | `var(--amb)` | `var(--amb)` | Active sidebar item text |
| `--sb-hover` | `hsl(30, 8%, 18%)` | `hsl(30, 6%, 14%)` | Sidebar hover background |
| `--sb-active-bg` | `hsla(38, 92%, 50%, 0.08)` | `hsla(38, 92%, 50%, 0.10)` | Active sidebar item background |
| `--sb-divider` | `hsl(30, 8%, 22%)` | `hsl(30, 6%, 16%)` | Sidebar section divider |
| `--sb-section` | `hsl(30, 8%, 50%)` | `hsl(30, 8%, 45%)` | Section header text |

#### Overlay

| Token | Value | Usage |
|-------|-------|-------|
| `--color-overlay` | `rgba(0, 0, 0, 0.45)` | Modal/panel backdrop |

### Typography Scale

Font stacks and scale are defined in `src/ui/tokens/typography.css`.

#### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--fn` / `--font-sans` | `'IBM Plex Sans', system-ui, sans-serif` | All UI text |
| `--mono` / `--font-mono` | `'IBM Plex Mono', monospace` | Numbers, dates, times, counts, data values |

#### Size Scale (rem-based, 12px minimum)

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--text-xs` | `0.75rem` | 12px | Labels, badges, captions, table headers |
| `--text-sm` | `0.8125rem` | 13px | Secondary text, filter inputs, pagination |
| `--text-md` | `0.9375rem` | 15px | Emphasized body text |
| `--text-base` | `0.875rem` | 14px | Default body text, form inputs |
| `--text-lg` | `1rem` | 16px | Card titles, modal titles, section headers |
| `--text-xl` | `1.125rem` | 18px | Page titles, empty state titles |
| `--text-2xl` | `1.375rem` | 22px | Large headings |
| `--text-3xl` | `1.75rem` | 28px | Hero / dashboard stat values |

#### Font Weights (ceiling: 600)

| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | `400` | Body text |
| `--font-medium` | `500` | Emphasized text, active filters |
| `--font-semibold` | `600` | Headings, buttons, labels -- MAXIMUM weight |

**Important:** `--font-bold`, `--font-extrabold`, and `--font-black` are all aliased to `600`. Never use `font-weight: 700` or above.

#### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--leading-tight` | `1` | Compact single-line elements |
| `--leading-snug` | `1.3` | Dense text, headings |
| `--leading-normal` | `1.5` | Body text, descriptions |

#### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-label` | `1px` | Uppercase form labels |
| `--tracking-section` | `0.8px` | Section headers in sidebar |
| `--tracking-brand` | `4px` | Brand name display |

### Spacing Scale

Based on a 4px grid. Defined in `src/ui/tokens/spacing.css`.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps (label to input, icon gaps) |
| `--space-2` | `8px` | Small gaps (button icon gap, list item padding) |
| `--space-3` | `12px` | Medium gaps (card padding compact, field group margins) |
| `--space-4` | `16px` | Standard gaps (page section margins, modal overlay padding) |
| `--space-5` | `18px` | Card padding, modal header/body padding |
| `--space-6` | `20px` | Modal horizontal padding |
| `--space-8` | `24px` | Confirm modal padding |
| `--space-10` | `32px` | Select padding-right (arrow space) |
| `--space-12` | `40px` | Large padding (empty states, loading areas) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `2px` | Close buttons, small interactive elements |
| `--r` / `--radius-md` | `3px` | **Default** -- buttons, inputs, cards, tables, badges |
| `--radius-lg` | `4px` | Modals -- **absolute maximum for rectangular elements** |
| `--radius-full` | `9999px` | Pill badges, avatar circles only |

**Rule:** `--radius-xl` and `--radius-2xl` are aliased to `--radius-lg` (4px). No element should ever have a border-radius above 4px, except pills/avatars using `--radius-full`.

### Elevation / Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` | Cards at rest |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.07)` | Card hover, dropdown menus |
| `--shadow-lg` | `0 10px 40px rgba(0,0,0,0.1)` | Modals, slide panels |
| `--shadow-toast` | `0 8px 32px rgba(0,0,0,0.25)` | Toast notifications |

### Z-Index Layers

| Token | Value | Usage |
|-------|-------|-------|
| `--z-panel` | `200` | SlidePanel and its backdrop |
| `--z-sidebar` | `250` | Mobile sidebar overlay |
| `--z-modal` | `300` | Modals and confirm dialogs |
| `--z-toast` | `400` | Toast notifications (always on top) |

### Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `0.15s ease` | Hover states, border-color changes |
| `--transition-base` | `0.2s ease` | General transitions |
| `--transition-slide` | `0.25s cubic-bezier(0.4, 0, 0.2, 1)` | Slide animations (panel, sidebar) |

### Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `--rail-width` | `48px` | Icon rail width |
| `--sidebar-width` | `200px` | Section sidebar width |
| `--max-width-page` | `900px` | Maximum page content width |

---

## Components

### Buttons

**File:** `src/ui/primitives/Button.jsx` + `Button.module.css`

#### Variants

| Variant | Background | Text Color | Usage |
|---------|-----------|------------|-------|
| `accent` (default) | `--amb` | `--amb-text` (`#1A0D00`) | Primary actions (Save, Add, Submit) |
| `blue` | `--blu` | `#fff` | Informational actions |
| `red` | `--red` | `#fff` | Destructive actions (Delete) |
| `ghost` | `transparent` | `--t2` | Secondary actions, toolbar buttons |
| `outline` | `transparent` | `--amb`, border: `--amb-mid` | Tertiary actions |

#### Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | `28px` | `0 12px` | `--text-xs` (12px) |
| `md` | `36px` | `0 16px` | `--text-sm` (13px) |
| `lg` (default) | `44px` | `0 18px` | `--text-base` (14px) |

#### States

- **Hover (outline):** background becomes `--amb-dim`
- **Hover (ghost):** background becomes `--bd`
- **Active:** `transform: scale(0.98)` press feedback
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`
- **Loading:** shows a spinner (18px, 2.5px border), pointer-events disabled

#### Props

```jsx
<Button
  variant="accent"   // 'accent' | 'blue' | 'red' | 'ghost' | 'outline'
  size="lg"          // 'sm' | 'md' | 'lg'
  fullWidth={true}   // boolean
  disabled={false}   // boolean
  loading={false}    // boolean
  onClick={fn}
/>
```

### Inputs

**File:** `src/ui/primitives/Input.jsx` + `Input.module.css`

#### Specifications

| Property | Value |
|----------|-------|
| Height | `36px` |
| Padding | `0 12px` |
| Border | `1px solid --bd` |
| Border radius | `--r` (3px) |
| Background | `--s1` |
| Font size | `--text-base` (14px) |
| Font family | `--fn` (IBM Plex Sans) |
| Placeholder color | `--t3` |

#### Focus State

- Border: `--amb` (amber)
- Box shadow: `0 0 0 2px --amb-dim` (amber glow ring)

#### Error State

- Border: `--red`
- Focus box shadow: `0 0 0 2px --red-dim`
- Error message: `--text-xs`, color `--red`, weight `--font-medium`

#### Textarea

- Same styling as input, but `height: auto`, `min-height: 72px`, `resize: vertical`
- Padding: `8px 12px`

#### Select

- Same height and styling as input
- Custom chevron SVG via `background-image`
- `appearance: none`, `padding-right: 32px` for arrow space
- `cursor: pointer`

#### Label Pattern

```css
font-size: var(--text-xs);      /* 12px */
font-weight: var(--font-semibold); /* 600 */
color: var(--t3);
text-transform: uppercase;
letter-spacing: var(--tracking-label); /* 1px */
margin-bottom: 2-4px;
```

### Badges / Status Indicators

**File:** `src/ui/primitives/Badge.jsx` + `Badge.module.css`

#### Variants

| Variant | Background | Text | Border | When to Use |
|---------|-----------|------|--------|-------------|
| `accent` | `--amb-dim` | `--amb` | `--amb-mid` | Primary status (active, in-progress) |
| `blue` | `--blu-dim` | `--blu` | `#BFDBFE` | Informational (pending, scheduled) |
| `amber` | `--amb-dim` | `--amb2` | `--amb-mid` | Warning, attention needed |
| `red` | `--red-dim` | `--red` | `#FECACA` | Error, expired, overdue |
| `neutral` | `--s2` | `--t2` | `--bd` | Default, inactive, archived |

#### Specifications

| Property | Value |
|----------|-------|
| Padding | `3px 10px` |
| Border radius | `--radius-full` (9999px -- pill shape) |
| Font size | `--text-xs` (12px) |
| Font weight | `600` |
| Border | `1px solid` |

#### Rule

Every status display MUST use a badge. Never represent status with color alone. Always include a colored dot or icon alongside the text label for accessibility.

### StatCard

StatCards are built using the `Card` primitive with custom internal layout.

#### Specifications

| Property | Value |
|----------|-------|
| Background | `--s1` |
| Border | `1px solid --bd` |
| Border radius | `--r` (3px) |
| Shadow | `--shadow-sm` |
| Padding | `--space-5` (18px) |
| Left accent bar | `3px wide`, color varies by status |

#### Internal Layout

- **Value:** `font-family: var(--mono)`, large size (`--text-2xl` or `--text-3xl`), weight `600`
- **Label:** `font-size: var(--text-xs)`, `text-transform: uppercase`, `letter-spacing: var(--tracking-label)`, color `--t3`
- **Trend indicator (optional):** small badge showing +/-% change

### Card

**File:** `src/ui/primitives/Card.jsx` + `Card.module.css`

#### Variants

| Variant | Border | Background | Usage |
|---------|--------|------------|-------|
| `default` | `--bd` | `--s1` | Standard content card |
| `interactive` | `--bd` | `--s1` | Clickable card (cursor: pointer) |
| `selected` | `--amb` | `--amb-dim` | Selected/active state |
| `danger` | `--red` at 30% | `--red-dim` | Warning card |
| `info` | `--blu` at 30% | `--blu-dim` | Informational card |

#### States

- **Hover (clickable):** `box-shadow: --shadow-md`, `border-color: --bd2`
- **Compact:** padding `12px 16px` instead of `18px`

#### Sub-components

- `Card.Header` -- flex row with `title` (16px, semibold) + optional `subtitle` (13px, `--t3`) + `action` slot

### DataTable

**File:** `src/ui/primitives/DataTable.jsx` + `DataTable.module.css`

#### Specifications

| Element | Height | Font Size | Weight | Color |
|---------|--------|-----------|--------|-------|
| Header (`th`) | `40px` (12px padding top/bottom + content) | `12px` | `600` | `--t3` |
| Data row (`td`) | `48px` (14px padding top/bottom + content) | `14px` | `400` | `--t1` |
| Pagination | auto | `13px` | `500` (info), `600` (buttons) | `--t3` |

#### Header Style

```css
text-transform: uppercase;
letter-spacing: 0.5px;
background: var(--bg);
border-bottom: 1px solid var(--bd);
white-space: nowrap;
user-select: none;
```

#### Row States

- **Hover (clickable):** `background: var(--bg)`
- **Row separator:** `1px solid --bd` between rows (not on last)
- **Sort icon active:** color `--amb`
- **Sort icon inactive:** `opacity: 0.4`

#### Pagination Bar

- Flex row, `space-between`
- Page info: "1-20 of 150"
- Prev/Next buttons: `3px` radius, `1px` border, `13px` font
- Disabled button: `opacity: 0.4`

#### Responsive (below 768px)

- `th` and `td` padding reduces to `10px 12px`
- Pagination stacks vertically

### FilterBar

**File:** `src/app/dashboard/components/FilterBar.jsx` + `FilterBar.module.css`

A composable horizontal filter row with search, dropdowns, date range, and action slots.

#### Layout

- Flex row, `space-between`, `gap: 12px`, wraps on small screens
- Left side: search + filters + date range (flex: 1)
- Right side: action buttons (flex-shrink: 0)

#### Search Input

| Property | Value |
|----------|-------|
| Height | `36px` |
| Min width | `200px` |
| Max width | `320px` |
| Icon | `Search` from lucide, 15px, positioned absolutely at left 12px |
| Left padding | `calc(12px + 20px)` to clear icon |
| Border | `1px solid --bd2` |
| Focus border | `--amb` |

#### Select Dropdowns

| Property | Value |
|----------|-------|
| Height | `36px` |
| Min width | `120px` |
| Font size | `--text-sm` (13px) |
| Text color | `--t2` |
| Border | `1px solid --bd2` |

#### Date Range Inputs

- Font family: `--mono` (monospace for dates)
- Same height and border styling as other filter inputs

#### When to Use FilterBar vs FilterPills

- **FilterBar (dropdowns):** Default choice. Use whenever the filter set is dynamic, user-configurable, or could have many options.
- **FilterPills:** Only for stable, non-configurable categories with fewer than 7 options (e.g., fixed hazard types).

### FilterPill

Inline toggle buttons for filtering by category.

#### When Appropriate

- The categories are fixed and cannot be added/removed by users
- There are fewer than 7 options
- The values are stable across all tenants

If users can manage their own categories, always use a dropdown instead. Pills break down with many items.

### DropdownFilter

**File:** `src/app/dashboard/components/PageUI.jsx`

A searchable, single-select dropdown with optional "Create New" action.

#### Specifications

| Element | Spec |
|---------|------|
| Trigger | `36px` height, border `--bd`, hover border `--bd2` |
| Menu | `220px` width, max-height `300px`, shadow `--shadow-md` |
| Search input inside | `32px` height, background `--s2` |
| Option height | `32px` |
| Active option | background `--amb-dim`, color `--amb`, weight `500` |
| Color dot | `8px` circle, `--radius-full` |
| "Create New" button | color `--amb`, hover bg `--amb-dim` |

### Empty State

**File:** `src/ui/primitives/EmptyState.jsx` + `EmptyState.module.css`

Every empty view MUST include all four elements:

1. **Icon** -- 40px emoji or icon
2. **Title** -- `--text-xl` (18px), weight `600`, color `--t1`
3. **Subtitle** -- `--text-sm` (13px), color `--t3`, max-width `300px`
4. **CTA Button** -- action to resolve the empty state

#### Layout

- Centered column, padding `40px 16px`
- Gap: icon to title `12px`, title to subtitle `4px`, subtitle to CTA `16px`

### SlidePanel

**File:** `src/app/dashboard/components/SlidePanel.jsx` + `SlidePanel.module.css`

Right-side detail panel that slides in over content.

#### Specifications

| Property | Value |
|----------|-------|
| Z-index | `200` (`--z-panel`) |
| Default width | `420px` |
| Background | `--s1` |
| Border-left | `1px solid --bd` |
| Shadow | `--shadow-lg` |
| Slide animation | `translateX(100%) -> translateX(0)`, `0.2s ease-out` |
| Backdrop | `rgba(0, 0, 0, 0.2)`, fade-in `0.15s` |

#### Header

- Flex row, `space-between`
- Title: `--text-lg` (16px), weight `600`
- Close button: `32px` square, icon `18px`, radius `--r`

#### When to Use

- **SlidePanel:** Viewing/editing details of a list item. User can still see the list behind the panel.
- **Modal:** Creating or editing a standalone entity via a form. Use when the context behind doesn't matter.

#### Responsive

- Below 640px: panel goes full-width (`width: 100vw`)

### Modal

**File:** `src/ui/primitives/Modal.jsx` + `Modal.module.css`

Centered dialog with focus trap and Escape-to-close.

#### Sizes

| Size | Max Width |
|------|-----------|
| `sm` | `480px` |
| `md` (default) | `640px` |
| `lg` | `900px` |

#### Specifications

| Property | Value |
|----------|-------|
| Z-index | `--z-modal` (300) |
| Border radius | `--radius-lg` (4px) -- the maximum |
| Shadow | `--shadow-lg` |
| Max height | `90vh` |
| Overlay | `--color-overlay` (`rgba(0,0,0,0.45)`), fade-in `0.15s` |
| Dialog animation | `slideUp` -- `translateY(12px) -> translateY(0)`, `0.2s ease` |

#### Header

- Title: `--text-lg` (16px), weight `600`
- Close button: `32px` square, radius `--radius-sm`

#### Footer (ModalFooter)

- Flex row, `space-between`
- Left: optional Delete button (`--red-dim` bg, `--red` text)
- Right: Cancel + Save buttons
- All footer buttons: `36px` height
- Save button: amber primary (`--amb` bg, `--amb-text` text)

#### Confirm Modal

- Max width: `380px`
- Centered text layout with danger icon (`44px` circle, `--red-dim` bg)
- Two equal-width buttons: Cancel (outline) + Confirm (colored, default `--red`)
- Z-index: `calc(--z-modal + 10)` -- stacks above regular modals

#### When to Use

Use modals ONLY for create/edit forms. For viewing details of list items, use SlidePanel instead.

#### Accessibility

- Focus trap: Tab cycles through focusable elements
- Escape key closes the modal
- `role="dialog"`, `aria-modal="true"`
- First focusable element receives focus on open

### TabBar

**File:** `src/ui/primitives/Tabs.jsx` + `Tabs.module.css`

Segmented control style tabs for switching views within a page.

#### Specifications

| Property | Value |
|----------|-------|
| Container | background `--s1`, border `1.5px solid --bd`, radius `--radius-lg`, padding `--space-1` |
| Tab button | flex: 1, centered, radius `3px` |
| Inactive | color `--t3`, background transparent |
| Active | color `--color-text-inverse` (white), background `--amb` |
| Font | `--text-sm` (13px), weight `600` |
| Padding | `12px 0` |
| Margin below tabs | `--space-5` (18px) |

#### Props

```jsx
<Tabs
  tabs={[{ key: 'overview', label: 'Overview' }, { key: 'details', label: 'Details' }]}
  active="overview"
  onChange={(key) => setTab(key)}
/>
```

### SkeletonRow / SkeletonCard

**File:** `src/ui/primitives/Skeleton.jsx` + `Skeleton.module.css`

Animated shimmer placeholders for loading states.

#### Variants

| Variant | Default Height | Default Width | Usage |
|---------|---------------|---------------|-------|
| `text` | `14px` | `100%` | Table cell, body text placeholder |
| `heading` | `20px` | `60%` | Title placeholder |
| `circle` | (set via props) | (set via props) | Avatar placeholder |
| `card` | `120px` | `100%` | Full card placeholder |

#### Animation

```css
background: linear-gradient(90deg,
  var(--bd) 25%,
  var(--bg) 50%,
  var(--bd) 75%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

The shimmer sweeps left-to-right continuously. Border radius is `3px` for all variants except `circle` (which uses `50%`).

#### Props

```jsx
<Skeleton variant="text" />
<Skeleton variant="heading" />
<Skeleton variant="card" height={80} />
<Skeleton variant="circle" width={36} height={36} />
```

---

## Layout Patterns

### Dashboard / Overview

A stat row across the top followed by a card grid.

```
[ Stat ] [ Stat ] [ Stat ] [ Stat ]
[ Card            ] [ Card           ]
[ Card            ] [ Card           ]
```

- Stat cards in a responsive grid (auto-fit, min 200px)
- Content cards below in 2-column grid
- All cards use `Card` primitive with `--shadow-sm`

### List-Detail Split

Used when a page has a list of items on the left and detail view on the right.

```
|  List (280px)  |  Detail (remaining)  |
```

- Left panel: fixed 280px, scrollable list
- Right panel: fills remaining space
- Implemented via `DetailLayout` component
- On mobile: collapses to single column, list view with tap-to-detail

### Table + FilterBar

The most common page pattern: a filter row above a full-width data table.

```
[ Search... ] [ Status v ] [ Category v ]  [ + Add ]
|  NAME  |  STATUS  |  DATE  |  ACTIONS  |
|  Row 1                                   |
|  Row 2                                   |
|  Row 3                                   |
[ Showing 1-20 of 50          Prev | Next ]
```

- FilterBar at top with search + dropdowns on left, action buttons on right
- DataTable below, full width
- Row click opens SlidePanel for details
- Add button opens Modal for creation

### Wizard

Step-by-step form flow for compliance-critical processes.

```
[ Step 1 ] [ Step 2 ] [ Step 3 ] [ Step 4 ]
          (amber active pill)

  Form content for current step

              [ Back ] [ Next ]
```

- Step indicator pills across the top
- Active step: amber background
- Completed steps: checkmark
- Future steps: muted, not clickable
- **Cannot skip steps** -- this is a legal/compliance requirement
- Back/Next buttons at the bottom

### Settings

Fixed navigation on the left, content area on the right.

```
|  Nav (200px)  |  Content (remaining)  |
```

- Left nav: `200px` width, same sidebar styling
- Content: scrollable, padded
- Section headers with descriptions

---

## Navigation Rules

### Sidebar Structure

The app uses a dual-rail navigation: a 48px icon rail on the left that expands on hover, plus a 200px sidebar showing pages for the active section.

#### Full Navigation Tree

```
Rail Section          Sidebar Pages
-------------------   -----------------------------------
Dashboard             (single page, no sidebar)
Projects              All Projects, Schedule
Operations            Clock-In, Routes (coming soon)
People                Employees, Crews
Fleet                 Vehicles, Equipment
Compliance            Training, Certifications, Incidents
Resources             Documents, SDS Library
Reports               Overview, Crew Performance, Compliance
Modules               (dynamic -- shows enabled modules)
Settings              (single page, no sidebar)
```

#### Rail Behavior

- Width: `48px`, expands to `~160px` on hover as an overlay
- Dark warm background (`--rail-bg`)
- Active section: amber text + amber-tinted background
- Separator line before "Modules" and "Settings"
- Hidden on mobile (hamburger menu instead)

#### Sidebar Behavior

- Width: `200px`
- Shows only when active section has multiple pages
- Single-page sections (Dashboard, Settings) hide the sidebar
- Workspace name and role shown at top
- User info shown at bottom
- Mobile: full overlay via hamburger, shows all sections grouped

### When Items Appear/Disappear

- **Modules section:** Only visible when `ENABLED_MODULES.length > 0`. Each enabled module gets its own page entry.
- **"Coming Soon" items:** Shown with muted style and "Soon" badge, not clickable.
- **Module badges:** Pages that are module-specific show a "MOD" badge.

### Breadcrumb Pattern

The topbar shows a breadcrumb trail: `Section / Page Title`.

- Section name links back to the section's default page
- Current page title is displayed as non-clickable text (semibold)
- Separator: `/` character in muted color

---

## Rules That Must Never Be Broken

These are non-negotiable constraints. Every component, every page, every PR must comply.

### Typography

- **Font:** IBM Plex Sans for all UI text. IBM Plex Mono for ALL numbers, dates, times, counts, monetary values, and data points.
- **Weight ceiling:** `600` (semibold) is the maximum. Never use `700` (`bold`) or above. The tokens alias `--font-bold`, `--font-extrabold`, and `--font-black` all to `600` as a safety net.
- **Minimum size:** `12px` (`--text-xs`). No text in the application should be smaller.

### Color

- **Primary accent is amber** (`#D97706`) -- not blue, not green. Amber is the brand color for all primary actions, active states, focus rings, and interactive highlights.
- **Status colors are semantic:** green = success/active, red = error/danger, blue = informational, amber = warning/attention. Never swap these meanings.

### Border Radius

- **Default:** `3px` (`--r`) for all standard elements (buttons, inputs, cards, tables).
- **Maximum for rectangles:** `4px` (`--radius-lg`) for modals only.
- **Never above 4px** for any rectangular element. The only exception is `--radius-full` (9999px) for pill badges and avatar circles.

### Dimensions

- **Input height:** `36px` -- all text inputs, selects, date inputs, search bars, and filter dropdowns.
- **Table header height:** `40px` effective (12px padding top + 16px content + 12px padding bottom).
- **Table data row height:** `48px` effective (14px padding top + 20px content + 14px padding bottom).
- **Sidebar width:** `200px`.
- **Rail width:** `48px`.
- **Topbar height:** `48px`.

### Status Display

- **Every status = badge + dot (or icon), never color alone.** Accessibility requires that status is not communicated solely through color. Always use a `Badge` component with a visible label.

### Loading States

- **Use `Skeleton` components (shimmer)** for loading states. Never use spinners in content areas.
- `SkeletonRow` for table rows, `SkeletonCard` for cards, `Skeleton variant="text"` for inline text.
- Animation: `1.5s` shimmer sweep, linear gradient from `--bd` through `--bg` and back.

### Empty States

- **Every empty state must include all four elements:**
  1. Icon (40px emoji or lucide icon)
  2. Title (18px, semibold)
  3. Description (13px, muted)
  4. CTA button (actionable -- e.g., "Add First Vehicle", "Import Data")
- Never show a blank area or just the text "No data."

### Sidebar

- **Width:** `200px`, always dark warm palette.
- **Background:** `hsl(30, 8%, 14%)`.
- Active item uses amber text and a subtle amber-tinted background (`hsla(38, 92%, 50%, 0.08)`).

### Topbar

- **Height:** `48px`.
- Contains breadcrumb on left, date + "New" button on right.

### Filters

- **Dropdowns are the default** for filtering. Use `FilterBar` with search + select dropdowns.
- **Pills only when:** categories are fixed, non-user-configurable, and fewer than 7 options.
- **If users can add/remove categories:** always use a dropdown. Pills cannot accommodate dynamic category lists.

### Modals vs. Panels

- **Modal:** for creating or editing entities (forms). Centered, focus-trapped.
- **SlidePanel:** for viewing details of a list item. Slides from right, list remains visible behind.
- Never use a modal for detail viewing. Never use a slide panel for creation forms.
