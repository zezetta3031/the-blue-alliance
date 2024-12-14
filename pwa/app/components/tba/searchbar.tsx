import { useNavigate } from '@remix-run/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SearchIndex } from '~/api/v3';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import FuzzysortFilterer from '~/lib/search/fuzzysortFilterer';
import { ProdAPIProvider } from '~/lib/search/prodAPIProvider';

export default function Searchbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const provider = useMemo(() => new ProdAPIProvider(), []);
  const filterer = useMemo(() => new FuzzysortFilterer(), []);

  const [fullSearchData, setFullSearchData] = useState<SearchIndex | null>(
    null,
  );

  useEffect(() => {
    provider
      .provide()
      .then((data) => {
        setFullSearchData(data);
      })
      .catch(() => {
        // todo: log in sentry
      });
  }, [provider]);

  const [searchResults, setSearchResults] = useState<SearchIndex | null>(null);

  useEffect(() => {
    if (fullSearchData === null) {
      return;
    }

    const searchResults = filterer.filter(fullSearchData, query);
    setSearchResults(searchResults);
  }, [query, fullSearchData, filterer]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Toggle the menu when ⌘K or ctrl-k is pressed
  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen((o) => !o);
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', listener);

    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, []);

  return (
    <Command className="relative" shouldFilter={false}>
      <CommandInput
        placeholder="Search"
        onFocus={() => {
          setIsOpen(true);
        }}
        onBlur={() => {
          setIsOpen(false);
        }}
        onValueChange={(e) => {
          setQuery(e);
        }}
        ref={inputRef}
      />

      {isOpen && (
        <CommandList className="fixed top-14 z-50  w-64 border border-gray-200 bg-white shadow-lg">
          {searchResults?.teams && searchResults.teams.length > 0 && (
            <CommandGroup heading="Teams">
              {searchResults.teams.map((team) => (
                <CommandItem
                  key={team.key}
                  onSelect={() => {
                    navigate(`/team/${team.key.substring(3)}`);
                    setIsOpen(false);
                  }}
                >
                  {team.key.substring(3)} - {team.nickname}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults?.events && searchResults.events.length > 0 && (
            <CommandGroup heading="Events">
              {searchResults.events.map((event) => (
                <CommandItem
                  key={event.key}
                  onSelect={() => {
                    navigate(`/event/${event.key}`);
                    setIsOpen(false);
                  }}
                >
                  {event.key.substring(0, 4)} {event.name} [
                  {event.key.substring(4)}]
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      )}
    </Command>
  );
}
