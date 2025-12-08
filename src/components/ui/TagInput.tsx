import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getAllTags } from "../../services/tagService";
import { cn } from "../../lib/utils";

interface TagInputProps {
  value: string[];           // Array tag yang sudah dipilih
  onChange: (tags: string[]) => void; // Fungsi untuk update state parent
  placeholder?: string;
  error?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({ value = [], onChange, placeholder, error }) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]); // Semua tag dari DB
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Load Tag Suggestions dari Database saat mount
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getAllTags();
      setSuggestions(tags);
    };
    loadTags();
  }, []);

  // 2. Handle Klik di luar dropdown (untuk menutup dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Handle Ketik (Filter Suggestions)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (val.trim().length > 0) {
      const filtered = suggestions.filter(
        (tag) => tag.toLowerCase().includes(val.toLowerCase()) && !value.includes(tag)
      );
      setFilteredSuggestions(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // 4. Handle Tombol (Enter = Add, Backspace = Remove last)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  // Logic Tambah Tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    // Cek: tidak kosong & belum ada di list
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]); // Update Parent
      setInputValue(""); // Reset input
      setShowDropdown(false);
    }
  };

  // Logic Hapus Tag
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className={cn(
        "flex flex-wrap items-center gap-2 p-2 rounded-md border bg-white focus-within:ring-2 focus-within:ring-brand-main/20",
        error ? "border-danger" : "border-gray-300"
      )}>
        {/* Render Selected Tags (Pills) */}
        {value.map((tag, index) => (
          <span key={index} className="bg-brand-accent/30 text-brand-main px-2 py-1 rounded text-sm flex items-center gap-1 font-medium">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-600 focus:outline-none"
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {/* Input Field */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowDropdown(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-1"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};