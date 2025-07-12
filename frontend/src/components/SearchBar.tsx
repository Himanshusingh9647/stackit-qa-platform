import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize search query from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to home page with search params
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsFocused(false);
    } else {
      // Clear search if empty
      navigate('/');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  const handleQuickSearch = (tag: string) => {
    setSearchQuery(tag);
    navigate(`/?q=${encodeURIComponent(tag)}`);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className={`relative transition-all duration-300 ${
          isFocused ? 'transform scale-105' : ''
        }`}>
          {/* Background with gradient border effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 rounded-xl transition-all duration-300 ${
            isFocused ? 'opacity-100 p-0.5' : 'opacity-0 p-0'
          }`}>
            <div className="w-full h-full bg-white rounded-xl"></div>
          </div>
          
          {/* Search icon */}
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200 z-10 ${
            isFocused ? 'text-accent-500' : 'text-primary-400'
          }`} />
          
          {/* AI sparkle icon */}
          {searchQuery && (
            <Sparkles className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-500 z-10 animate-pulse-soft" />
          )}
          
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            placeholder="Search questions, topics, or ask anything..."
            className={`w-full pl-12 pr-12 py-4 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition-all duration-300 text-primary-900 placeholder-primary-400 text-sm font-medium relative z-10 ${
              isFocused ? 'shadow-elegant-lg bg-white' : 'shadow-elegant hover:shadow-elegant-lg'
            }`}
          />
        </div>
        
        {/* Quick search suggestions when focused */}
        {isFocused && !searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-primary-200 rounded-xl shadow-elegant-xl z-50 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-primary-100">
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">Quick Search</p>
            </div>
            <div className="p-2">
              {['React', 'JavaScript', 'TypeScript', 'Node.js', 'Database', 'Python', 'CSS', 'API'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur event
                    handleQuickSearch(tag);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center"
                >
                  <Search className="h-3 w-3 mr-2 text-primary-400" />
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
