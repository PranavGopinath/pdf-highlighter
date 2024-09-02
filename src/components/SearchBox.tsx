'use client'

import { useState } from 'react'
import { Input } from "@/components/Input"
import { Button } from "@/components/Button"
import { SearchIcon } from 'lucide-react'


interface SearchBoxProps {
  onSearch: (terms: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSearchQuery(event.target.value)
  };

  const handleSearch = () => {
    onSearch(searchTerm);
  };





  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Implement your search logic here
    console.log('Searching for:', searchQuery)
  }

  

  return (
    <div className = "flex justify-center items-center">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
      <input
              type="text"
              placeholder="Enter keyword to highlight"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleChange}
            />
      <Button type="submit" className="shrink-0" onClick={handleSearch}>
        <SearchIcon className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
    </div>
  )
}

export default SearchBox;

