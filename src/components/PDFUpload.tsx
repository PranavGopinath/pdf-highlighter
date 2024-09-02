import React, { useState, useRef } from 'react'
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Upload, File, X } from 'lucide-react'

interface PDFUploadButtonProps {
  setFile: (file: File | null) => void
}

export default function PDFUploadButton({ setFile }: PDFUploadButtonProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setFile(file)
    } else {
      alert('Please select a valid PDF file.')
      setSelectedFile(null)
      setFile(null)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-start space-y-2">
      <Input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        aria-label="Upload PDF file"
      />
      <Button onClick={handleUploadClick} variant="outline" className="w-full">
        <Upload className="mr-2 h-4 w-4" />
        Upload PDF
      </Button>
      {selectedFile && (
        <div className="flex items-center justify-between w-full p-2 bg-secondary text-secondary-foreground rounded-md">
          <div className="flex items-center">
            <File className="mr-2 h-4 w-4" />
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            aria-label="Remove selected file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
