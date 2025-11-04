import { useLayoutEffect, useState } from 'react';

import { ArrowDown, Check, ChevronDown, ChevronsDown, ChevronsUpDown } from 'lucide-react';

import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { api } from '@moru/convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
  },
];

// 1. Get repos
// 2. Set default repo
// 3.

export function RepoSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const { data: repositories } = useSuspenseQuery(convexQuery(api.git.listRepositories, {}));

  console.log('repositories', repositories);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <span className="overflow-hidden text-ellipsis">
            {value
              ? repositories.find((repository) => repository.name === value)?.name
              : 'Select repository...'}
          </span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {repositories.map((repository) => (
                <CommandItem
                  key={repository.name}
                  value={repository.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  {repository.name}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === repository.name ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
