export const callGemini = async (prompt, systemInstruction, responseSchema = null, conversationHistory = []) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  // Build contents array from conversation history
  const contents = conversationHistory.length > 0 
    ? conversationHistory.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }))
    : [{ parts: [{ text: prompt }] }];

  // Add the current prompt if we have history
  if (conversationHistory.length > 0) {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  const payload = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: responseSchema ? "application/json" : "text/plain",
      responseSchema: responseSchema
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (responseSchema) {
      return JSON.parse(textResult);
    }
    return textResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
