// Theme configuration for ArgeMind app
export const theme = {
  // Primary background colors
  background: '#1A1A2E', // Very dark blue-grey
  surface: '#241A2E', // Slightly lighter blue-grey for cards
  surfaceElevated: '#273849', // Even lighter for elevated elements
  
  // Primary brand colors
  primary: '#4a9eff', // Bright blue
  primaryDark: '#2563eb', // Darker blue
  primaryLight: '#60a5fa', // Lighter blue
  
  // Accent colors
  accent: '#06b6d4', // Cyan
  secondary: '#8b5cf6', // Purple
  
  // Status colors
  success: '#10b981', // Green
  warning: '#f59e0b', // Orange
  error: '#ef4444', // Red
  info: '#3b82f6', // Blue
  
  // Text colors
  textPrimary: '#f1f5f9', // Light grey-white
  textSecondary: '#94a3b8', // Medium grey
  textMuted: '#64748b', // Darker grey
  textInverse: '#0f1419', // Dark for light backgrounds
  
  // Border and divider colors
  border: '#334155', // Dark grey-blue
  borderLight: '#475569', // Slightly lighter
  divider: '#1e293b', // Very subtle divider
  
  // Special colors
  overlay: 'rgba(15, 20, 25, 0.8)', // Dark overlay
  shadow: 'rgba(0, 0, 0, 0.4)', // Shadow color
  
  // Gradient colors
  gradientStart: '#1e293b',
  gradientEnd: '#0f172a',
  
  // Button variations
  buttonPrimary: '#4a9eff',
  buttonSecondary: '#475569',
  buttonSuccess: '#10b981',
  buttonWarning: '#f59e0b',
  buttonDanger: '#ef4444',
  
  // Input colors
  inputBackground: '#1e2832',
  inputBorder: '#334155',
  inputFocus: '#4a9eff',
  placeholder: '#64748b',
};

// Common shadow styles
export const shadows = {
  small: {
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  large: {
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
};

// Common spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  body: {
    fontSize: 16,
    color: theme.textPrimary,
  },
  caption: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  small: {
    fontSize: 12,
    color: theme.textMuted,
  },
};
