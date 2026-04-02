# Design System Strategy: The Intelligent Overlay

## 1. Overview & Creative North Star
**The Creative North Star: "The Cognitive Concierge"**

This design system is not a static sidebar; it is an intelligent layer that breathes alongside the professional ecosystem of LinkedIn. To move beyond the "standard extension" look, we employ a philosophy of **Atmospheric Depth**. This means the UI should feel like a sophisticated lens—a piece of high-end optical glass—placed over the web page. 

We reject the rigid, boxy constraints of traditional enterprise software. Instead, we use **intentional asymmetry**, wide-tracking labels, and a sophisticated interplay of **Manrope** (for authoritative, editorial headlines) and **Inter** (for high-density data). By utilizing tonal layering instead of harsh borders, the system achieves a "Ghost Presence"—it is unmistakably premium, deeply integrated, and functionally superior.

---

## 2. Colors & Surface Philosophy
The palette evolves LinkedIn’s "Professional Blue" into a more kinetic, AI-driven spectrum.

### The "No-Line" Rule
**Explicit Instruction:** Sectioning via 1px solid borders is strictly prohibited. Use background color shifts to define boundaries. A `surface-container-low` panel sitting on a `surface` background is the standard for separation.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **Base:** `surface` (#f7fafc)
*   **The "Work" Layer:** `surface-container-lowest` (#ffffff) for primary content cards.
*   **The "Context" Layer:** `surface-container` (#ebeef0) for sidebar headers or grouping.
*   **The "Active" Layer:** `surface-container-highest` (#e0e3e5) for hovered states or selected items.

### The "Glass & Gradient" Rule
Floating panels (the "AI Assistant" core) must utilize Glassmorphism.
*   **Tokens:** Use `surface` at 85% opacity with a `20px` backdrop-blur.
*   **Signature Textures:** Main CTAs (Action Blue) should not be flat. Apply a subtle linear gradient from `primary` (#005d8f) to `primary-container` (#0077b5) at a 135-degree angle to provide a "lit-from-within" soul.

---

## 3. Typography
We use a dual-font strategy to balance editorial authority with technical precision.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. High-contrast sizing (e.g., `display-md` at 2.75rem next to `body-md`) creates an editorial feel that guides the eye instantly to the most important "Job Match" data.
*   **UI & Data (Inter):** The workhorse for the extension. Used for all labels, inputs, and Kanban card details to ensure maximum legibility at small scale.
*   **The Hierarchy:** 
    *   `title-lg` (Inter, 1.375rem) for Job Titles.
    *   `label-sm` (Inter, 0.6875rem) with 5% letter-spacing for category tags (e.g., "SKILL GAP").

---

## 4. Elevation & Depth
In this system, light is the architect, not lines.

*   **The Layering Principle:** Rather than shadows, stack tiers. A `surface-container-lowest` card nested inside a `surface-container-low` wrapper provides a soft, organic lift.
*   **Ambient Shadows:** For floating Chrome Extension panels, use an "Ambient Diffusion" shadow. 
    *   **Value:** `0px 12px 32px -4px` using `on-surface` (#181c1e) at **6% opacity**. This mimics natural light rather than a digital drop-shadow.
*   **The "Ghost Border" Fallback:** If a divider is mandatory for accessibility, use the `outline-variant` (#bfc7d1) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** All "AI-Insight" popovers must use a `backdrop-filter: blur(12px)` to maintain a sense of place within the LinkedIn feed.

---

## 5. Components

### The Progress Ring (Match Score)
*   **Visuals:** Use `secondary` (Emerald Green) for the stroke. 
*   **Detail:** The background track should be `secondary-fixed-dim` at 20% opacity. Place the score in `headline-sm` (Manrope) in the center to emphasize the "AI calculation."

### Kanban Cards
*   **Style:** `surface-container-lowest` background, `xl` (1.5rem) rounded corners.
*   **Constraint:** No borders. Use a `4px` vertical accent bar on the left using the `primary` token to denote the "Active" status.
*   **Spacing:** Use `spacing-4` (1rem) for internal padding.

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. `full` (pill) roundedness. No shadow; use a subtle `primary-fixed` inner-glow on hover.
*   **Tertiary (The "Ghost" Button):** No background. Use `primary` text. Upon hover, transition to a `surface-container-low` background.

### Input Fields
*   **Surface:** `surface-container-low`.
*   **Interaction:** On focus, do not just change the border color. Shift the background to `surface-container-lowest` and apply a `2px` "Ghost Border" using `surface-tint`.

### Skill Gap Chips
*   **Colors:** `tertiary-container` (#be4f24) background with `on-tertiary-container` (#fff5f2) text.
*   **Shape:** `md` (0.75rem) roundedness to contrast against the pill-shaped buttons.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins (e.g., `spacing-8` on top, `spacing-6` on sides) to create a high-end, editorial feel.
*   **Do** use `secondary` (Emerald) and `tertiary` (Coral) sparingly as "Signal Colors" only.
*   **Do** leverage the `xl` (1.5rem) roundedness for main containers to make the AI feel "soft" and approachable.

### Don’t
*   **Don’t** use black (#000000) for text. Use `on-surface` (#181c1e) to maintain tonal depth.
*   **Don’t** use dividers between list items. Use `spacing-2` of vertical white space and a background color shift on hover.
*   **Don’t** use standard "Drop Shadows." If it looks like a default shadow, it’s too heavy—reduce opacity until it’s nearly invisible.