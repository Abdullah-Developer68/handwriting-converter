# Agent Instructions & Project Guidelines

## Core Invariant Principles

### 1. Default Clean State (Zero Pre-Inserted Content)
- **CRITICAL**: By default, the software must **NEVER** insert, hardcode, or pre-populate any content, text, notes, assignments, or headers onto the pages or in the editor.
- The initial editor content and document state must always be completely blank and clean (`""`).
- **The user will insert and manage their own content. The software must not do it automatically.**

### 2. No Default Stamping (Headers & Page Numbers)
- Headers, dates, subjects, and page numbers must remain disabled by default:
  - `showHeader: false`
  - `headerDate: ''`
  - `headerSubject: ''`
  - `showPageNumbers: false`
- The software must never print automatic numbering (such as `1 / 2`) or subject headers onto paper sheets unless explicitly toggled on and customized by the user in the styles settings.

### 3. Maximum Paper Line Utilization
- Ruled notebook lines must be utilized fully from top to bottom before breaking to a new sheet.
- Content must never be arbitrarily cut short or leave half the page empty.
- Paragraphs and long sections must split cleanly at sentence/clause boundaries across sheets to ensure continuous, natural handwriting flow.
- Exact sheet dimensions and line capacities (for A4, Letter, portrait, landscape) must always be respected.

### 4. UI Zoom & Legibility
- The interface must remain comfortable, well-scaled, and legible on all monitor resolutions.
- Zoom in by default on high-DPI and laptop screens so text and controls are easy to read and interact with.
