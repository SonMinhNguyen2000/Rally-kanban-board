import styles from './RallyLogo.module.css';

/** The transparent Rally mark used for product branding. */
export function RallyLogo() {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Rally"
    >
      <defs>
        <linearGradient id="rally-logo-gradient" x1="6" y1="25" x2="26" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5756d9" />
          <stop offset=".5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#20a581" />
        </linearGradient>
      </defs>
      <g fill="url(#rally-logo-gradient)">
        <rect x="6" y="5" width="4" height="22" rx="2" />
        <rect x="11.5" y="5" width="4" height="22" rx="2" />
        <rect x="17" y="5" width="4" height="22" rx="2" />
        <rect x="22.5" y="5" width="4" height="22" rx="2" />
      </g>
    </svg>
  );
}
