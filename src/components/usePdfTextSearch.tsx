import { useState, useEffect } from "react";
import { pdfjs } from "react-pdf";

interface UsePdfTextSearchProps {
  file: string;
  searchString: string;
}

interface TextItem {
  str: string;
  transform: number[]; // Contains position and scaling information
  width: number;
}

interface SearchResult {
  pageNumber: number;
  matchedText: string; // This will store the individual keyword that matched
  matchIndex: number;
  position: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export const usePdfTextSearch = ({ file, searchString }: UsePdfTextSearchProps): SearchResult[] => {
  const [resultsList, setResultsList] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!file || !searchString.trim()) {
      setResultsList([]);
      return;
    }

    const fetchTextData = async () => {
      try {
        const docData = await pdfjs.getDocument(file).promise;
        const pageCount = docData._pdfInfo.numPages;
        const allPageItems = [];

        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
          const pageData = await docData.getPage(pageNumber);
          const textContent = await pageData.getTextContent();
          const pageItems = textContent.items.map((item) => {
            if ("str" in item) {
              const textItem = item as TextItem;
              const x1 = textItem.transform[4];
              const y1 = textItem.transform[5];
              const x2 = x1 + textItem.width;
              const y2 = y1 - textItem.transform[3];

              return {
                text: textItem.str,
                position: { x1, y1, x2, y2 },
              };
            }
            return null;
          }).filter(item => item);

          allPageItems.push(...pageItems.map(item => ({
            ...item,
            pageNumber: pageNumber
          })));
        }

        const keywords = searchString.split('|').map(s => s.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const regex = new RegExp(keywords.join('|'), 'gi');

        const results = allPageItems.flatMap(item => {
          if (!item || !item.text) return [];
          const matches = [...item.text.matchAll(regex)];
          return matches.map(match => {
            if (item.position) {
              return {
                pageNumber: item.pageNumber,
                matchedText: match[0], // This will be the exact keyword that matched
                matchIndex: match.index,
                position: item.position,
              };
            }
            console.log(match[0])
            return null;
          });
        }).filter(match => match !== null);
        
        setResultsList(results);
      } catch (error) {
        console.error("Failed to load PDF or process text: ", error);
        setResultsList([]);
      }
    };

    fetchTextData();
  }, [file, searchString]);

  return resultsList;
};
