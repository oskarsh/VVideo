# VVideo project review

**Focus:** What’s unclear, what could be improved, and how to structure the left sidebar so it’s obvious that you can add a pane and text.

---

## 1. What’s unclear or could be improved

### 1.1 Left sidebar: “Pane” vs “Layer” and add flow

- **Current:** AssetsPanel has a “Layers” list (read-only thumbnails) and a “Track” line. PanesPanel has section title “Layers”, a + menu (Pane / Text), and the list of pane cards. New users may not see that the **+** is how you add both a **pane** (video/image/SVG) and **text**.
- **Improvement:** Make the add actions obvious: one clear “Layers” section that includes (1) the list of layer cards, (2) a visible “add” control (the + with “Pane” and “Text”), and (3) an **empty pane drop zone** so “drag and drop to add a layer” is visible. That way “add pane” and “add text” are both discoverable and “drop to add” is too.

### 1.2 Two places that mention “layers”

- **AssetsPanel:** “Layers” as a small label + list of thumbnails (from `getPanesForRender`) and “No layers. Add below.”
- **PanesPanel:** “Layers” as section heading + the actual pane list and add menu.

So “layers” appear in two sections. That’s correct (one is summary, one is editor) but the order and labels can be tuned so it reads as: **Background** → **Layers** (with add + drop zone + list).

### 1.3 Empty state

- When there are no panes, PanesPanel only showed “No layers. Add one below.” and the + menu. There was no visible drop target.
- **Improvement:** Show an **empty pane** card with copy like “Drag and drop to load your own video, image or SVG” and accept drops to create a new layer (using `addPaneWithMedia`). When layers exist, optionally show a smaller “Drop here to add another layer” at the bottom.

### 1.4 Rest of project

- **Build:** TASKSHEET mentions remaining build errors (EditorCanvas, LayoutContext, globalEffects). Worth fixing so `npm run build` is green.
- **CollapsibleSection:** Could be used more in the left sidebar for “Background” and “Layers” so the sidebar stays scannable.
- **Callback naming:** CODEBASE-REVIEW suggests aligning on `onChange` vs `onUpdate` when touching panels.
- **Right sidebar:** Already refactored (useFloatingPanels, PanelRow); left sidebar can follow the same style patterns (sectionHeadingClass, smallLabelClass, inputClass from `@/constants/ui`).

---

## 2. Left sidebar: best practices and structure

### 2.1 Recommended order (top → bottom)

1. **Background** – Load/replace/clear background video, aspect ratio, and a **summary** of layers (read-only thumbnails + “No layers” or “Layer 1, 2…”).
2. **Layers** – The real editing section:
   - Section title: “Layers”
   - Short line of copy: “Add a video, image, or text layer. Z-order: lower index = behind.”
   - **Add control:** + button with menu: “Pane” (video/image/SVG), “Text”
   - **Empty pane (drop zone):** When no layers, one card: “Drag and drop to load your own video, image or SVG.” When there are layers, a compact “Drop here to add another layer” at the bottom.
   - **List:** Pane 1, Pane 2, … (each with media, position, scale, animation, etc.)

This makes it clear: you can **add a pane**, **add text**, or **drop a file** to create a layer.

### 2.2 Naming

- **User-facing:** Use “layer” everywhere (Layers section, “Add layer”, “No layers”, “Drop here to add another layer”).
- **Code:** Keep `pane`, `panes`, `addPane`, `addPaneWithMedia` in types and store; only the UI copy says “layer”.

### 2.3 Visual hierarchy

- Use `sectionHeadingClass` for “Background” and “Layers”.
- Use `smallLabelClass` for labels above controls (e.g. “Load video”, “Media”, “Aspect ratio”).
- Use the shared card style: `rounded-lg border border-white/10 bg-white/5 p-3`.
- For the empty-pane drop zone: same card style with a dashed border and centered instructional text so it reads as a drop target.

---

## 3. File map (left sidebar)

| Concern | File |
|--------|------|
| Left sidebar layout | `src/components/Sidebar.tsx` |
| Background + layer summary | `src/components/AssetsPanel.tsx` |
| Layers (add pane/text + list + drop zone) | `src/components/PanesPanel.tsx` |
| Shared UI classes | `src/constants/ui.ts` |
| Style rules | `docs/STYLE-SYSTEM.md` |

---

## 4. Implemented in this pass

- **Empty pane drop zone** in PanesPanel:
  - When there are no layers: one card with “Drag and drop to load your video, image or SVG” and full drag-over/drop handling that calls `addPaneWithMedia`.
  - When there are layers: a smaller “Drop here to add another layer” card at the bottom with the same drop behavior.
- Both use the same file-type logic as the rest of the app (video, image, SVG). Styling follows STYLE-SYSTEM (card, borders, text hierarchy).
