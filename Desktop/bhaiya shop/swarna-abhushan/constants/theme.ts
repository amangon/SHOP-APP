export const COLORS = {
  primary: '#080808',
  secondary: '#101010',
  tertiary: '#171717',
  card: '#171717',
  gold: '#D4AF37',
  lightGold: '#F4D06F',
  darkGold: '#A67C00',
  white: '#FFFFFF',
  secondaryText: '#AFAFAF',
  darkBorder: '#292929',
  goldBorder: 'rgba(212, 175, 55, 0.30)',
  goldBorderSolid: '#D4AF37',
  error: '#FF4444',
  success: '#4CAF50',
} as const;

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxlg: 48,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  xxxxl: 36,
  xxxxlg: 48,
} as const;

export const FONT_FAMILY = {
  serif: 'PlayfairDisplay-Regular',
  serifMedium: 'PlayfairDisplay-Medium',
  serifBold: 'PlayfairDisplay-Bold',
  sans: 'Montserrat-Regular',
  sansMedium: 'Montserrat-Medium',
  sansSemiBold: 'Montserrat-SemiBold',
  sansBold: 'Montserrat-Bold',
} as const;

export const FONT_WEIGHTS = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const SHADOWS = {
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  heading1: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: FONT_SIZES.xxxxlg,
    lineHeight: 48,
  },
  heading2: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: FONT_SIZES.xxl,
    lineHeight: 36,
  },
  heading3: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 28,
  },
  hero: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: FONT_SIZES.xxxxlg,
    lineHeight: 48,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: FONT_SIZES.xxl,
    lineHeight: 36,
  },
  productTitle: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 28,
  },
  body: {
    fontFamily: FONT_FAMILY.sans,
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
  },
  secondary: {
    fontFamily: FONT_FAMILY.sans,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FONT_FAMILY.sans,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
  },
};
