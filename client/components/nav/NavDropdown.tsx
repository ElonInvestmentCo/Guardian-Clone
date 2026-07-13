import { Link } from "wouter";
import type { CSSProperties } from "react";

interface DropdownItem {
  label: string;
  href: string;
}

interface Props {
  /** Trigger label, e.g. "Platforms" or "Services". Rendered with the same
   * hover-indicator styling as the plain top-nav links. */
  label: string;
  items: DropdownItem[];
  className?: string;
  style?: CSSProperties;
  testId?: string;
}

/**
 * Reusable hover-triggered nav dropdown. Used for "Platforms" → "OMS
 * Platforms" and "Services" → "Stock Locates & Borrows" / "TraderVue",
 * matching the production Guardian Trading site. Opens on hover (and on
 * keyboard focus for accessibility), fades + slides in without layout
 * shift since the panel is `position: absolute`.
 */
export function NavDropdown({ label, items, className, style, testId }: Props) {
  return (
    <div className={`nav-dropdown ${className ?? ""}`.trim()}>
      <span
        className="gt-nav-link"
        tabIndex={0}
        style={style}
        data-testid={testId}
      >
        {label}
      </span>
      <div className="nav-dropdown-panel" role="menu">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="nav-dropdown-item"
            role="menuitem"
            data-testid={`link-dropdown-${item.label.toLowerCase().replace(/\s|&/g, "-")}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
