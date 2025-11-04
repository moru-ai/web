import { redirect } from "react-router";
import type { Route } from "./+types/create-task";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const prompt = formData.get("prompt");

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return redirect("/settings");
  }

  return redirect("/settings");
}
