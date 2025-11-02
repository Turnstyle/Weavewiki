/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, forwardRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ onSearch, isLoading }, ref) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery(''); // Clear the input field after search
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Explore a topic (Ctrl+K)"
          className="search-input"
          aria-label="Search for a topic"
          disabled={isLoading}
        />
      </form>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
