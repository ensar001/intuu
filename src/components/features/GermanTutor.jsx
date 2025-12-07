import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { callGemini } from '../../utils/geminiApi';
import { LANGUAGES } from '../../utils/constants';

const GermanTutor = ({ currentLanguage = 'de' }) => {
  const languageConfig = LANGUAGES.find(lang => lang.id === currentLanguage) || LANGUAGES[1];
  const languageName = languageConfig.name;
  
  const getInitialMessage = () => {
    if (currentLanguage === 'de') {
      return 'Hallo! I am your German tutor. Write a sentence, and I will correct your grammar and suggest better phrasing.';
    } else {
      return 'Hello! I am your English tutor. Write a sentence, and I will correct your grammar and suggest better phrasing.';
    }
  };
  
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: getInitialMessage() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const systemPrompt = `
      You are a helpful and encouraging ${languageName} language tutor.
      The user is a learner, and you have access to the full conversation history.
      Read the conversation context carefully and respond accordingly.
      
      Return your result STRICTLY as JSON matching the provided schema. Do not include markdown.
      Tasks:
      1) Analyze the user's latest input for grammar and vocabulary errors.
      2) If there is an error, set 'hasError': true, add 'corrected' (the corrected ${languageName} sentence) and a short 'explanation' of the rule.
      3) If there is NO error, set 'hasError': false but still include a brief 'explanation' with a helpful tip or continuation of the conversation.
      4) Always provide a friendly ${languageName} 'text' to keep the chat going and respond to what the user is asking or saying based on the conversation history.
      5) ALWAYS include 2–3 concise 'examples' in ${languageName} that illustrate the explanation, and aligned 'translations' in English (same length as examples, same order).
      6) Keep explanations ≤ 60 words and each example ≤ 12 words.
      7) Be contextually aware - if the user asks a follow-up question or confirms something, respond appropriately based on the conversation flow.
    `;

    try {
      const response = await callGemini(input, systemPrompt, {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          hasError: { type: "BOOLEAN" },
          corrected: { type: "STRING" },
          explanation: { type: "STRING" },
          examples: { type: "ARRAY", items: { type: "STRING" } },
          translations: { type: "ARRAY", items: { type: "STRING" } }
        }
      }, messages); // Pass conversation history

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: response.text,
        correction: response.hasError,
        corrected: response.corrected,
        explanation: response.explanation,
        examples: Array.isArray(response.examples) ? response.examples : [],
        translations: Array.isArray(response.translations) ? response.translations : []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
       <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{languageName} Correction Lab</h2>
          <p className="text-slate-500">Get instant feedback on your writing.</p>
        </div>
        <div className={`${currentLanguage === 'de' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'} px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2`}>
          <span>{languageConfig.flag}</span>
          <span>{languageName}</span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                {msg.text}
                {msg.correction && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">Correction:</div>
                    <div className="font-medium text-emerald-600 bg-emerald-50 p-2 rounded">
                      {msg.corrected}
                    </div>
                  </div>
                )}

                {(msg.explanation || (msg.examples && msg.examples.length) || (msg.translations && msg.translations.length)) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {msg.explanation && (
                      <div className="text-sm text-slate-700">
                        {msg.explanation}
                      </div>
                    )}
                    {msg.examples && msg.examples.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                        {msg.examples.map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    )}
                    {msg.translations && msg.translations.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Translations into English</div>
                        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                          {msg.translations.map((tr, i) => (
                            <li key={i}>{tr}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center gap-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Schreibe etwas hier..."
              disabled={isTyping}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Button onClick={handleSend} variant="primary" icon={Send} disabled={isTyping} className="px-6">Send</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GermanTutor;
