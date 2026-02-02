/**
 * Subdomain Router for VoltFix
 * 
 * Routes:
 * - app.* / backoffice.* → Backoffice (admin, technician dashboards)
 * - www.* / book.* / root → Customer site (booking flow, SEO-optimized)
 * - localhost / preview → Development mode (shows both based on route)
 */

export type SiteMode = "customer" | "backoffice" | "development";

export function getSiteMode(): SiteMode {
  const hostname = window.location.hostname;
  
  // Development / Preview - show both (route-based switching)
  if (
    hostname === "localhost" ||
    hostname.includes("lovable.app") ||
    hostname.includes("127.0.0.1")
  ) {
    return "development";
  }
  
  // Backoffice subdomains
  if (
    hostname.startsWith("app.") ||
    hostname.startsWith("backoffice.") ||
    hostname.startsWith("admin.")
  ) {
    return "backoffice";
  }
  
  // Customer site (www, book, or root domain)
  return "customer";
}

export function isBackofficeRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/technician") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  );
}

export function isCustomerRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/track")
  );
}

/**
 * Get the appropriate base URL for redirects between sites
 */
export function getBackofficeUrl(): string {
  const hostname = window.location.hostname;
  
  // Development mode
  if (hostname === "localhost" || hostname.includes("lovable.app")) {
    return window.location.origin;
  }
  
  // Production: app.voltfix.nl
  const domain = hostname.replace(/^(www\.|book\.)/, "");
  return `https://app.${domain}`;
}

export function getCustomerUrl(): string {
  const hostname = window.location.hostname;
  
  // Development mode
  if (hostname === "localhost" || hostname.includes("lovable.app")) {
    return window.location.origin;
  }
  
  // Production: www.voltfix.nl or voltfix.nl
  const domain = hostname.replace(/^(app\.|backoffice\.|admin\.)/, "");
  return `https://${domain}`;
}
