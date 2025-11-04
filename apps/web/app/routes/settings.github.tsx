import { redirect } from "react-router";

export async function loader() {
  // Redirect old/deep links to the consolidated Connectors page
  throw redirect("/settings");
}

export default function Component() {
  return null;
}
