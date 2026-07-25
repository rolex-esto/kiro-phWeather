import { useState, useRef, useEffect } from 'react';
import { SearchIcon, MapPinIcon, XIcon } from './Icons';
import { REGIONS } from '../utils/regions';
import './RegionSearch.css';

interface Props {
  selected: string;
  onSelect: (region: string) => void;
}

export function RegionSearch({ selected, onSelect }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = searchQuery.trim()
    ? REGIONS.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q) ||
          r.number.toLowerCase().includes(q) ||
          r.keywords.includes(q)
        );
      })
    : REGIONS;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(regionId: string) {
    onSelect(regionId);
    setSearchQuery('');
    setIsOpen(false);
  }

  return (
    <div className="region-search" ref={containerRef}>
      <div className="search-input-wrapper">
        <SearchIcon size={18} color="var(--text-muted)" className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search region, province, or city..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          aria-label="Search for a Philippine region"
          aria-expanded={isOpen}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <XIcon size={16} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {isOpen && (
        <ul className="search-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li className="search-empty">No regions found</li>
          ) : (
            filtered.map((r) => (
              <li
                key={r.id}
                className={`search-item ${r.id === selected ? 'active' : ''}`}
                onClick={() => handleSelect(r.id)}
                role="option"
                aria-selected={r.id === selected}
              >
                <MapPinIcon size={16} color={r.id === selected ? 'var(--accent)' : 'var(--text-muted)'} />
                <span className="search-item-text">
                  <strong>{r.number}</strong>
                  <small>{r.label}</small>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
