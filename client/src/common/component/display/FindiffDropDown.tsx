import { useState, useRef, useEffect } from 'react';

interface FindiffDropDownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const FindiffDropDown = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  className = '',
  disabled = false
}: FindiffDropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display value
  const displayValue = value || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className={`relative flex-1 ${className}`} ref={dropdownRef} >
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Display button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`w-full border-2 border-gray-300 rounded-lg p-2 text-sm text-left cursor-pointer hover:border-blue-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-200 transition-all flex items-center justify-between ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${!value ? 'text-gray-400' : 'text-gray-900'}`}
        >
          <span className="truncate">{displayValue}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                className="w-full p-1 rounded-md text-sm border-none focus:outline-none"
              />
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      option === value ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindiffDropDown;