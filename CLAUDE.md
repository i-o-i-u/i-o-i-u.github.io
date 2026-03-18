# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install Node dependencies (first time only)
npm install

# Build Tailwind CSS (required after adding new Tailwind classes)
npm run build:css

# Watch Tailwind CSS during development (run alongside zola serve)
npm run watch:css

# Local development server with live reload
zola serve

# Build the site to ./public
zola build
```

Deployment is automatic: pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Zola and deploys to GitHub Pages at `https://i-o-i-u.github.io`.

## Architecture

This is a [Zola](https://www.getzola.org/) static site — a personal Arabic-language blog ("سيف العشيرة") about language and literature.

### Key directories

- `content/` — Markdown files with TOML frontmatter (`+++`). Each file maps directly to a URL slug.
- `templates/` — Tera templates: `base.html` (shared layout), `page.html` (all content pages), `index.html` (homepage).
- `static/` — Served at the site root: custom font (`Kitab-Regular.ttf`), SVG icons, background images.
- `config.toml` — Zola configuration (base URL, title, language).

### Template structure

`base.html` contains all shared CSS (inline `<style>`) and JavaScript, including:
- Dark/light mode toggle persisted to `localStorage`, driven by a `body.dark` class
- Tailwind CSS loaded via CDN
- Custom Arabic font `Kitab` loaded from `/Kitab-Regular.ttf`
- Glass-morphism utility classes (`.glass`, `.dark-glass`)
- RTL layout (`<html lang="ar" dir="rtl">`)

`page.html` renders individual content pages and checks `page.slug` to conditionally show/hide UI elements (e.g., share/copy buttons are hidden on the `questions` and `writings` slugs).

### Content conventions

- Frontmatter uses TOML between `+++` delimiters.
- Index/listing pages (`writings.md`, `questions.md`) contain raw HTML card markup in the Markdown body rather than using Zola's built-in section or taxonomy system — new entries must be added manually to these files.
- Individual content pages contain Arabic prose/poetry, often with inline `style` attributes for text alignment and spacing.
- Dates in frontmatter use the Gregorian calendar; dates displayed to readers in content use the Hijri calendar.

## Poetry Formatting System

The site uses a custom Arabic poetry formatter built into `base.html`:

- Each hemistich (شطر) is stretched using the Arabic tatweel character (ـ) to fill the full line width
- Tatweel is NEVER added after non-connecting letters: (ا، د، ذ، ر، ز، و، ة، ء، أ، إ، آ، ؤ، ئ)
- The word "الله" is NEVER stretched with tatweel under any circumstances
- Rajaz poetry (الرجز) uses a single-column layout, not the standard two-hemistich layout
- When copying text, tatweel characters are automatically stripped from the copied content

## Comments System

- Backend: Supabase (free tier)
- Supports nested replies up to three levels only
- Admin controls: hide/show comments, admin badge display
- Dates displayed in Arabic with relative time (e.g. "منذ ساعتين")
- Arabic grammatical number agreement handled via `arabicCount()` helper function

## Content Rules — CRITICAL

- All literary and poetic content must be preserved EXACTLY as written
- Never modify Arabic text in content files — no rewriting, no paraphrasing, no "corrections"
- Preserve all diacritics (تشكيل) exactly as they appear
- Content is entirely Arabic: classical poetry, literature, proverbs, and heritage texts
