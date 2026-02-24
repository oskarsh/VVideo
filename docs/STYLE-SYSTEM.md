# VVideo global style system

This doc is the **single source of truth** for UI styling in VVideo. Use it when adding or changing components so the app stays consistent. Another LLM or developer can follow this without guessing.

---

## 1. Stack and entry points

- **Styling**: Tailwind CSS only. No CSS-in-JS, no CSS variables (custom properties), no separate component CSS files.
- **Base styles**: `src/index.css` — Tailwind directives + `body` and `#root` + global `input[type='range']` rules.
- **Theme config**: `tailwind.config.js` — only `fontFamily` is extended (sans/mono → IBM Plex Mono). No custom colors, spacing, or radii.
- **Fonts**: Loaded in `index.html` (Google Fonts). **Only IBM Plex Mono is used** app-wide; Inter, Space Grotesk, Outfit, Syne are loaded but not referenced in Tailwind — avoid introducing them unless we explicitly add them to the config.

---

## 2. Color palette (semantic)

Background and text come from the page; everything else is white/opacity or accent colors.

| Role | Usage | Tailwind |
|------|--------|----------|
| **Page background** | App chrome, canvas area | Set in CSS: `#0f0f0f` (body in `index.css`) |
| **Page text** | Default copy | Set in CSS: `#e5e5e5` (body in `index.css`) |
| **Surfaces (cards, panels, inputs)** | Slightly raised from background | `bg-white/5`, `bg-white/10`, `bg-black/30` (darker inputs) |
| **Borders** | Dividers, input outlines, card edges | `border-white/10` default, `border-white/20` for inputs, `border-white/30` focus |
| **Text hierarchy** | Primary / secondary / muted | `text-white`, `text-white/80`–`text-white/90`, `text-white/60`, `text-white/50`, `text-white/40` |
| **Hover (neutral)** | Buttons, rows, links | `hover:bg-white/5`, `hover:bg-white/10`, `hover:bg-white/15`, `hover:text-white` |
| **Primary / success** | Toggle on state, at most one primary CTA per view (e.g. Save, Export) | `bg-emerald-600/80` + `hover:bg-emerald-500/90`, or `bg-emerald-500/30` + `border-emerald-500/50` for toggles |
| **Reserve emerald for** | Effect/enable toggles (on = green), and one main action per screen if needed | Do **not** use for: “Use texture”, “Add text”, list bullets, drop-zone hovers, trim handles, or preset chips — use secondary/neutral instead. |
| **Destructive** | Delete, remove, danger | `hover:bg-red-500/20 hover:text-red-300` or `bg-red-500/20 text-red-300` |
| **Selected / active** | Tabs, options, toggles | `bg-white text-black` (invert) |
| **Dropdowns / popovers** | Floating panels | `bg-zinc-900` + `border border-white/10` |
| **Right sidebar** | Right panel background | `bg-zinc-900/30` |

Use **white with opacity** for neutrals; use **emerald** only for toggle-on state and (optionally) one primary CTA per view. Use **red** for destructive. No blue, amber, or cyan accents — use neutral hover/selected (e.g. `bg-white text-black` for selected).

---

## 3. Typography

- **Font**: IBM Plex Mono everywhere (via Tailwind `font-sans` / `font-mono` and body in `index.css`).
- **Section headings** (sidebar sections, panel titles):  
  `text-xs font-semibold text-white/60 uppercase tracking-wider`  
  Optional spacing: `mb-2` or, in collapsible headers, `py-2.5`.
- **Small labels** (above inputs, small caps):  
  `text-[10px] text-white/50 uppercase tracking-wider block mb-1.5`
- **Body / list text**: `text-xs` or `text-sm`, with `text-white/70`, `text-white/60`, or `text-white/40` for secondary/muted.
- **Button / control text**: `text-xs` or `text-sm`; `font-medium` for primary actions.

Prefer **one** of the two label styles (section vs small label) per context; don’t mix arbitrarily.

---

## 4. Spacing and layout

- **Section spacing**: `space-y-4` or `space-y-6` between major sections; `space-y-2` or `space-y-3` inside a card.
- **Card padding**: `p-3` for standard cards/panels.
- **Gaps**: `gap-2`, `gap-3` for flex/grid; `gap-1` for tight groups (e.g. icon + text).
- **Sidebar width**: `w-72` for left and right sidebars.
- **Header**: `px-4 py-2`; `border-b border-white/10` for the bar under the header.

---

## 5. Borders and radius

- **Default border**: `border border-white/10`.
- **Inputs**: `border border-white/10` (default), `focus:border-white/30` (and `outline-none`).
- **Radius**:
  - Cards, panels, modals: `rounded-lg`
  - Buttons, inputs, small controls: `rounded` (Tailwind default) or `rounded-md` for slightly larger buttons
  - Thumbnails, color swatches: `rounded` or `rounded-lg` where it fits
- **Dividers**: `border-b border-white/10` or `border-t border-white/10`; use `last:border-b-0` on list containers to avoid double border.

---

## 6. Reusable patterns (copy-paste reference)

Use these exact patterns so we can later refactor to shared components or Tailwind @apply if needed.

**Section heading (e.g. “Background”, “Bezier”):**
```html
<h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Section name</h2>
```

**Small label above a control:**
```html
<span className="text-[10px] text-white/50 uppercase tracking-wider block mb-1.5">Label</span>
```

**Card / block container:**
```html
<div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">…</div>
```

**Text input (standard):**
```html
<input className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-xs text-white/80 focus:border-white/30 outline-none" />
```
(Or use the shared `inputClass` in `EffectsPanel.tsx` if you add a shared constants file.)

**Secondary button (default state):**
```html
<button className="rounded px-2 py-1.5 bg-white/10 border border-white/20 text-white text-xs hover:bg-white/15">Label</button>
```

**Primary/success button:**
```html
<button className="rounded px-2 py-1.5 bg-emerald-600/80 text-white text-xs font-medium hover:bg-emerald-500/90">Label</button>
```

**Selected tab/option (inverted):**
```html
<button className="… bg-white text-black …">Selected</button>
```

**Unselected tab/option:**
```html
<button className="… bg-white/10 text-white/80 hover:bg-white/20 …">Option</button>
```

**Destructive secondary button:**
```html
<button className="… bg-white/10 text-white/80 … hover:bg-red-500/20 hover:text-red-300">Delete</button>
```

**Collapsible section row (clickable):**
```html
<div className="flex cursor-pointer items-center gap-2 border-b border-white/10 py-2 last:border-b-0 hover:bg-white/5">…</div>
```

**Dropdown / popover container:**
```html
<div className="… rounded-lg border border-white/10 bg-zinc-900 shadow-xl z-50 …">…</div>
```

---

## 7. Inconsistencies to fix over time (pull it straight)

These were previous deviations; most are now enforced. When you touch the code, keep following the standard.

1. **Inputs**: **Standard**: `bg-black/30 border border-white/10` for text/number inputs; add `focus:border-white/30 outline-none`. Use `bg-white/10 border-white/20` only for button-like controls (e.g. tab strips, file button).
2. **Section titles**: Some places use the small label style (`text-[10px] text-white/50`) for what are really section titles. Prefer the section heading style (`text-xs font-semibold text-white/60 uppercase tracking-wider`) for section titles, and the small label only for labels directly above a single control.
3. **Border radius**: Use `rounded-lg` for cards/panels/modals, `rounded` or `rounded-md` for buttons/inputs.
4. **Font size on buttons**: Prefer `text-xs` in sidebars and dense panels, `text-sm` in header or modals for emphasis.
5. **Unused fonts**: Inter, Space Grotesk, Outfit, Syne are loaded in `index.html` but not used. Either remove them from the font link or add them to `tailwind.config.js` and use deliberately.

6. **Reserve emerald**: Use green only for effect/toggle "on" state and (if needed) one primary CTA per view. Use secondary (`bg-white/10` + hover) for "Use texture", "Add text", apply, and selected preset/chip; use `bg-white text-black` for selected option/tab.

---

## 8. Quick checklist for new UI

- [ ] Uses only Tailwind classes (no inline styles except for layout/position hacks like `pointerEvents`).
- [ ] Backgrounds use `white/5`, `white/10`, or `black/30` (or zinc for dropdowns/sidebar); no new hex colors for surfaces.
- [ ] Borders use `border-white/10` (or `/20` for inputs, `/30` on focus).
- [ ] Section titles use the section heading class; labels above fields use the small label class.
- [ ] Buttons: secondary = `bg-white/10` + hover; reserve emerald for toggle-on and at most one CTA per view; destructive = red; selected = `bg-white text-black`.
- [ ] Radius: `rounded-lg` for cards/panels, `rounded` or `rounded-md` for controls.
- [ ] Font: rely on body/Tailwind (IBM Plex Mono); no other font families unless added to the config and this doc.

---

## 9. Where to look in code

| What | Where |
|------|--------|
| Base styles, body, range inputs | `src/index.css` |
| Tailwind theme (fonts) | `tailwind.config.js` |
| Shared input / section / label classes | `src/constants/ui.ts` |
| Shared input style (legacy ref) | `src/components/EffectsPanel.tsx` → now uses `@/constants/ui` |
| Section/chapter UI | `src/components/CollapsibleSection.tsx` |
| Sidebar layout, header, modals | `src/App.tsx` |
| Panels (assets, effects, global effects) | `src/components/AssetsPanel.tsx`, `EffectsPanel.tsx`, `GlobalEffectsPanel.tsx` |
| Dropdowns | `src/components/PresetDropdown.tsx` |

When adding new components, mirror the patterns from these files and this doc so the style system stays consistent.
