import { supabase } from './supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Parse text file content
 */
export const parseTxtFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      resolve({
        content: content,
        title: file.name.replace('.txt', ''),
        author: 'Unknown',
      });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Parse PDF file (basic extraction - requires pdf.js library)
 */
export const parsePdfFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        // Extract text from each page with better formatting
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Group text items by their Y position to detect lines
          const lines = {};
          textContent.items.forEach(item => {
            const y = Math.round(item.transform[5]); // Y position
            if (!lines[y]) {
              lines[y] = [];
            }
            lines[y].push(item);
          });
          
          // Sort lines by Y position (top to bottom)
          const sortedYPositions = Object.keys(lines).sort((a, b) => b - a);
          
          let previousY = null;
          let previousFontSize = null;
          let isFirstLine = true;
          
          sortedYPositions.forEach(y => {
            const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]); // Sort by X position
            const lineText = lineItems.map(item => item.str).join(' ').trim();
            
            if (lineText) {
              const fontSize = lineItems[0].height || 12;
              const yGap = previousY ? previousY - y : 0;
              
              // Only mark the first line on page 1 as title if it's substantial text
              if (isFirstLine && pageNum === 1 && lineText.length > 5 && lineText.length < 100) {
                fullText += '### ';
                isFirstLine = false;
              }
              // Detect paragraph breaks (larger vertical gap)
              else if (yGap > fontSize * 1.5) {
                fullText += '\n\n';
              }
              // Very conservative heading detection: only if significantly larger (40%+) and short
              else if (previousFontSize && fontSize > previousFontSize * 1.4 && lineText.length < 80) {
                fullText += '\n\n### ';
              }
              
              fullText += lineText + '\n';
              previousY = y;
              previousFontSize = fontSize;
            }
          });
          
          // Add page break
          if (pageNum < pdf.numPages) {
            fullText += '\n\n---\n\n';
          }
        }
        
        // Clean up excessive whitespace but preserve paragraph structure
        fullText = fullText
          .replace(/\n{4,}/g, '\n\n\n')  // Max 3 newlines
          .replace(/[ \t]+/g, ' ')        // Single spaces
          .trim();
        
        if (!fullText || fullText.length < 10) {
          throw new Error('Could not extract text from PDF. The file might be image-based or corrupted.');
        }
        
        resolve({
          content: fullText,
          title: file.name.replace('.pdf', ''),
          author: 'Unknown',
        });
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(new Error('Failed to parse PDF: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse EPUB file (basic extraction)
 */
export const parseEpubFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Basic EPUB parsing - in production use epubjs library
        const text = e.target.result;
        resolve({
          content: text,
          title: file.name.replace('.epub', ''),
          author: 'Unknown',
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Validate file type and size
 */
export const validateEbookFile = (file) => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.epub'];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }

  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return { 
      valid: false, 
      error: 'Only TXT, PDF, and EPUB files are supported.' 
    };
  }

  return { valid: true };
};

/**
 * Upload and save e-book to database
 */
export const uploadEbook = async (file, userId, language = 'de') => {
  try {
    const validation = validateEbookFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let parsedData;
    const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' :
                     file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'txt';

    // Parse file based on type
    if (fileType === 'txt') {
      parsedData = await parseTxtFile(file);
    } else if (fileType === 'pdf') {
      parsedData = await parsePdfFile(file);
    } else if (fileType === 'epub') {
      parsedData = await parseEpubFile(file);
    }

    // Calculate approximate pages (assuming 2000 chars per page)
    const totalPages = Math.ceil(parsedData.content.length / 2000);

    // Save to database
    const { data, error } = await supabase
      .from('user_books')
      .insert({
        user_id: userId,
        title: parsedData.title,
        author: parsedData.author,
        language: language,
        file_type: fileType,
        content: parsedData.content,
        total_pages: totalPages,
        current_page: 1,
        reading_progress: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading e-book:', error);
    throw error;
  }
};

/**
 * Get all user's e-books
 */
export const getUserBooks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

/**
 * Get single book by ID
 */
export const getBookById = async (bookId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching book:', error);
    throw error;
  }
};

/**
 * Update reading progress
 */
export const updateReadingProgress = async (bookId, currentPage, progress) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .update({
        current_page: currentPage,
        reading_progress: progress,
      })
      .eq('id', bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

/**
 * Add bookmark
 */
export const addBookmark = async (bookId, position) => {
  try {
    const book = await getBookById(bookId);
    const bookmarks = book.bookmarks || [];
    
    if (!bookmarks.includes(position)) {
      bookmarks.push(position);
      
      const { data, error } = await supabase
        .from('user_books')
        .update({ bookmarks })
        .eq('id', bookId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    return book;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

/**
 * Mark book as completed
 */
export const markBookComplete = async (bookId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        reading_progress: 100,
      })
      .eq('id', bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking book as complete:', error);
    throw error;
  }
};

/**
 * Delete book
 */
export const deleteBook = async (bookId) => {
  try {
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('id', bookId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

/**
 * Translate text using Gemini API
 */
export const translateText = async (text, targetLanguage = 'en', sourceLanguage = 'de') => {
  try {
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Translation API error:', response.status, errorData);
      throw new Error(errorData.details || errorData.error || 'Translation failed. Please try again.');
    }

    const data = await response.json();
    return data.translation;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
};
