import { useEffect, useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Spinner } from "./spinner";
import { RepoSelect } from "../repo-select/repo-select";
import { BranchSelect } from "../branch-select/branch-select";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import { toast } from "sonner";

export function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Doc<"remote_repositories"> | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRepo) {
      setSelectedBranch(null);
    }
  }, [selectedRepo]);

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: useConvexMutation(api.tasks.createTask),
    onSuccess: () => {
      setPrompt("");
      toast.success("Task created successfully");
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });

  const isSubmitting = isPending;
  const isSubmitDisabled =
    isSubmitting || prompt.trim().length === 0 || !selectedRepo || !selectedBranch;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRepo || !selectedBranch || prompt.trim().length === 0) {
      return;
    }

    createTask({
      prompt,
      repo: selectedRepo._id,
      branch: selectedBranch,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border border-1 flex max-h-96 flex-col gap-2 rounded-2xl p-4"
    >
      <Textarea
        name="prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Enter your prompt"
        className="prompt-textarea w-full resize-y border-none p-0 shadow-none focus:shadow-none focus:outline-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={isSubmitting}
      />
      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <RepoSelect onSelect={setSelectedRepo} />
          {selectedRepo && (
            <BranchSelect repoFullName={selectedRepo.fullName} onSelect={setSelectedBranch} />
          )}
        </div>
        <Button
          type="submit"
          size="icon"
          aria-label="Submit"
          className="rounded-full"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? <Spinner /> : <ArrowUpIcon />}
        </Button>
      </div>
    </form>
  );
}
