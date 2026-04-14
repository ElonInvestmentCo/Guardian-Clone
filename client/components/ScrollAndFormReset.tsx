import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function ScrollAndFormReset() {
  const [location] = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    if (prevLocation.current !== location) {
      const forms = document.querySelectorAll("form");
      forms.forEach((form) => form.reset());

      const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input, textarea, select"
      );
      inputs.forEach((el) => {
        if (el instanceof HTMLSelectElement) {
          el.selectedIndex = 0;
        } else {
          el.value = "";
        }
      });

      prevLocation.current = location;
    }
  }, [location]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return null;
}
