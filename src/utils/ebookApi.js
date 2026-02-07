import { supabase } from './supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import ePub from 'epubjs';

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
 * Parse PDF file (improved extraction with better text flow)
 */
export const parsePdfFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        let isFirstHeading = true;

        // Extract text preserving the source order
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false
          });

          // Group items by Y position with tolerance to detect lines
          const lines = [];

          textContent.items.forEach((item) => {
            const y = item.transform[5];
            const height = item.height || Math.abs(item.transform[3]) || 0;
            const tolerance = height ? height * 0.6 : 2;

            let line = lines.find(entry => Math.abs(entry.y - y) <= tolerance);
            if (!line) {
              line = { y, items: [] };
              lines.push(line);
            }

            line.items.push({
              text: item.str,
              x: item.transform[4],
              width: item.width || 0,
              height,
              fontSize: height
            });

            line.y = (line.y * (line.items.length - 1) + y) / line.items.length;
          });

          // Sort lines by Y position (top to bottom)
          lines.sort((a, b) => b.y - a.y);

          const viewport = page.getViewport({ scale: 1 });
          const columnSplitX = viewport.width * 0.55;

          const buildTextFromLines = (lineSet) => {
            let text = '';
            let lastY = null;
            let lastIndent = null;

            lineSet.forEach((line) => {
              const lineItems = line.items.sort((a, b) => a.x - b.x);
              const avgFontSize = lineItems.reduce((sum, item) => sum + (item.fontSize || 0), 0) / lineItems.length || 12;
              const lineIndent = lineItems[0]?.x ?? 0;

              // Check if this is a heading (larger font or first line of book)
              const isHeading = isFirstHeading && pageNum === 1 && text.length === 0;

              // Build line text with gap-based spacing
              let lineText = '';
              lineItems.forEach((item, idx) => {
                lineText += item.text;

                const next = lineItems[idx + 1];
                if (next) {
                  const gap = next.x - (item.x + (item.width || 0));
                  if (gap > avgFontSize * 0.2) {
                    lineText += ' ';
                  }
                }
              });

              lineText = lineText.trim();

              if (lineText.length > 0) {
                const yGap = lastY !== null ? Math.abs(lastY - line.y) : 0;
                const indentGap = lastIndent !== null ? Math.abs(lineIndent - lastIndent) : 0;
                const newParagraph = lastY !== null && (yGap > avgFontSize * 1.6 || indentGap > avgFontSize * 1.5);

                if (newParagraph) {
                  text += '\n\n';
                } else if (text.length > 0) {
                  if (text.endsWith('-')) {
                    text = text.slice(0, -1);
                  } else if (!text.endsWith('\n')) {
                    text += ' ';
                  }
                }

                if (isHeading) {
                  text += '### ' + lineText;
                  isFirstHeading = false;
                } else {
                  text += lineText;
                }

                lastY = line.y;
                lastIndent = lineIndent;
              }
            });

            return text;
          };

          const lineIndents = lines.map(line => line.items.sort((a, b) => a.x - b.x)[0]?.x ?? 0);
          const leftColumn = [];
          const rightColumn = [];

          lineIndents.forEach((indent, index) => {
            if (indent > columnSplitX) {
              rightColumn.push(lines[index]);
            } else {
              leftColumn.push(lines[index]);
            }
          });

          const leftRatio = leftColumn.length / Math.max(lines.length, 1);
          const rightRatio = rightColumn.length / Math.max(lines.length, 1);
          const hasTwoColumns = leftRatio > 0.2 && rightRatio > 0.2;

          let pageText = '';
          if (hasTwoColumns) {
            const leftText = buildTextFromLines(leftColumn);
            const rightText = buildTextFromLines(rightColumn);
            pageText = leftText ? `${leftText}\n\n${rightText}` : rightText;
          } else {
            pageText = buildTextFromLines(lines);
          }

          // Clean and normalize page text
          pageText = pageText
            .replace(/[ \t]{2,}/g, ' ')           // Normalize spaces
            .replace(/\n{3,}/g, '\n\n')           // Limit blank lines
            .replace(/([a-zä-ü])- ([a-zä-ü])/gi, '$1$2')  // Fix hyphenation
            .trim();

          fullText += pageText;

          // Add page separator
          if (pageNum < pdf.numPages) {
            fullText += '\n\n---\n\n';
          }
        }

        // Final cleanup
        fullText = fullText
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]+/g, ' ')
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
 * Parse EPUB file (proper extraction using epubjs)
 */
export const parseEpubFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    
    // Wait for book to be ready
    await book.ready;
    
    // Get metadata
    const metadata = await book.loaded.metadata;
    const spine = await book.loaded.spine;
    
    let fullText = '';
    let chapterCount = 0;
    
    // Extract text from each spine item (chapter/section)
    for (let item of spine.items) {
      try {
        const doc = await book.load(item.href);
        
        // Extract text content from the document
        let chapterText = '';
        
        if (doc.body) {
          // Get all text nodes, preserving structure
          const extractText = (element) => {
            let text = '';
            
            for (let node of element.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                const content = node.textContent.trim();
                if (content) {
                  text += content + ' ';
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName?.toLowerCase();
                
                // Handle headings
                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                  text += '\n\n### ' + node.textContent.trim() + '\n\n';
                }
                // Handle paragraphs and divs
                else if (['p', 'div'].includes(tagName)) {
                  const content = extractText(node).trim();
                  if (content) {
                    text += content + '\n\n';
                  }
                }
                // Handle line breaks
                else if (tagName === 'br') {
                  text += '\n';
                }
                // Handle lists
                else if (tagName === 'li') {
                  text += '• ' + extractText(node).trim() + '\n';
                }
                // Recursively process other elements
                else {
                  text += extractText(node);
                }
              }
            }
            
            return text;
          };
          
          chapterText = extractText(doc.body);
        } else {
          // Fallback to textContent
          chapterText = doc.textContent || '';
        }
        
        chapterText = chapterText
          .replace(/\n{3,}/g, '\n\n')      // Limit blank lines
          .replace(/[ \t]{2,}/g, ' ')      // Normalize spaces
          .trim();
        
        if (chapterText.length > 0) {
          if (chapterCount > 0) {
            fullText += '\n\n---\n\n'; // Chapter separator
          }
          fullText += chapterText;
          chapterCount++;
        }
      } catch (chapterError) {
        console.warn(`Failed to parse EPUB chapter ${item.href}:`, chapterError);
        // Continue with next chapter
      }
    }
    
    // Clean up the full text
    fullText = fullText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    if (!fullText || fullText.length < 50) {
      throw new Error('Could not extract text from EPUB. The file might be corrupted or image-based.');
    }
    
    return {
      content: fullText,
      title: metadata.title || file.name.replace('.epub', ''),
      author: metadata.creator || 'Unknown',
    };
  } catch (error) {
    console.error('EPUB parsing error:', error);
    throw new Error('Failed to parse EPUB: ' + error.message);
  }
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

    // Calculate pages based on words (350 words per page)
    const wordsPerPage = 350;
    const totalPages = Math.ceil(parsedData.content.split(/\s+/).length / wordsPerPage);

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
 * Translate text using DeepL API
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
