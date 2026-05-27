// BrandingProvider — fetches firm branding on app boot and injects
// CSS custom properties on `:root` so the whole app (PageShell, buttons,
// PDF previews) automatically picks up the principal's brand colours.
//
// CSS vars exposed:
//   --brand-primary   — primary navy
//   --brand-accent    — accent gold
//   --brand-firm-name — read by document.title
//
// Tailwind utilities consuming these vars should be added incrementally;
// this provider is non-invasive — components that still hard-code colours
// continue to work unchanged.
import { useEffect } from "react";

const API = process.env.REACT_APP_BACKEND_URL;

const DEFAULTS = {
  firm_name: "Halcyon Wealth Command Centre",
  primary_color: "#1a2744",
  accent_color: "#D4A84C",
};

export const BrandingProvider = ({ children }) => {
  useEffect(() => {
    let cancelled = false;
    const apply = (b) => {
      if (cancelled) return;
      const root = document.documentElement;
      root.style.setProperty("--brand-primary", b.primary_color || DEFAULTS.primary_color);
      root.style.setProperty("--brand-accent", b.accent_color || DEFAULTS.accent_color);
      root.style.setProperty("--brand-firm-name", `"${b.firm_name || DEFAULTS.firm_name}"`);
      // Update document.title so browser tabs reflect the firm name.
      if (b.firm_name) document.title = b.firm_name;
      // Update favicon if a logo_url is supplied (using favicon_url field).
      if (b.favicon_url) {
        let link = document.querySelector("link[rel='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = b.favicon_url;
      }
    };
    // Apply defaults immediately so first paint is correct, then refresh.
    apply(DEFAULTS);
    fetch(`${API}/api/branding/current`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && apply(data))
      .catch(() => { /* fall back to defaults */ });
    return () => { cancelled = true; };
  }, []);
  return children;
};

export default BrandingProvider;
