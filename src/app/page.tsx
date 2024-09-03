'use client';

import React, { useState, useEffect } from "react";
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
} from "react-pdf-highlighter";
import SearchBox from '../components/SearchBox';
import PDFUpload from '../components/PDFUpload';
import { Sidebar } from "../components/Sidebar";
import { Spinner } from "../components/Spinner";
import { pdfjs } from 'react-pdf';
import "../style/App.css";
import { usePdfTextSearch } from "../components/usePdfTextSearch";
import debounce from 'lodash/debounce';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

import type {
  Content,
  IHighlight,
  NewHighlight,
  ScaledPosition,
  LTWHP,
} from "react-pdf-highlighter";

type BoundingRect = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  pageNumber: number,
};

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";

const searchParams = new URLSearchParams(window.location.search);
const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () => window.location.hash.slice("#highlight-".length);

const resetHash = () => {
  window.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

let scrollViewerTo: (highlight: IHighlight) => void = () => {};

const Page = () => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<string>("");
  const [keywordRects, setKeywordRects] = useState<BoundingRect[]>([]);

  const updateKeywordRects = (newRects: BoundingRect[]) => {
    setKeywordRects(newRects);
  };

  const searchResults = usePdfTextSearch({ file: url, searchString: searchTerms });

  useEffect(() => {
    const handleHashChange = () => {
      scrollToHighlightFromHash();
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [highlights]);

  const handleSetFile = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setUrl(url); // Set the URL for the PDF viewer
    } else {
      setFileUrl(null);
      setUrl(initialUrl); // Reset to initial URL if no file is selected
    }
  };

  const resetHighlights = () => {
    setHighlights([]);
  };


  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight) {
      scrollViewerTo(highlight);
    }
  };

  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  const addHighlight = (highlight: NewHighlight) => {
    console.log("Saving highlight", highlight);
    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>
  ) => {
    console.log("Updating highlight", highlightId, position, content);

    setHighlights(
      highlights.map((h) =>
        h.id === highlightId
          ? {
              ...h,
              position: { ...h.position, ...position },
              content: { ...h.content, ...content },
            }
          : h
      )
    );
  };

  const handleSearch = (terms: string) => {
    setSearchTerms(terms);
  };



  const debouncedHighlightTermsInPdf = debounce(() => {
    const newHighlights: IHighlight[] = [];
    const newRects: BoundingRect[] = [];
  
    searchResults.forEach((searchResult) => {
      const { position, pageNumber, matchedText } = searchResult;
  
      // Create bounding rectangle
      const boundingRect: BoundingRect = {
        x1: position.x1,
        y1: position.y1,
        x2: position.x2,
        y2: position.y2,
        width: position.x2 - position.x1,
        height: position.y1 - position.y2,
        pageNumber: pageNumber,
      };
  
      newRects.push(boundingRect);
  
      newHighlights.push({
        id: getNextId(),
        position: {
          boundingRect,
          rects: [boundingRect],
          pageNumber: pageNumber,
        },
        content: { text: matchedText },
        comment: { text: searchTerms, emoji: "🔍" },
      });
    });
  
    setHighlights(newHighlights);
    updateKeywordRects(newRects);
  }, 500);

  const convertBoundingRectToLTWHP = (rect: BoundingRect): LTWHP => {
    return {
      top: 750 - rect.y1,
      left: rect.x1,
      width: rect.width,
      height: rect.height,
      pageNumber: rect.pageNumber
    };
  };

  const resetSearchResults = () => {
    // This could reset the search term and clear current search results visually
    setSearchTerms("");
    // Additional functionality might be needed depending on how search results are managed
  };
  

  useEffect(() => {
    if (searchResults.length > 0) {
      debouncedHighlightTermsInPdf();
    }
  }, [searchResults]);

  let resultText =
    searchResults.length === 1
      ? "Results found on 1 page"
      : `Results found on ${searchResults.length} pages`;

  if (searchResults.length === 0) {
    resultText = "No results found";
  }

  console.log(searchResults);
  return (
    <div className="App" style={{ display: "flex", height:"100vh", width: "full"}}>
      <Sidebar
        searchResults={searchResults}
        resetSearchResults={resetSearchResults}
      />
      <div className = "h-4/5 w-1/2 relative justify-center left-20"
      >
        <PDFUpload setFile={handleSetFile} />
        <SearchBox onSearch={handleSearch} />
        <p>{resultText}</p>
        <PdfLoader url={url} beforeLoad={<Spinner />}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey} // Disable area selection
              onScrollChange={resetHash}
              scrollRef={(scrollTo) => {
                scrollViewerTo = scrollTo;
                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={(comment) => {
                    addHighlight({ content, position, comment });
                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {

                const keywordHighlightComponents = keywordRects
                .map((rect, index) => {
                  const lthwpRect = convertBoundingRectToLTWHP(rect);
                  console.log("BoundingRect:", rect);
                  console.log("Converted LTWHP:", lthwpRect);

                
                  return (
                    <Highlight
                      key={index}
                      isScrolledTo={false} // or pass appropriate value
                      position={{
                        boundingRect: lthwpRect,
                        rects: [lthwpRect],
                      }}
                      comment={{ text: searchTerms, emoji: "" }}
                    />
                  );
                });
                
                

                const component = (
                  <>
                    {keywordHighlightComponents}
                  </>
                );
                

                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={(popupContent) =>
                      setTip(highlight, () => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default Page;
