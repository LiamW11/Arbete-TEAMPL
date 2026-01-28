#!/usr/bin/env python3
"""
PDF Text Extractor
Extracts text from PDF files using pypdf and sanitizes special characters
"""
import sys
import re
from pypdf import PdfReader

def sanitize_text(text):
    """
    Remove problematic special characters while keeping letters, numbers, and common punctuation.
    
    Keeps:
    - Letters (including Swedish å, ä, ö)
    - Numbers (0-9)
    - Common punctuation: . , ; : ! ? - _ ' "
    - Whitespace (spaces, tabs, newlines)
    - Parentheses: ( ) [ ] { }
    - Slashes: / \
    - Common symbols: @ % & + = * # $
    
    Removes:
    - Emojis
    - Arrows (→, ←, ↑, ↓, etc.)
    - Special Unicode symbols
    - Pipes and other rare characters
    """
    if not text:
        return ""
    
    # Define allowed characters using regex
    # \w includes letters, numbers, and underscore (including Swedish characters with proper locale)
    # We also explicitly add common punctuation and symbols
    allowed_pattern = r'[^\w\s.,;:!?\-_\'\"()\[\]{}/\\@%&+=*#$]'
    
    # Replace disallowed characters with space
    sanitized = re.sub(allowed_pattern, ' ', text, flags=re.UNICODE)
    
    # Collapse multiple spaces into one
    sanitized = re.sub(r' +', ' ', sanitized)
    
    # Collapse multiple newlines (keep max 2 for paragraph breaks)
    sanitized = re.sub(r'\n\n+', '\n\n', sanitized)
    
    # Remove spaces at start/end of lines
    lines = [line.strip() for line in sanitized.split('\n')]
    sanitized = '\n'.join(lines)
    
    return sanitized.strip()

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
        # Use errors='replace' to avoid encoding issues in error messages
        print(f"Error extracting text: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_pdf_text.py <pdf_file>", file=sys.stderr)
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    text = extract_text_from_pdf(pdf_file)
    
    if text:
        # Sanitize the text to remove problematic characters
        sanitized_text = sanitize_text(text)
        
        # Print with safe encoding handling
        # Using errors='replace' will replace unencodable characters with '?'
        # Using errors='ignore' would skip them entirely
        try:
            print(sanitized_text)
        except UnicodeEncodeError:
            # Fallback: encode to utf-8 and decode with error handling
            safe_text = sanitized_text.encode('utf-8', errors='ignore').decode('utf-8')
            print(safe_text)
    else:
        sys.exit(1)