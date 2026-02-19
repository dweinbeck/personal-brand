"use client";

import { useCallback, useState } from "react";

interface TooltipPosition {
  top: number;
  left: number;
}

export function useTooltipPosition() {
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
  });

  const updatePosition = useCallback((triggerRect: DOMRect) => {
    const tooltipWidth = 256; // w-64
    const tooltipHeight = 80; // approx
    const gap = 8;

    let top = triggerRect.bottom + gap;
    let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8)
      left = window.innerWidth - tooltipWidth - 8;
    if (top + tooltipHeight > window.innerHeight - 8) {
      top = triggerRect.top - tooltipHeight - gap;
    }

    setPosition({ top, left });
  }, []);

  return { position, updatePosition };
}
