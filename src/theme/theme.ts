export const THEME = {
  // --- CORE / BRAND ---
  PRIMARY: "#1D3C44", // Deep Teal (Main brand color)
  PRIMARY_DARK: "#122931", // 20% darker
  PRIMARY_LIGHT: "#2e515a", // 20% lighter
  PRIMARY_LIGHTER: "#3d6f7b", // 40% lighter
  PRIMARY_LIGHTEST: "#4a8a9a", // 60% lighter

  SECONDARY: "#3D7A8A", // Vibrant Blue (Secondary brand)
  SECONDARY_DARK: "#2d5a66",
  SECONDARY_LIGHT: "#5a9aac",

  // --- NEUTRAL BACKGROUNDS ---
  BACKGROUND: "#1D3C44", // Primary as background
  BACKGROUND_SECONDARY: "#2e515a", // Lighter background for sections
  BACKGROUND_TERTIARY: "#3d6f7b", // Even lighter for nested sections
  BACKGROUND_LIGHT: "#fffcfc", // For light mode contrast

  // --- SURFACE / CARDS ---
  SURFACE_PRIMARY: "#2e515a", // Main card background
  SURFACE_SECONDARY: "#3d6f7b", // Secondary card/panel
  SURFACE_TERTIARY: "#4a8a9a", // Accent cards

  // --- TEXT ---
  TEXT_PRIMARY: "#FFFFFF", // Main text on dark backgrounds
  TEXT_SECONDARY: "#e2e8f0", // Secondary text (90% opacity)
  TEXT_TERTIARY: "#cbd5e1", // Tertiary text (70% opacity)
  TEXT_DARK: "#171717", // Text on light backgrounds
  TEXT_DARK_SECONDARY: "#475569", // Secondary dark text
  TEXT_INVERSE: "#1D3C44", // Text on light backgrounds
  TEXT_LINK: "#5a9aac", // Links (from secondary light)
  TEXT_LINK_HOVER: "#7ab8cc", // Links hover state
  TEXT_MUTED: "#94a3b8",

  // --- BUTTONS ---
  BUTTON_PRIMARY: "#3D7A8A", // Main action buttons
  BUTTON_PRIMARY_HOVER: "#4a8a9a",
  BUTTON_PRIMARY_ACTIVE: "#2d5a66",

  BUTTON_SECONDARY: "#2e515a", // Secondary buttons
  BUTTON_SECONDARY_HOVER: "#3d6f7b",
  BUTTON_SECONDARY_ACTIVE: "#1D3C44",

  BUTTON_TERTIARY: "transparent", // Text/ghost buttons
  BUTTON_TERTIARY_HOVER: "rgba(62, 122, 138, 0.1)",
  BUTTON_TERTIARY_ACTIVE: "rgba(62, 122, 138, 0.2)",

  BUTTON_DISABLED: "#3d6f7b", // Disabled state
  BUTTON_TEXT_DISABLED: "#a0aec0",

  // --- INPUTS / FORMS ---
  INPUT_BACKGROUND: "#2e515a",
  INPUT_BORDER: "#3d6f7b",
  INPUT_BORDER_FOCUS: "#4a8a9a",
  INPUT_PLACEHOLDER: "#94a3b8",
  INPUT_TEXT: "#FFFFFF",
  INPUT_LABEL: "#e2e8f0",

  // --- BORDERS / DIVIDERS ---
  BORDER_PRIMARY: "#3d6f7b",
  BORDER_SECONDARY: "#2e515a",
  BORDER_LIGHT: "#e2e8f0", // For light mode

  // --- OVERLAYS / MODALS ---
  OVERLAY_BACKGROUND: "rgba(18, 41, 49, 0.85)", // Based on primary-dark
  MODAL_BACKGROUND: "#2e515a",
  BACKDROP: "rgba(0, 0, 0, 0.5)",

  // --- SKELETON / LOADING ---
  SKELETON_BACKGROUND: "#2e515a",
  SKELETON_HIGHLIGHT: "#3d6f7b",
  SKELETON_COLOR_LIGHT: "rgba(61, 122, 138, 0.54)", // With transparency
  SKELETON_BORDER: "#2e515a",
  SKELETON_TEXT: "#2e515a",

  // --- SEMANTIC / FEEDBACK ---
  SUCCESS: "#10b981",
  SUCCESS_LIGHT: "rgba(16, 185, 129, 0.1)",
  ERROR: "#ef4444",
  ERROR_LIGHT: "rgba(239, 68, 68, 0.1)",
  WARNING: "#f59e0b",
  WARNING_LIGHT: "rgba(245, 158, 11, 0.1)",
  WARNING_DARK: "#f59e0b",
  INFO: "#3b82f6",
  INFO_LIGHT: "rgba(59, 130, 246, 0.1)",

  // --- SHADOWS ---
  SHADOW_SM: "0 1px 2px rgba(18, 41, 49, 0.05)",
  SHADOW_MD: "0 4px 6px rgba(18, 41, 49, 0.1)",
  SHADOW_LG: "0 10px 15px rgba(18, 41, 49, 0.1)",

  // --- TRANSPARENCIES ---
  TRANSPARENT_PRIMARY: "rgba(29, 60, 68, 0.1)",
  TRANSPARENT_SECONDARY: "rgba(61, 122, 138, 0.1)",

  // --- STATUS / BADGES ---
  BADGE_PRIMARY: "#3d6f7b",
  BADGE_SECONDARY: "#2e515a",
  BADGE_SUCCESS: "#10b981",
  BADGE_ERROR: "#ef4444",
  BADGE_WARNING: "#f59e0b",
};

// Optional: Theme variants if you need light/dark mode
export const THEME_VARIANTS = {
  DARK: {
    BACKGROUND: "#1D3C44",
    SURFACE: "#2e515a",
    TEXT: "#FFFFFF",
    BORDER: "#3d6f7b",
  },
  LIGHT: {
    BACKGROUND: "#fffcfc",
    SURFACE: "#FFFFFF",
    TEXT: "#171717",
    BORDER: "#e2e8f0",
  },
};
