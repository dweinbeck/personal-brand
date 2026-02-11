"use client";

import { useEffect, useState } from "react";

/**
 * Dynamically loads a Google Font by fetching its CSS2 stylesheet,
 * extracting the woff2 URL, and registering it via the CSS Font Loading API.
 *
 * Best-effort: returns true on success, false on any error.
 */
export async function loadGoogleFont(
  family: string,
  weight = "400",
): Promise<boolean> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const res = await fetch(url);
    if (!res.ok) return false;

    const css = await res.text();
    const match = css.match(/url\(([^)]+\.woff2[^)]*)\)/);
    if (!match?.[1]) return false;

    const font = new FontFace(family, `url(${match[1]})`, { weight });
    await font.load();
    document.fonts.add(font);
    return true;
  } catch {
    return false;
  }
}

/**
 * React hook that dynamically loads a Google Font and reports loaded/error state.
 *
 * @param family - Google Font family name, or null to skip loading
 * @param weight - CSS font weight (default "400")
 */
export function useGoogleFont(
  family: string | null,
  weight = "400",
): { loaded: boolean; error: boolean } {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!family) return;

    let cancelled = false;

    // Check if font is already available
    if (document.fonts.check(`16px "${family}"`)) {
      setLoaded(true);
      return;
    }

    loadGoogleFont(family, weight).then((success) => {
      if (cancelled) return;
      if (success) {
        setLoaded(true);
      } else {
        setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [family, weight]);

  return { loaded, error };
}
