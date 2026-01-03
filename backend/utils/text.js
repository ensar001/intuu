export const splitIntoSentences = (text = '') => {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n');

  const matches = normalized.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  if (!matches) return normalized.trim() ? [normalized.trim()] : [];
  return matches.map(s => s.trim()).filter(Boolean);
};
