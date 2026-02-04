"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send Message"}
    </Button>
  );
}
