import { redirect } from "next/navigation";

const TASKS_URL =
  process.env.NEXT_PUBLIC_TASKS_APP_URL || "https://tasks.dev.dan-weinbeck.com";

export default function Page() {
  redirect(TASKS_URL);
}
