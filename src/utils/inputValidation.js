/**
 * Input validation utility for user-submitted text
 * Prevents excessively long inputs and spam patterns
 */

const MAX_INPUT_LENGTH = 5000;
const MAX_REPETITION_PATTERN = 50; // Max consecutive repeated characters

/**
 * Validates and sanitizes user input text
 * @param {string} input - The user input to validate
 * @param {object} options - Optional configuration
 * @param {number} options.maxLength - Maximum allowed length (default: 5000)
 * @param {boolean} options.allowEmpty - Whether empty input is valid (default: false)
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
export function validateUserInput(input, options = {}) {
  const {
    maxLength = MAX_INPUT_LENGTH,
    allowEmpty = false
  } = options;

  // Check if input exists
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: 'Input is required'
    };
  }

  // Trim whitespace
  const trimmed = input.trim();

  // Check empty after trimming
  if (!allowEmpty && trimmed.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'Input cannot be empty'
    };
  }

  // Check length
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      sanitized: trimmed.substring(0, maxLength),
      error: `Input exceeds maximum length of ${maxLength} characters`
    };
  }

  // Check for excessive character repetition (spam protection)
  const repetitionMatch = trimmed.match(/(.)\1+/g);
  if (repetitionMatch) {
    const maxRepetition = Math.max(...repetitionMatch.map(m => m.length));
    if (maxRepetition > MAX_REPETITION_PATTERN) {
      return {
        valid: false,
        sanitized: trimmed,
        error: 'Input contains excessive character repetition'
      };
    }
  }

  // Check for potential XSS patterns (basic check)
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        sanitized: trimmed,
        error: 'Input contains potentially unsafe content'
      };
    }
  }

  return {
    valid: true,
    sanitized: trimmed,
    error: null
  };
}

/**
 * Validates topic input for flashcard generation
 * @param {string} topic - Topic string to validate
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
export function validateTopic(topic) {
  return validateUserInput(topic, {
    maxLength: 200,
    allowEmpty: false
  });
}

/**
 * Validates text for analysis (German tutor, text analyzer)
 * @param {string} text - Text to validate
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
export function validateAnalysisText(text) {
  return validateUserInput(text, {
    maxLength: 5000,
    allowEmpty: false
  });
}

/**
 * Validates flashcard content (question/answer)
 * @param {string} content - Flashcard content to validate
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
export function validateFlashcardContent(content) {
  return validateUserInput(content, {
    maxLength: 1000,
    allowEmpty: false
  });
}
