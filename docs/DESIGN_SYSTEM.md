# Sarif Design System

Restraint-first, single-accent. Premium comes from consistency and subtraction, not decoration. The filter for every element: can it be removed, is it obvious, does it feel inevitable.

## Foundations

### Color (tokens, never hardcode)
Dark, near-neutral. One accent. Semantic colors reserved for status only.

| Token | Value | Use |
|-------|-------|-----|
| `--surface-0` | `#0b0c0f` | Page background |
| `--surface-1` | `#131519` | Cards / panels (solid, not translucent) |
| `--surface-2` | `#1a1d23` | Raised / hover / active |
| `--border` | `rgba(255,255,255,0.08)` | Hairline, default |
| `--border-strong` | `rgba(255,255,255,0.13)` | Emphasis edge |
| `--text` | `#e6e8eb` | Primary text |
| `--text-muted` | `#98a1ac` | Secondary / labels |
| `--text-faint` | `#6a7280` | Tertiary / meta |
| `--accent` | `#2f97d8` | Interactive, active, key data highlight ONLY |

Kill the `bg-white/5` frosted overlay everywhere. Use the surface ramp. Semantic status colors (emerald / blue / yellow / red for cents-per-point, amber for warnings, availability coding) are unchanged and off-limits to the accent.

### Typography
Three roles, strict scale.
- **Display** (Space Grotesk): wordmark + section titles only.
- **Body** (system sans): prose, controls.
- **Mono** (IBM Plex Mono): all data (codes, miles, counts, dates).

| Role | Size / weight | Notes |
|------|---------------|-------|
| Title | 15px / 600 display | Card and section headers |
| Body | 14px / 400 | Default |
| Label | 11px / 500 muted | Field labels, meta |
| Stat | 24px+ / 600 mono, tabular-nums | Hero numbers |
| Data | 13px mono | Table cells, codes |

Hierarchy is created by size and weight contrast, not by boxes.

### Spacing
4 / 8 rhythm. Card padding: 20px (`p-5`). Grid gap: 12px (`gap-3`). No ad-hoc values.

### Radius
Two only: `12px` surfaces, `8px` controls. Nothing else.

### Elevation
Hairline border plus a one-step-lighter surface. No glows, no brackets, no motifs.

## Components
- `.surface` : card. `surface-1` + hairline + 12px radius.
- `.section-title` : display, 15px/600.
- `.stat` : mono, tabular-nums, tight tracking.
- `.divider` : 1px hairline.
- Chips / badges: `surface-2` + hairline + 8px radius. Semantic text color where it carries meaning.

## Removed (decoration debt)
Grid texture, HUD corner brackets, brass secondary, boarding-pass edges, gate-code labels, perforated dividers. All cut in favor of the system above.

## Constraints
Functionality and stored data are never altered. Tokens only, no hardcoded values. Identical components everywhere.
