"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HELP_TIPS, type HelpTipId } from "@/data/help-tips";
import { useTooltipPosition } from "@/lib/hooks/use-tooltip-position";

interface HelpTipProps {
  tipId: HelpTipId;
}

export function HelpTip({ tipId }: HelpTipProps) {
  const tip = HELP_TIPS[tipId];
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLOutputElement>(null);
  const { position, updatePosition } = useTooltipPosition();

  const showTooltip = pinned || visible;

  // Handle hover with 300ms delay
  function handleMouseEnter() {
    if (pinned) return;
    hoverTimer.current = setTimeout(() => {
      if (triggerRef.current) {
        updatePosition(triggerRef.current.getBoundingClientRect());
      }
      setVisible(true);
    }, 300);
    setHovered(true);
  }

  function handleMouseLeave() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHovered(false);
    if (!pinned) {
      setVisible(false);
    }
  }

  // Handle click to pin/unpin
  function handleClick() {
    if (pinned) {
      setPinned(false);
      setVisible(false);
    } else {
      if (triggerRef.current) {
        updatePosition(triggerRef.current.getBoundingClientRect());
      }
      setPinned(true);
      setVisible(true);
    }
  }

  // Close on Escape or click-outside
  useEffect(() => {
    if (!pinned) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setVisible(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setPinned(false);
        setVisible(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pinned]);

  // Clean up hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
    };
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber/20 text-amber hover:bg-amber/30 transition-colors cursor-pointer text-[10px] font-bold leading-none"
        aria-label={`Help: ${tip.title}`}
      >
        ?
      </button>

      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <output
            ref={tooltipRef}
            className="fixed z-50 w-64 rounded-lg border border-border bg-surface shadow-lg p-3 pointer-events-auto block"
            style={{ top: position.top, left: position.left }}
          >
            <p className="text-xs font-semibold text-text-primary mb-1">
              {tip.title}
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              {tip.body}
            </p>
          </output>,
          document.body,
        )}
    </>
  );
}
