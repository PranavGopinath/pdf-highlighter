'use client'

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
};

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";
const SECONDARY_PDF_URL = "https://www.homeworkforyou.com/static_media/uploadedfiles/TECH%20105%20complete%20book-7.pdf";

const searchParams = new URLSearchParams(document.location.search);
const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () => document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
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

  const toggleDocument = () => {
    const newUrl = url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;
    setUrl(newUrl);
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

  const convertBoundingRectToLTWHP = (rect: BoundingRect): LTWHP => {
    return {
      top: rect.y1,
      left: rect.x1,
      width: rect.width,
      height: rect.height,
      // Add the page number if it's required for `LTWHP`
    };
  };
  

  const highlightTermsInPdf = () => {
    const newHighlights: IHighlight[] = [];
    const newRects: BoundingRect[] = []; // Array to track bounding rectangles
  
    searchResults.forEach((searchResult) => {
      const { position, pageNumber, matchedText } = searchResult;
  
      const boundingRect: BoundingRect = {
        x1: position.x1,
        y1: position.y1,
        x2: position.x2,
        y2: position.y2,
        width: position.x2 - position.x1,
        height: position.y1 - position.y2,
      };
  
      newRects.push(boundingRect); // Add bounding rect to array
  
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
    updateKeywordRects(newRects); // Update state with new bounding rectangles
  };

  useEffect(() => {
    if (searchResults.length > 0) {
      highlightTermsInPdf();
    }
  }, [searchResults]);

  let resultText =
    searchResults.length === 1
      ? "Results found on 1 page"
      : `Results found on ${searchResults.length} pages`;

  if (searchResults.length === 0) {
    resultText = "No results found";
  }


  console.log(searchResults)
  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
        }}
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
                const isTextHighlight = !highlight.content?.image;

                const keywordHighlightComponents = keywordRects.map((rect, index) => {
                  const lthwpRect = convertBoundingRectToLTWHP(rect);
                
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
                

                const component = isTextHighlight ? (
                  <>
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                    {keywordHighlightComponents}
                  </>
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
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
