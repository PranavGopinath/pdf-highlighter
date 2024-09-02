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

interface PageItem {
  text: string;
  position: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface SearchResult {
  pageNumber: number;
  matchedText: string;
  matchIndex: number;
  position: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export const usePdfTextSearch = ({ file, searchString }: UsePdfTextSearchProps): SearchResult[] => {
  const [pages, setPages] = useState<PageItem[][]>([]);
  const [resultsList, setResultsList] = useState<SearchResult[]>([]);

  useEffect(() => {
    pdfjs.getDocument(file).promise.then((docData) => {
      const pageCount = docData._pdfInfo.numPages;

      const pagePromises = Array.from({ length: pageCount }, (_, pageNumber) =>
        docData.getPage(pageNumber + 1).then((pageData) =>
          pageData.getTextContent().then((textContent) => {
            return textContent.items.map((item) => {
              if ("str" in item) {
                const textItem = item as TextItem;

                // Calculate bounding box coordinates
                const x1 = textItem.transform[4];
                const y1 = textItem.transform[5];
                const x2 = x1 + textItem.width;
                const y2 = y1 - textItem.transform[3]; // Use the transform's scale for height

                return {
                  text: textItem.str,
                  position: { x1, y1, x2, y2 },
                };
              }
              return { text: "", position: { x1: 0, y1: 0, x2: 0, y2: 0 } };
            });
          })
        )
      );

      return Promise.all(pagePromises).then((pages) => {
        setPages(pages);
      });
    });
  }, [file]);

  useEffect(() => {
    if (!searchString || !searchString.length) {
      setResultsList([]);
      return;
    }

    const regex = new RegExp(`${searchString}`, "i");
    const updatedResults: SearchResult[] = [];

    pages.forEach((pageItems, pageIndex) => {
      pageItems.forEach((item, itemIndex) => {
        if (regex.test(item.text)) {
          updatedResults.push({
            pageNumber: pageIndex + 1,
            matchedText: item.text,
            matchIndex: itemIndex,
            position: item.position,
          });
        }
      });
    });

    setResultsList(updatedResults);
  }, [pages, searchString]);

  return resultsList;
};
