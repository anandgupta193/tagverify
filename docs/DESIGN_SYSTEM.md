# TagVerify design system

One palette and one type scale shared by the **admin web app** (`webapp-admin/constants/theme.ts`) and the **Android app** (`android/.../ui/theme/`). It's based on expense-manager (indigo `#6366F1`, Outfit, Ant Design tokens), with QuillBot-style touches: neutrals tinted toward the brand hue, a bold display type scale, pill chips, and soft tinted surfaces.

**Rule:** never hard-code a colour outside these files. Web code reads Ant Design tokens (`theme.useToken()`), and Android code reads `MaterialTheme.colorScheme`.

## Palette

### Primary: Indigo
| Token | Hex | Use |
|---|---|---|
| primary-50 | `#EEF2FF` | tinted surfaces, selected rows |
| primary-100 | `#E0E7FF` | chips, soft badges |
| primary-200 | `#C7D2FE` | borders on tinted surfaces |
| primary-300 | `#A5B4FC` | dark-mode primary |
| primary-400 | `#818CF8` | gradient end, hover |
| **primary-500** | **`#6366F1`** | **brand, primary buttons, links** |
| primary-600 | `#4F46E5` | pressed |
| primary-700 | `#4338CA` | text on tinted surfaces |
| primary-900 | `#312E81` | deep accents |

Brand gradient: `linear-gradient(135deg, #6366F1 0%, #818CF8 100%)`

### Neutrals (indigo-tinted, never pure grey)
| Token | Hex | Use |
|---|---|---|
| neutral-0 | `#FFFFFF` | cards, surfaces |
| neutral-50 | `#F4F5FA` | page background |
| neutral-100 | `#ECEEF6` | subtle fills |
| neutral-200 | `#E1E4EF` | borders, dividers |
| neutral-400 | `#9DA3BA` | placeholder, disabled |
| neutral-500 | `#6E7491` | secondary text |
| neutral-700 | `#353A54` | body text on tinted surfaces |
| neutral-900 | `#14162A` | primary text |
| neutral-950 | `#0B0C18` | dark-mode background |

### Semantic
| Token | Hex | Soft background |
|---|---|---|
| success | `#10B981` | `#ECFDF5` |
| warning | `#F59E0B` | `#FFFBEB` |
| error | `#EF4444` | `#FEF2F2` |

## Typography: Outfit
| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| Display | 32 / 38 | 700 | -0.02em |
| H1 | 26 / 32 | 700 | -0.015em |
| H2 | 20 / 28 | 600 | -0.01em |
| Title | 16 / 24 | 600 | 0 |
| Body | 14 / 22 | 400 | 0 |
| Caption | 12 / 16 | 500 | 0.01em |
| Overline | 11 / 16 | 600 | 0.08em, uppercase |

## Shape and elevation
- Radius: inputs and buttons 10, cards 16, sheets 24, chips and pills 999.
- Shadow (cards): `0 1px 2px rgba(20,22,42,.04), 0 8px 24px rgba(20,22,42,.06)`
- Shadow (primary CTA): `0 6px 16px rgba(99,102,241,.32)`
- Spacing: a 4-point grid (4, 8, 12, 16, 24, 32).

## Motion
- 150–250 ms, `cubic-bezier(0.4, 0, 0.2, 1)`. Animate only transform and opacity.
- Lists enter with a 60 ms stagger.
- Respect `prefers-reduced-motion`.
