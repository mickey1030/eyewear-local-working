import { useEffect } from "react";
import { useLocation } from "wouter";

const NOINDEX_PREFIXES = ["/cart", "/search", "/order", "/order-confirmation", "/admin"];

function isNoindexPath(path: string): boolean {
  return NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function RobotsMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const noindex = isNoindexPath(location);
    let tag = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');

    if (noindex) {
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "robots");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", "noindex, nofollow");
    } else if (tag) {
      tag.remove();
    }
  }, [location]);

  return null;
}
