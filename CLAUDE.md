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

Shared CSS and JavaScript live in `static/site.css` + `static/site.js` (loaded from `base.html`) and `static/page.css` + `static/page.js` (loaded from `page.html` via the `head_extra` block). Scripts use `defer`. The only inline script left in `base.html` is the pre-paint dark-theme snippet. The site includes:
- Dark/light mode toggle persisted to `localStorage`, driven by a `body.dark` class
- Tailwind CSS loaded via CDN
- Custom Arabic font `Kitab` loaded from `/Kitab-Regular.ttf`
- Glass-morphism utility classes (`.glass`, `.dark-glass`)
- RTL layout (`<html lang="ar" dir="rtl">`)

`page.html` renders individual content pages and checks `page.slug` to conditionally show/hide UI elements (e.g., share/copy buttons are hidden on the `questions` and `writings` slugs).

### Content conventions

- Frontmatter uses TOML between `+++` delimiters.
- Listing pages (`writings.md`, `questions.md`) set `extra.list_kind`; their cards are generated automatically in `page.html` from each content page's frontmatter (`extra.kind`, `extra.order`, `extra.card_title`, `extra.hijri_date`). To list a new page, add those four fields to its frontmatter — do not edit the listing files.
- Individual content pages contain Arabic prose/poetry, often with inline `style` attributes for text alignment and spacing.
- Dates in frontmatter use the Gregorian calendar; dates displayed to readers in content use the Hijri calendar.

## Poetry Formatting System

The site uses a custom Arabic poetry formatter (in `static/site.js`):

- Each hemistich (شطر) is stretched using the Arabic tatweel character (ـ) to fill the full line width
- Tatweel is NEVER added after non-connecting letters: (ا، د، ذ، ر، ز، و، ة، ء، أ، إ، آ، ؤ، ئ)
- The word "الله" is NEVER stretched with tatweel under any circumstances
- Rajaz poetry (الرجز) uses a single-column layout, not the standard two-hemistich layout
- When copying text, tatweel characters are automatically stripped from the copied content

## Comments System

- Backend: Supabase (free tier); client logic in `static/page.js`
- Security: RLS policies + SECURITY DEFINER RPCs defined in `supabase/setup.sql` (must be run once in the Supabase SQL Editor). Visitors can only read visible comments, post, and like; edit/hide/delete go through RPCs that verify ownership (`author_uid`) or the admin password server-side.
- Supports nested replies up to three levels only
- Admin controls: hide/show comments, admin badge display
- Dates displayed in Arabic with relative time (e.g. "منذ ساعتين")
- Arabic grammatical number agreement handled via `arabicCount()` helper function

## Content Rules — CRITICAL

- All literary and poetic content must be preserved EXACTLY as written
- Never modify Arabic text in content files — no rewriting, no paraphrasing, no "corrections"
- Preserve all diacritics (تشكيل) exactly as they appear
- Content is entirely Arabic: classical poetry, literature, proverbs, and heritage texts
