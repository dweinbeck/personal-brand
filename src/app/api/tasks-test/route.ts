import { NextResponse } from "next/server";
import { getTestWorkspaces } from "@/lib/actions/tasks-test";

export async function GET() {
  const result = await getTestWorkspaces();

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
