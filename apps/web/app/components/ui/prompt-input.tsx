import { useState } from 'react';
import { useFetcher } from 'react-router';
import { ArrowUpIcon } from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Spinner } from './spinner';
import { RepoSelect } from '../repo-select/repo-select';

export function PromptInput() {
  const fetcher = useFetcher();
  const [prompt, setPrompt] = useState('');

  const isSubmitting = fetcher.state !== 'idle';
  const isSubmitDisabled = isSubmitting || prompt.trim().length === 0;

  return (
    <fetcher.Form
      method="post"
      action="/create-task"
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
      <div className="flex justify-between">
        <RepoSelect />
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
    </fetcher.Form>
  );
}
