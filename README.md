# ScribeCraft — Markdown to Handwritten Notes Converter

A desktop application built with **Electron**, **React**, and **TypeScript** that transforms Markdown documents into realistic handwritten notes on authentic notebook stationery and exports them directly to high-fidelity vector **PDFs**.

---

## Features

### 🖋️ 15 Diverse Handwriting Styles
- **Casual Print**: *Patrick Hand*, *Indie Flower*, *Kalam*, *Reenie Beanie*, *Nothing You Could Do*, *Just Another Hand*, *Nanum Pen Script*
- **Neat Penmanship**: *Caveat*, *Shadows Into Light*
- **Cursive & Calligraphy**: *Homemade Apple*, *Cedarville Cursive*, *Marck Script*
- **Technical & Architect**: *Architects Daughter*
- **Marker & Chalkboard**: *Gloria Hallelujah*, *Rock Salt*

### 📄 Authentic Paper Textures & Notebook Formats
- **Classic Ruled Notebook**: Blue horizontal ruling with classic red margin line and 3-hole binder punches.
- **College Ruled**: Tightly spaced rulings for lecture notes.
- **Engineering Grid**: Math and engineering graph paper.
- **Dotted Matrix**: Bullet journal style.
- **Yellow Legal Pad**: Canary yellow stationery with double red margin guide.
- **Vintage Parchment**: Warm sepia aged manuscript.
- **Clean Blank Sheet**: Minimalist stationery.
- **Slate Chalkboard**: Dark slate background with chalk handwriting.

### ✍️ Organic Handwriting Realism
- **Natural Pen Tremor / Jitter**: Built-in SVG fractal displacement engine that removes mechanical computer font perfection, introducing subtle human micro-wobbles.
- **Pen Stroke Weight**: Fine (0.5mm), Regular (0.7mm), Medium (1.0mm), Bold (1.2mm).
- **Ink Palette**: Royal Blue, Classic Navy, Gel Pen Black, Graphite Pencil, Teacher Red, Forest Emerald, Royal Purple, Sepia Brown, Chalk White + Custom Hex color picker.
- **Handwriting Slant**: Adjustable angle (-5° to +12°).
- **Paper Line Alignment**: Font size and line heights synchronize with paper rulings so text sits on the notebook lines.

### 📝 Markdown & Document Controls
- **Full Markdown Support**: Headers (`#`, `##`), bullet lists, blockquotes, code blocks, tables, and images.
- **Handwritten Checkboxes**: Interactive task items (`- [ ]` and `- [x]`).
- **Highlighter Markers**: Hand-drawn yellow, green, and pink highlights (`==highlight==`, `==pink:text==`, `==green:text==`).
- **Multi-Page Pagination**: Split notes across multiple sheets using `<!-- pagebreak -->`, `[pagebreak]`, or automatic smart section splitting.
- **Notebook Accents**: Customizable Date, Subject/Title header, and Page X of Y numbering.

### 🖨️ PDF Export
- Generates crisp vector PDFs using Electron's native printing engine with full background graphics and custom paper sizes (**A4** or **US Letter**, **Portrait** or **Landscape**).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

### 3. Launch ScribeCraft
```bash
npm start
```

### Development Mode
To run Vite live-reloading during development:
```bash
npm run dev:renderer
```
In another terminal:
```bash
npm run dev:electron
```

---

## Keyboard Shortcuts
- **Ctrl + O** / **Cmd + O**: Open Markdown file
- **Ctrl + S** / **Cmd + S**: Save current Markdown
- **Ctrl + E** / **Cmd + E**: Open PDF Export dialog

---

## Sample Notes Included
Located in the [`sample-notes/`](./sample-notes/) directory:
- `physics-lecture.md`: University physics notes with equations and checklists.
- `meeting-minutes.md`: Executive roadmap and action items table.
- `daily-journal.md`: Personal reflection and gratitude journal.
