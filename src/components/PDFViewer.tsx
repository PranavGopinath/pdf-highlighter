'use client'

import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => Math.min(Math.max(prevPageNumber + offset, 1), numPages || 1))
  }

  function changeScale(delta: number) {
    setScale(prevScale => Math.min(Math.max(prevScale + delta, 0.5), 2))
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center space-x-2">
        <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(Math.min(Math.max(parseInt(e.target.value) || 1, 1), numPages || 1))}
          className="w-16 text-center"
          aria-label="Current page"
        />
        <span className="text-sm text-gray-500">
          of {numPages}
        </span>
        <Button onClick={() => changePage(1)} disabled={numPages === null || pageNumber >= numPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button onClick={() => changeScale(-0.1)} aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button onClick={() => changeScale(0.1)} aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      <div className="border border-gray-300 shadow-lg">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex items-center justify-center h-96 w-full">Loading PDF...</div>}
          error={<div className="flex items-center justify-center h-96 w-full text-red-500">Failed to load PDF</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  )
}