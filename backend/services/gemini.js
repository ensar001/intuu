/**
 * Gemini API helper function
 * Makes authenticated calls to Google's Gemini AI API
 */
export async function callGemini(prompt, systemInstruction, responseSchema = null, conversationHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env');
  }
  
  console.log('Calling Gemini API...');
  
  // Use Gemini Flash 2.5
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const contents = conversationHistory.length > 0
    ? conversationHistory.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }))
    : [{ parts: [{ text: prompt }] }];

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

  console.log('Sending request to Gemini...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Gemini response status:', response.status);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Gemini API Error Response:', errorBody);
    throw new Error(`Gemini API Error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  console.log('✅ Gemini response received successfully');
  const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (responseSchema) {
    return JSON.parse(textResult);
  }
  return textResult;
}
