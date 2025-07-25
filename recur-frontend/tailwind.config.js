/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

const commonColors = {
  inherit: "inherit",
  current: "currentColor",
  transparent: "transparent",
  accent: "var(--accent)",
  "accent-inverted": "var(--accent-inverted)",
  "accent-hover": "var(--accent-hover)",
  "accent-active": "var(--accent-active)",
  "accent-highlight-primary": "var(--accent-highlight-primary)",
  "accent-highlight-secondary": "var(--accent-highlight-secondary)",
};

const deprecatedColors = {
  "primary-highlight-light": "var(--primary-highlight-light)",
  "text-3000-light": "var(--text-3000-light)",
  "text-secondary-3000-light": "var(--text-secondary-3000-light)",
  "muted-3000-light": "var(--muted-3000-light)",
  "trace-3000-light": "var(--trace-3000-light)",
  "primary-3000-light": "var(--primary-3000-light)",
  "primary-3000-hover-light": "var(--primary-3000-hover-light)",
  "primary-3000-active-light": "var(--primary-3000-active-light)",
  "secondary-3000-light": "var(--secondary-3000-light)",
  "secondary-3000-hover-light": "var(--secondary-3000-hover-light)",
  "accent-3000-light": "var(--accent-3000-light)",
  "bg-3000-light": "var(--bg-3000-light)",
  "border-3000-light": "var(--border-3000-light)",
  "border-bold-3000-light": "var(--border-bold-3000-light)",
  "glass-bg-3000-light": "var(--glass-bg-3000-light)",
  "glass-border-3000-light": "var(--glass-border-3000-light)",
  "link-3000-light": "var(--link-3000-light)",
  "primary-3000-frame-bg-light": "var(--primary-3000-frame-bg-light)",
  "primary-3000-button-bg-light": "var(--primary-3000-button-bg-light)",
  "primary-3000-button-border-light": "var(--primary-3000-button-border-light)",
  "primary-3000-button-border-hover-light":
    "var(--primary-3000-button-border-hover-light)",
  "secondary-3000-frame-bg-light": "var(--secondary-3000-frame-bg-light)",
  "secondary-3000-button-bg-light": "var(--secondary-3000-button-bg-light)",
  "secondary-3000-button-border-light":
    "var(--secondary-3000-button-border-light)",
  "secondary-3000-button-border-hover-light":
    "var(--secondary-3000-button-border-hover-light)",
  "danger-3000-frame-bg-light": "var(--danger-3000-frame-bg-light)",
  "danger-3000-button-border-light": "var(--danger-3000-button-border-light)",
  "danger-3000-button-border-hover-light":
    "var(--danger-3000-button-border-hover-light)",

  // PostHog 3000 - Dark mode
  "text-3000-dark": "var(--text-3000-dark)",
  "text-secondary-3000-dark": "var(--text-secondary-3000-dark)",
  "muted-3000-dark": "var(--muted-3000-dark)",
  "trace-3000-dark": "var(--trace-3000-dark)",
  "primary-3000-dark": "var(--primary-3000-dark)",

  // --color-primary-highlight-dark: var(--primary-highlight-dark);
  "primary-3000-hover-dark": "var(--primary-3000-hover-dark)",
  "primary-3000-active-dark": "var(--primary-3000-active-dark)",
  "primary-alt-highlight-light": "var(--primary-alt-highlight-light)",
  "secondary-3000-dark": "var(--secondary-3000-dark)",
  "secondary-3000-hover-dark": "var(--secondary-3000-hover-dark)",
  "accent-3000-dark": "var(--accent-3000-dark)",
  "bg-3000-dark": "var(--bg-3000-dark)",
  "border-3000-dark": "var(--border-3000-dark)",
  "border-bold-3000-dark": "var(--border-bold-3000-dark)",
  "glass-bg-3000-dark": "var(--glass-bg-3000-dark)",
  "glass-border-3000-dark": "var(--glass-border-3000-dark)",
  "link-3000-dark": "var(--link-3000-dark)",
  "primary-3000-frame-bg-dark": "var(--primary-3000-frame-bg-dark)",
  "primary-3000-button-bg-dark": "var(--primary-3000-button-bg-dark)",
  "primary-3000-button-border-dark": "var(--primary-3000-button-border-dark)",
  "primary-3000-button-border-hover-dark":
    "var(--primary-3000-button-border-hover-dark)",
  "primary-alt-highlight-dark": "var(--primary-alt-highlight-dark)",
  "secondary-3000-frame-bg-dark": "var(--secondary-3000-frame-bg-dark)",
  "secondary-3000-button-bg-dark": "var(--secondary-3000-button-bg-dark)",
  "secondary-3000-button-border-dark":
    "var(--secondary-3000-button-border-dark)",
  "secondary-3000-button-border-hover-dark":
    "var(--secondary-3000-button-border-hover-dark)",
  "danger-3000-frame-bg-dark": "var(--danger-3000-frame-bg-dark)",
  "danger-3000-button-border-dark": "var(--danger-3000-button-border-dark)",
  "danger-3000-button-border-hover-dark":
    "var(--danger-3000-button-border-hover-dark)",

  // Shadows
  // --color-shadow-elevation-3000-light: var(--shadow-elevation-3000-light);
  // --color-shadow-elevation-3000-dark: var(--shadow-elevation-3000-dark);

  // The derived colors
  // `--default` is a pre-3000 alias for "default text color" (`--text-3000` now)
  // --color-default: var(--default);
  // --color-text-3000: var(--text-3000);
  // --color-text-secondary-3000: var(--text-secondary-3000);
  // --color-muted-3000: var(--muted-3000);
  // --color-primary-3000: var(--primary-3000);
  // --color-secondary-3000: var(--secondary-3000);
  // --color-secondary-3000-hover: var(--secondary-3000-hover);
  // --color-accent-3000: var(--bg-surface-primary);
  // --color-bg-3000: var(--bg-primary);
  // --color-primary-highlight: var(--primary-highlight);
  // --color-primary-alt-highlight: var(--primary-alt-highlight);
  // --color-primary-alt: var(--primary-alt);

  // 'primary': 'var(--primary-3000)',
  muted: "var(--muted-3000)",
  default: "var(--text-3000)",
  "muted-alt": "var(--muted-3000)",
  "primary-alt": "var(--text-3000)",

  // --color-border: var(--border-primary);
  // --color-border-bold: var(--border-bold-3000);
  // --color-data-color-1: var(--data-color-1);
  // --color-data-color-10: var(--data-color-10);

  "bg-bridge": "var(--bg-bridge)",

  // Non-color vars
  "modal-shadow-elevation": "var(--modal-shadow-elevation)",
  "opacity-disabled": "var(--opacity-disabled)",
  "font-medium": "var(--font-medium)",
  "font-semibold": "var(--font-semibold)",
  "font-sans": "var(--font-sans)",
  "font-title": "var(--font-title)",
  "font-mono": "var(--font-mono)",

  // Dashboard item colors
  blue: "var(--blue)",
  purple: "var(--purple)",
  green: "var(--green)",
  black: "var(--black)",

  //// Data colors (e.g. insight series). Note: colors.ts relies on these values being hexadecimal
  "data-color-1": "var(--data-color-1)",
  "data-color-1-hover": "var(--data-color-1-hover)",
  "data-color-2": "var(--data-color-2)",
  "data-color-3": "var(--data-color-3)",
  "data-color-4": "var(--data-color-4)",
  "data-color-5": "var(--data-color-5)",
  "data-color-6": "var(--data-color-6)",
  "data-color-7": "var(--data-color-7)",
  "data-color-8": "var(--data-color-8)",
  "data-color-9": "var(--data-color-9)",
  "data-color-10": "var(--data-color-10)",
  "data-color-11": "var(--data-color-11)",
  "data-color-12": "var(--data-color-12)",
  "data-color-13": "var(--data-color-13)",
  "data-color-14": "var(--data-color-14)",
  "data-color-15": "var(--data-color-15)",

  // Lifecycle series (compiled)
  "lifecycle-new": "var(--lifecycle-new)",
  "lifecycle-returning": "var(--lifecycle-returning)",
  "lifecycle-resurrecting": "var(--lifecycle-resurrecting)",
  "lifecycle-dormant": "var(--lifecycle-dormant)",
  "lifecycle-new-hover": "var(--lifecycle-new-hover)",
  "lifecycle-returning-hover": "var(--lifecycle-returning-hover)",
  "lifecycle-resurrecting-hover": "var(--lifecycle-resurrecting-hover)",
  "lifecycle-dormant-hover": "var(--lifecycle-dormant-hover)",

  // Z-indexes
  "z-top": "var(--z-top)",
  "z-bottom-notice": "var(--z-bottom-notice)",
  "z-command-palette": "var(--z-command-palette)",
  "z-force-modal-above-popovers": "var(--z-force-modal-above-popovers)",
  "z-tooltip": "var(--z-tooltip)",

  // 1066 through 1069 are reserved to be set from code
  "z-definition-popover": "var(--z-definition-popover)",
  "z-popover": "var(--z-popover)",
  "z-graph-tooltip": "var(--z-graph-tooltip)",

  // 1061 and 1062 are reserved to be set from code
  "z-modal": "var(--z-modal)",
  "z-hedgehog-buddy": "var(--z-hedgehog-buddy)",
  "z-annotation-popover": "var(--z-annotation-popover)",
  "z-drawer": "var(--z-drawer)",
  "z-notifications-popover": "var(--z-notifications-popover)",
  "z-main-nav": "var(--z-main-nav)",
  "z-lemon-sidebar": "var(--z-lemon-sidebar)",
  "z-lemon-activation-sidebar": "var(--z-lemon-activation-sidebar)",
  "z-mobile-nav-overlay": "var(--z-mobile-nav-overlay)",
  "z-top-navigation": "var(--z-top-navigation)",
  "z-content-overlay": "var(--z-content-overlay)",
  "z-raised": "var(--z-raised)",

  // Toasts
  // Update and override from react-toastify
  // which attaches these variables to :root
  // which means they aren't available in the toolbar
  "toastify-color-dark": "var(--toastify-color-dark)",
  "toastify-color-light": "var(--toastify-color-light)",
  "toastify-color-info": "var(--toastify-color-info)",
  "toastify-color-success": "var(--toastify-color-success)",
  "toastify-color-warning": "var(--toastify-color-warning)",
  "toastify-color-error": "var(--toastify-color-error)",
  "toastify-color-progress-info": "var(--toastify-color-progress-info)",
  "toastify-color-progress-success": "var(--toastify-color-progress-success)",
  "toastify-color-progress-warning": "var(--toastify-color-progress-warning)",
  "toastify-color-progress-error": "var(--toastify-color-progress-error)",
  "toastify-toast-background": "var(--toastify-toast-background)",

  // TODO: --color-toastify-toast-width: var(--toastify-toast-width);
  // TODO: --color-toastify-toast-min-height: var(--toastify-toast-min-height);
  // TODO: --color-toastify-toast-max-height: var(--toastify-toast-max-height);
  "toastify-text-color-light": "var(--toastify-text-color-light)",

  // In-app prompts
  "in-app-prompts-width": "var(--in-app-prompts-width)",
  "lettermark-1-bg": "var(--lettermark-1-bg)",
  "lettermark-1-text": "var(--lettermark-1-text)",
  "lettermark-2-bg": "var(--lettermark-2-bg)",
  "lettermark-2-text": "var(--lettermark-2-text)",
  "lettermark-3-bg": "var(--lettermark-3-bg)",
  "lettermark-3-text": "var(--lettermark-3-text)",
  "lettermark-4-bg": "var(--lettermark-4-bg)",
  "lettermark-4-text": "var(--lettermark-4-text)",
  "lettermark-5-bg": "var(--lettermark-5-bg)",
  "lettermark-5-text": "var(--lettermark-5-text)",
  "lettermark-6-bg": "var(--lettermark-6-bg)",
  "lettermark-6-text": "var(--lettermark-6-text)",
  "lettermark-7-bg": "var(--lettermark-7-bg)",
  "lettermark-7-text": "var(--lettermark-7-text)",
  "lettermark-8-bg": "var(--lettermark-8-bg)",
  "lettermark-8-text": "var(--lettermark-8-text)",

  // Modals
  // TODO: --color-modal-backdrop-blur: var(--modal-backdrop-blur);
  "modal-backdrop-color": "var(--modal-backdrop-color)",

  // TODO: --color-modal-transition-time: var(--modal-transition-time);

  // Tooltips
  "tooltip-bg-light": "var(--tooltip-bg-light)",
  "tooltip-bg-dark": "var(--tooltip-bg-dark)",

  // Notebooks
  "notebook-popover-transition-properties":
    "var(--notebook-popover-transition-properties)",
  "notebook-column-left-width": "var(--notebook-column-left-width)",
  "notebook-column-right-width": "var(--notebook-column-right-width)",

  // Light mode
  danger: "var(--danger)",
  "danger-light": "var(--danger-light)",
  "danger-lighter": "var(--danger-lighter)",
  "danger-dark": "var(--danger-dark)",
  "danger-highlight": "var(--danger-highlight)",
  warning: "var(--warning)",
  "warning-highlight": "var(--warning-highlight)",
  "warning-dark": "var(--warning-dark)",
  highlight: "var(--highlight)",
  success: "var(--success)",
  "success-light": "var(--success-light)",
  "success-lighter": "var(--success-lighter)",
  "success-dark": "var(--success-dark)",
  "success-highlight": "var(--success-highlight)",

  // --color-muted: var(--text-secondary);
  // --color-muted-alt: var(--text-secondary);
  // --color-primary-alt: var(--primary-alt);
  mark: "var(--mark)",
  white: "var(--white)",

  // --color-bg-light: var(--bg-surface-primary);
  side: "var(--side)",
  mid: "var(--mid)",
  border: "var(--border)",
  "border-light": "var(--border-light)",
  "border-bold": "var(--border-bold)",
  transparent: "var(--transparent)",
  link: "var(--link)",
  "brand-blue": "var(--brand-blue)",
  "brand-red": "var(--brand-red)",
  "brand-yellow": "var(--brand-yellow)",
  "brand-key": "var(--brand-key)",
  accent: "var(--accent)",
  "text-3000": "var(--text-3000)",
  "text-secondary-3000": "var(--text-secondary-3000)",
  "muted-3000": "var(--muted-3000)",
  "trace-3000": "var(--trace-3000)",
  "primary-3000": "var(--accent)",

  "primary-3000-hover": "var(--accent-hover)",
  "primary-3000-active": "var(--accent-active)",
  "secondary-3000": "var(--secondary-3000)",
  "secondary-3000-hover": "var(--secondary-3000-hover)",
  "accent-3000": "var(--bg-surface-primary)",
  "bg-3000": "var(--bg-primary)",
  "border-3000": "var(--border-primary)",
  "border-light-opaque": "var(--border-light-opaque)",
  "border-bold-3000": "var(--border-bold-3000)",
  "glass-bg-3000": "var(--glass-bg-3000)",
  "glass-border-3000": "var(--border-primary)",
  "bg-light": "var(--bg-surface-primary)",
  "bg-table": "var(--bg-table)",

  // --color-link: var(--link);
  // TODO: --color-shadow-elevation-3000: var(--shadow-elevation-3000);
  "primary-3000-frame-bg": "var(--primary-3000-frame-bg)",
  "primary-3000-button-bg": "var(--primary-3000-button-bg)",
  "primary-3000-button-border": "var(--primary-3000-button-border)",
  "primary-3000-button-border-hover": "var(--primary-3000-button-border-hover)",
  "primary-alt-highlight": "var(--primary-alt-highlight)",
  "secondary-3000-frame-bg": "var(--secondary-3000-frame-bg)",
  "secondary-3000-button-bg": "var(--secondary-3000-button-bg)",
  "secondary-3000-button-border": "var(--secondary-3000-button-border)",
  "secondary-3000-button-border-hover":
    "var(--secondary-3000-button-border-hover)",
  "danger-3000-frame-bg": "var(--danger-3000-frame-bg)",
  "danger-3000-button-border": "var(--danger-3000-button-border)",
  "danger-3000-button-border-hover": "var(--danger-3000-button-border-hover)",
  "tooltip-bg": "var(--tooltip-bg)",
};

const config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  important: true,
  theme: {
    colors: {
      red: {
        50: "var(--color-red-50)",
        100: "var(--color-red-100)",
        200: "var(--color-red-200)",
        300: "var(--color-red-300)",
        400: "var(--color-red-400)",
        500: "var(--color-red-500)",
        600: "var(--color-red-600)",
        700: "var(--color-red-700)",
        800: "var(--color-red-800)",
        900: "var(--color-red-900)",
        950: "var(--color-red-950)",
      },
      orange: {
        50: "var(--color-orange-50)",
        100: "var(--color-orange-100)",
        200: "var(--color-orange-200)",
        300: "var(--color-orange-300)",
        400: "var(--color-orange-400)",
        500: "var(--color-orange-500)",
        600: "var(--color-orange-600)",
        700: "var(--color-orange-700)",
        800: "var(--color-orange-800)",
        900: "var(--color-orange-900)",
        950: "var(--color-orange-950)",
      },
      amber: {
        50: "var(--color-amber-50)",
        100: "var(--color-amber-100)",
        200: "var(--color-amber-200)",
        300: "var(--color-amber-300)",
        400: "var(--color-amber-400)",
        500: "var(--color-amber-500)",
        600: "var(--color-amber-600)",
        700: "var(--color-amber-700)",
        800: "var(--color-amber-800)",
        900: "var(--color-amber-900)",
        950: "var(--color-amber-950)",
      },
      yellow: {
        50: "var(--color-yellow-50)",
        100: "var(--color-yellow-100)",
        200: "var(--color-yellow-200)",
        300: "var(--color-yellow-300)",
        400: "var(--color-yellow-400)",
        500: "var(--color-yellow-500)",
        600: "var(--color-yellow-600)",
        700: "var(--color-yellow-700)",
        800: "var(--color-yellow-800)",
        900: "var(--color-yellow-900)",
        950: "var(--color-yellow-950)",
      },
      lime: {
        50: "var(--color-lime-50)",
        100: "var(--color-lime-100)",
        200: "var(--color-lime-200)",
        300: "var(--color-lime-300)",
        400: "var(--color-lime-400)",
        500: "var(--color-lime-500)",
        600: "var(--color-lime-600)",
        700: "var(--color-lime-700)",
        800: "var(--color-lime-800)",
        900: "var(--color-lime-900)",
        950: "var(--color-lime-950)",
      },
      green: {
        50: "var(--color-green-50)",
        100: "var(--color-green-100)",
        200: "var(--color-green-200)",
        300: "var(--color-green-300)",
        400: "var(--color-green-400)",
        500: "var(--color-green-500)",
        600: "var(--color-green-600)",
        700: "var(--color-green-700)",
        800: "var(--color-green-800)",
        900: "var(--color-green-900)",
        950: "var(--color-green-950)",
      },
      emerald: {
        50: "var(--color-emerald-50)",
        100: "var(--color-emerald-100)",
        200: "var(--color-emerald-200)",
        300: "var(--color-emerald-300)",
        400: "var(--color-emerald-400)",
        500: "var(--color-emerald-500)",
        600: "var(--color-emerald-600)",
        700: "var(--color-emerald-700)",
        800: "var(--color-emerald-800)",
        900: "var(--color-emerald-900)",
        950: "var(--color-emerald-950)",
      },
      teal: {
        50: "var(--color-teal-50)",
        100: "var(--color-teal-100)",
        200: "var(--color-teal-200)",
        300: "var(--color-teal-300)",
        400: "var(--color-teal-400)",
        500: "var(--color-teal-500)",
        600: "var(--color-teal-600)",
        700: "var(--color-teal-700)",
        800: "var(--color-teal-800)",
        900: "var(--color-teal-900)",
        950: "var(--color-teal-950)",
      },
      cyan: {
        50: "var(--color-cyan-50)",
        100: "var(--color-cyan-100)",
        200: "var(--color-cyan-200)",
        300: "var(--color-cyan-300)",
        400: "var(--color-cyan-400)",
        500: "var(--color-cyan-500)",
        600: "var(--color-cyan-600)",
        700: "var(--color-cyan-700)",
        800: "var(--color-cyan-800)",
        900: "var(--color-cyan-900)",
        950: "var(--color-cyan-950)",
      },
      sky: {
        50: "var(--color-sky-50)",
        100: "var(--color-sky-100)",
        200: "var(--color-sky-200)",
        300: "var(--color-sky-300)",
        400: "var(--color-sky-400)",
        500: "var(--color-sky-500)",
        600: "var(--color-sky-600)",
        700: "var(--color-sky-700)",
        800: "var(--color-sky-800)",
        900: "var(--color-sky-900)",
        950: "var(--color-sky-950)",
      },
      blue: {
        50: "var(--color-blue-50)",
        100: "var(--color-blue-100)",
        200: "var(--color-blue-200)",
        300: "var(--color-blue-300)",
        400: "var(--color-blue-400)",
        500: "var(--color-blue-500)",
        600: "var(--color-blue-600)",
        700: "var(--color-blue-700)",
        800: "var(--color-blue-800)",
        900: "var(--color-blue-900)",
        950: "var(--color-blue-950)",
      },
      indigo: {
        50: "var(--color-indigo-50)",
        100: "var(--color-indigo-100)",
        200: "var(--color-indigo-200)",
        300: "var(--color-indigo-300)",
        400: "var(--color-indigo-400)",
        500: "var(--color-indigo-500)",
        600: "var(--color-indigo-600)",
        700: "var(--color-indigo-700)",
        800: "var(--color-indigo-800)",
        900: "var(--color-indigo-900)",
        950: "var(--color-indigo-950)",
      },
      violet: {
        50: "var(--color-violet-50)",
        100: "var(--color-violet-100)",
        200: "var(--color-violet-200)",
        300: "var(--color-violet-300)",
        400: "var(--color-violet-400)",
        500: "var(--color-violet-500)",
        600: "var(--color-violet-600)",
        700: "var(--color-violet-700)",
        800: "var(--color-violet-800)",
        900: "var(--color-violet-900)",
        950: "var(--color-violet-950)",
      },
      purple: {
        50: "var(--color-purple-50)",
        100: "var(--color-purple-100)",
        200: "var(--color-purple-200)",
        300: "var(--color-purple-300)",
        400: "var(--color-purple-400)",
        500: "var(--color-purple-500)",
        600: "var(--color-purple-600)",
        700: "var(--color-purple-700)",
        800: "var(--color-purple-800)",
        900: "var(--color-purple-900)",
        950: "var(--color-purple-950)",
      },
      fuchsia: {
        50: "var(--color-fuchsia-50)",
        100: "var(--color-fuchsia-100)",
        200: "var(--color-fuchsia-200)",
        300: "var(--color-fuchsia-300)",
        400: "var(--color-fuchsia-400)",
        500: "var(--color-fuchsia-500)",
        600: "var(--color-fuchsia-600)",
        700: "var(--color-fuchsia-700)",
        800: "var(--color-fuchsia-800)",
        900: "var(--color-fuchsia-900)",
        950: "var(--color-fuchsia-950)",
      },
      pink: {
        50: "var(--color-pink-50)",
        100: "var(--color-pink-100)",
        200: "var(--color-pink-200)",
        300: "var(--color-pink-300)",
        400: "var(--color-pink-400)",
        500: "var(--color-pink-500)",
        600: "var(--color-pink-600)",
        700: "var(--color-pink-700)",
        800: "var(--color-pink-800)",
        900: "var(--color-pink-900)",
        950: "var(--color-pink-950)",
      },
      rose: {
        50: "var(--color-rose-50)",
        100: "var(--color-rose-100)",
        200: "var(--color-rose-200)",
        300: "var(--color-rose-300)",
        400: "var(--color-rose-400)",
        500: "var(--color-rose-500)",
        600: "var(--color-rose-600)",
        700: "var(--color-rose-700)",
        800: "var(--color-rose-800)",
        900: "var(--color-rose-900)",
        950: "var(--color-rose-950)",
      },
      slate: {
        50: "var(--color-slate-50)",
        100: "var(--color-slate-100)",
        200: "var(--color-slate-200)",
        300: "var(--color-slate-300)",
        400: "var(--color-slate-400)",
        500: "var(--color-slate-500)",
        600: "var(--color-slate-600)",
        700: "var(--color-slate-700)",
        800: "var(--color-slate-800)",
        900: "var(--color-slate-900)",
        950: "var(--color-slate-950)",
      },
      gray: {
        50: "var(--color-gray-50)",
        100: "var(--color-gray-100)",
        200: "var(--color-gray-200)",
        300: "var(--color-gray-300)",
        400: "var(--color-gray-400)",
        500: "var(--color-gray-500)",
        600: "var(--color-gray-600)",
        700: "var(--color-gray-700)",
        800: "var(--color-gray-800)",
        900: "var(--color-gray-900)",
        950: "var(--color-gray-950)",
      },
      zinc: {
        50: "var(--color-zinc-50)",
        100: "var(--color-zinc-100)",
        200: "var(--color-zinc-200)",
        300: "var(--color-zinc-300)",
        400: "var(--color-zinc-400)",
        500: "var(--color-zinc-500)",
        600: "var(--color-zinc-600)",
        700: "var(--color-zinc-700)",
        800: "var(--color-zinc-800)",
        900: "var(--color-zinc-900)",
        950: "var(--color-zinc-950)",
      },
      neutral: {
        50: "var(--color-neutral-50)",
        100: "var(--color-neutral-100)",
        200: "var(--color-neutral-200)",
        300: "var(--color-neutral-300)",
        400: "var(--color-neutral-400)",
        500: "var(--color-neutral-500)",
        600: "var(--color-neutral-600)",
        700: "var(--color-neutral-700)",
        800: "var(--color-neutral-800)",
        900: "var(--color-neutral-900)",
        950: "var(--color-neutral-950)",
      },
      stone: {
        50: "var(--color-stone-50)",
        100: "var(--color-stone-100)",
        200: "var(--color-stone-200)",
        300: "var(--color-stone-300)",
        400: "var(--color-stone-400)",
        500: "var(--color-stone-500)",
        600: "var(--color-stone-600)",
        700: "var(--color-stone-700)",
        800: "var(--color-stone-800)",
        900: "var(--color-stone-900)",
        950: "var(--color-stone-950)",
      },
      black: "var(--color-black)",
      white: "var(--color-white)",
    },
    extend: {
      colors: {
        ...deprecatedColors,
        // TODO: Move all colors over to Tailwind
        // Currently color utility classes are still generated with SCSS in colors.scss due to relying on our color
        // CSS vars in lots of stylesheets

        // purple: '#B62AD9',
        "primary-highlight": "var(--primary-highlight)",
      },
      backgroundColor: {
        ...commonColors,
        primary: "var(--bg-primary)",

        "surface-primary": "var(--bg-surface-primary)",
        "surface-secondary": "var(--bg-surface-secondary)",
        "surface-tertiary": "var(--bg-surface-tertiary)",
        "surface-tooltip": "var(--bg-surface-tooltip)",
        "surface-tooltip-inverse": "var(--bg-surface-tooltip-inverse)",
        "surface-popover": "var(--bg-surface-popover)",
        "surface-popover-inverse": "var(--bg-surface-popover-inverse)",
        "fill-primary": "var(--bg-fill-primary)",
        "fill-secondary": "var(--bg-fill-secondary)",
        "fill-tertiary": "var(--bg-fill-tertiary)",
        "fill-highlight-50": "var(--bg-fill-highlight-50)",
        "fill-highlight-inverse-50": "var(--bg-fill-highlight-inverse-50)",
        "fill-highlight-100": "var(--bg-fill-highlight-100)",
        "fill-highlight-inverse-100": "var(--bg-fill-highlight-inverse-100)",
        "fill-highlight-150": "var(--bg-fill-highlight-150)",
        "fill-highlight-inverse-150": "var(--bg-fill-highlight-inverse-150)",
        "fill-highlight-200": "var(--bg-fill-highlight-200)",
        "fill-highlight-inverse-200": "var(--bg-fill-highlight-inverse-200)",
        "fill-primary-highlight": "var(--bg-fill-primary-highlight)",
        "fill-info-secondary": "var(--bg-fill-info-secondary)",
        "fill-info-tertiary": "var(--bg-fill-info-tertiary)",
        "fill-info-highlight": "var(--bg-fill-info-highlight)",
        "fill-warning-secondary": "var(--bg-fill-warning-secondary)",
        "fill-warning-tertiary": "var(--bg-fill-warning-tertiary)",
        "fill-warning-highlight": "var(--bg-fill-warning-highlight)",
        "fill-error-secondary": "var(--bg-fill-error-secondary)",
        "fill-error-tertiary": "var(--bg-fill-error-tertiary)",
        "fill-error-highlight": "var(--bg-fill-error-highlight)",
        "fill-success-secondary": "var(--bg-fill-success-secondary)",
        "fill-success-tertiary": "var(--bg-fill-success-tertiary)",
        "fill-success-highlight": "var(--bg-fill-success-highlight)",
        "fill-button-group-tertiary-hover":
          "var(--bg-fill-button-group-tertiary-hover)",
        "fill-button-tertiary-hover": "var(--bg-fill-button-tertiary-hover)",
        "fill-button-tertiary-hover-inverse":
          "var(--bg-fill-button-tertiary-hover-inverse)",
        "fill-button-tertiary-active": "var(--bg-fill-button-tertiary-active)",
        "fill-button-tertiary-active-inverse":
          "var(--bg-fill-button-tertiary-active-inverse)",
        "fill-input": "var(--bg-fill-input)",
        "fill-switch": "var(--bg-fill-switch)",
        "fill-slider-rail": "var(--bg-fill-slider-rail)",
        "fill-scroll-thumb": "var(--bg-fill-scroll-thumb)",
        "border-primary": "var(--bg-border-primary)",
        "border-secondary": "var(--bg-border-secondary)",
      },
      textColor: {
        ...commonColors,

        primary: "var(--text-primary)",
        "primary-inverse": "var(--text-primary-inverse)",
        secondary: "var(--text-secondary)",
        quaternary: "var(--text-quaternary)",
        tertiary: "var(--text-tertiary)",
        success: "var(--text-success)",
        warning: "var(--text-warning)",
        error: "var(--text-error)",
        "info-on-fill": "var(--text-info-on-fill)",
        "warning-on-fill": "var(--text-warning-on-fill)",
        "error-on-fill": "var(--text-error-on-fill)",
        "success-on-fill": "var(--text-success-on-fill)",
      },
      borderColor: {
        ...commonColors,

        primary: "var(--border-primary)",
        secondary: "var(--border-secondary)",
        info: "var(--border-info)",
        warning: "var(--border-warning)",
        error: "var(--border-error)",
        success: "var(--border-success)",
      },
      ringColor: {
        ...commonColors,

        primary: "var(--border-primary)",
        secondary: "var(--border-secondary)",
        info: "var(--border-info)",
        warning: "var(--border-warning)",
        error: "var(--border-error)",
        success: "var(--border-success)",
      },
      fontFamily: {
        sans: [
          "Emoji Flags Polyfill",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
        title: [
          "Emoji Flags Polyfill",
          "MatterSQ",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
        mono: [
          "Emoji Flags Polyfill",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      screens: {
        // Sync with vars.scss
        sm: "576px",
        md: "768px",
        lg: "992px",
        xl: "1200px",
        "2xl": "1600px",
      },
      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        full: "9999px",
      },
      spacing: {
        // Some additional larger widths for compatibility with our pre-Tailwind system
        // Don't add new ones here, in new code just use the `w-[32rem]` style for arbitrary values
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem",
        // All whole number values up to 18 ensured above
        30: "7.5rem",
        50: "12.5rem",
        60: "15rem",
        80: "20rem",
        100: "25rem",
        120: "30rem",
        140: "35rem",
        160: "40rem",
        180: "45rem",
        192: "48rem",
        200: "50rem",
        // All whole number values divisible by 20 up to 200 ensured above
        248: "62rem",
        300: "75rem",
        "scene-padding": "var(--scene-padding)",
      },
      rotate: {
        270: "270deg",
      },
      minWidth: {
        "1/3": "33.333333%",
      },
      maxWidth: {
        "1/2": "50%",
      },
      boxShadow: {
        DEFAULT: "var(--shadow-elevation-3000)",
      },
      flex: {
        2: "2 2 0%",
        3: "3 3 0%",
      },
      zIndex: {
        top: "var(--z-top)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    plugin(({ addUtilities, theme }) => {
      const spacing = theme("spacing");
      const newUtilities = {};

      // Standard spacing utilities for backwards compatibility
      for (const [key, value] of Object.entries(spacing)) {
        if (!key.includes(".")) {
          newUtilities[
            `.deprecated-space-y-${key} > :not([hidden]) ~ :not([hidden])`
          ] = {
            "--tw-space-y-reverse": "0",
            "margin-top": `calc(${value} * calc(1 - var(--tw-space-y-reverse)))`,
            "margin-bottom": `calc(${value} * var(--tw-space-y-reverse))`,
          };
          newUtilities[
            `.deprecated-space-x-${key} > :not([hidden]) ~ :not([hidden])`
          ] = {
            "--tw-space-x-reverse": "0",
            "margin-right": `calc(${value} * var(--tw-space-x-reverse))`,
            "margin-left": `calc(${value} * calc(1 - var(--tw-space-x-reverse)))`,
          };
        }
      }
      addUtilities(newUtilities);
    }),
  ],
};

module.exports = {
  ...config,
  content: config.content.map((path) => path.replace(/\.\.\//g, "../../")),
};
