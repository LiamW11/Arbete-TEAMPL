/**
 * PDF Processor
 * Extracts text from PDF files using Python script
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execFileAsync = promisify(execFile);

/**
 * Extract text from PDF file
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(pdfPath) {
  const scriptPath = path.join(__dirname, 'extract_pdf_text.py');
  
  try {
    const { stdout, stderr } = await execFileAsync('python', [scriptPath, pdfPath], {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large PDFs
    });

    if (stderr) {
      console.warn('PDF extraction warning:', stderr);
    }

    if (!stdout || stdout.trim().length === 0) {
      throw new Error('No text extracted from PDF');
    }

    return stdout.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

/**
 * Validate PDF file
 * @param {string} filename - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {boolean} True if valid PDF
 */
function isValidPDF(filename, mimetype) {
  const validExtensions = ['.pdf'];
  const validMimeTypes = ['application/pdf'];
  
  const ext = path.extname(filename).toLowerCase();
  
  return validExtensions.includes(ext) && validMimeTypes.includes(mimetype);
}

module.exports = {
  extractTextFromPDF,
  isValidPDF
};
