import { redirect } from "next/navigation";
import { clientEnv } from "@/lib/env";

const TASKS_URL =
  clientEnv().NEXT_PUBLIC_TASKS_APP_URL || "https://tasks.dev.dan-weinbeck.com";

export default function Page() {
  redirect(TASKS_URL);
}
