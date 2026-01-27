#!/usr/bin/env python3
"""
PDF Text Extractor
Extracts text from PDF files using pypdf
"""
import sys
from pypdf import PdfReader

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF file"""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n\n"
        
        return text.strip()
    except Exception as e:
        print(f"Error extracting text: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_pdf_text.py <pdf_file>", file=sys.stderr)
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    text = extract_text_from_pdf(pdf_file)
    
    if text:
        print(text)
    else:
        sys.exit(1)
