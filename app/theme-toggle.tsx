"use client";

import { useEffect } from "react";
import { initThemeToggle } from "prignano-theme";

// Wires up the header's dark-mode toggle once the page is interactive.
export default function ThemeToggle() {
  useEffect(() => initThemeToggle(), []);
  return null;
}
