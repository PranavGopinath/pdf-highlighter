import React from "react";

interface SearchResult {
  pageNumber: number;
  matchedText: string;
  position: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface SidebarProps {
  searchResults: Array<SearchResult>;
  resetSearchResults: () => void;
}

export function Sidebar({
  searchResults,
  resetSearchResults,
}: SidebarProps) {
  return (
    <div className="flex w-1/3 h-full overflow-auto rounded-r-md bg-secondary" >
        <div className = "flex flex-col">
        <div className="description" style={{ padding: "1rem" }}>
        <h2>Search Results</h2>
        <p>Click on a result to highlight it in the document.</p>
      </div>
      {searchResults.length > 0 && (
        <div style={{ padding: "1rem" }}>
          <button type="button" onClick={resetSearchResults}>
            Clear search results
          </button>
        </div>
      )}
        </div>
      <ul className="sidebar__results">
        {searchResults.map((result, index) => (
          <li key={index} className="sidebar__result" onClick={() => {
            document.location.hash = `result-${index}`;
          }}>
            <div>
              <strong>Matched: {result.matchedText}</strong>
              <blockquote>
                Page {result.pageNumber} at coordinates ({result.position.x1.toFixed(1)}, {result.position.y1.toFixed(1)})
              </blockquote>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
