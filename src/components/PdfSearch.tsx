import React, { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';
import extractTextFromPdf from './TextExtractor';

const PdfSearch = ({ file }: { file: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfText, setPdfText] = useState('');

  useEffect(() => {
    const fetchText = async () => {
      const text = await extractTextFromPdf(file);
    //   setPdfText(text);
    };
    fetchText();
  }, [file]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div>
      <input type="text" value={searchTerm} onChange={handleSearch} placeholder="Search text..." />
      <div
        dangerouslySetInnerHTML={{ __html: highlightText(pdfText, searchTerm) }}
        style={{ whiteSpace: 'pre-wrap' }}
      />
      <PDFViewer url={file} />
    </div>
  );
};

export default PdfSearch;
