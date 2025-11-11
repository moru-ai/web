import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type GithubInstallation = Doc<"github_installations">;

export function RepoTable({ installation }: { installation: GithubInstallation }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.git.listReposByInstallation, {
      installationId: installation.installationId,
      paginationOpts: { numItems: 50, cursor: null },
    }),
  );

  const repositories = data.page ?? [];

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-card/50">
          <TableRow>
            <TableHead className="px-3">Repository</TableHead>
            <TableHead className="px-3">Visibility</TableHead>
            <TableHead className="px-3">Default Branch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repositories.length > 0 ? (
            repositories.map((repo) => (
              <TableRow key={repo._id}>
                <TableCell className="text-foreground font-medium">{repo.fullName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {repo.visibility ?? (repo.private ? "private" : "public")}
                </TableCell>
                <TableCell className="text-muted-foreground">{repo.defaultBranch ?? "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                No repositories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
