import { pdfjs } from 'react-pdf';

const extractTextFromPdf = async (file: string) => {
  const loadingTask = pdfjs.getDocument(file);
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let textContent = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    textContent += content.items.map((item: any) => item.str).join(' ');
  }

  return textContent;
};

export default extractTextFromPdf;