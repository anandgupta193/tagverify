// Single source of colour for the web app. Mirrors docs/DESIGN_SYSTEM.md and
// the Android theme. Components read colours via antd's theme.useToken().
import { theme as antTheme, type ThemeConfig } from 'antd'
import { FONT_FAMILY_CSS_VAR } from '@/config/fonts'

export const PALETTE = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    900: '#312E81',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F4F5FA',
    100: '#ECEEF6',
    200: '#E1E4EF',
    400: '#9DA3BA',
    500: '#6E7491',
    700: '#353A54',
    900: '#14162A',
    950: '#0B0C18',
  },
  success: '#10B981',
  successSoft: '#ECFDF5',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  error: '#EF4444',
  errorSoft: '#FEF2F2',
} as const

export const BRAND_GRADIENT = `linear-gradient(135deg, ${PALETTE.primary[500]} 0%, ${PALETTE.primary[400]} 100%)`
export const CARD_SHADOW = '0 1px 2px rgba(20,22,42,.04), 0 8px 24px rgba(20,22,42,.06)'
export const CTA_SHADOW = '0 6px 16px rgba(99,102,241,.32)'

export function antdTheme(mode: 'light' | 'dark'): ThemeConfig {
  const dark = mode === 'dark'
  return {
    algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: dark ? PALETTE.primary[400] : PALETTE.primary[500],
      colorInfo: PALETTE.primary[500],
      colorSuccess: PALETTE.success,
      colorWarning: PALETTE.warning,
      colorError: PALETTE.error,
      colorLink: dark ? PALETTE.primary[300] : PALETTE.primary[600],
      ...(dark
        ? { colorBgLayout: PALETTE.neutral[950] }
        : {
            colorBgLayout: PALETTE.neutral[50],
            colorBgContainer: PALETTE.neutral[0],
            colorText: PALETTE.neutral[900],
            colorTextSecondary: PALETTE.neutral[500],
            colorTextTertiary: PALETTE.neutral[400],
            colorBorder: PALETTE.neutral[200],
            colorBorderSecondary: PALETTE.neutral[100],
            colorFillAlter: PALETTE.neutral[50],
          }),
      borderRadius: 10,
      borderRadiusLG: 16,
      borderRadiusSM: 8,
      fontFamily: `var(${FONT_FAMILY_CSS_VAR})`,
      fontSize: 14,
      controlHeight: 40,
      controlHeightLG: 46,
    },
    components: {
      Button: { fontWeight: 600, primaryShadow: CTA_SHADOW },
      Card: { paddingLG: 20 },
      Table: { headerBg: 'transparent', headerColor: PALETTE.neutral[500], rowHoverBg: PALETTE.primary[50] },
      Tag: { borderRadiusSM: 999 },
      Segmented: { itemSelectedBg: PALETTE.neutral[0] },
    },
  }
}
