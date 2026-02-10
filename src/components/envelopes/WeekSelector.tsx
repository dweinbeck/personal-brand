"use client";

import { addWeeks, format, subWeeks } from "date-fns";
import { Button } from "@/components/ui/Button";
import { getWeekNumber, getWeekRange } from "@/lib/envelopes/week-math";

type WeekSelectorProps = {
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
};

export function WeekSelector({ weekStart, onWeekChange }: WeekSelectorProps) {
  const weekNum = getWeekNumber(weekStart);
  const range = getWeekRange(weekStart);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onWeekChange(subWeeks(weekStart, 1))}
        aria-label="Previous week"
      >
        &larr;
      </Button>
      <span className="min-w-[260px] text-center font-display text-sm font-semibold text-text-primary">
        Week {weekNum}: {format(range.start, "M/d/yyyy")} -{" "}
        {format(range.end, "M/d/yyyy")}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onWeekChange(addWeeks(weekStart, 1))}
        aria-label="Next week"
      >
        &rarr;
      </Button>
    </div>
  );
}
