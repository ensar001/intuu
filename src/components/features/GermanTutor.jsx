import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { tutorChat } from '../../utils/geminiApi';
import { LANGUAGES } from '../../utils/constants';
import { validateAnalysisText } from '../../utils/inputValidation';
import { useUserStats } from '../../hooks/useUserStats';

const GermanTutor = ({ currentLanguage = 'de', interfaceLanguage = 'en' }) => {
  const { recordActivity } = useUserStats();
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
    // Validate input
    const validation = validateAnalysisText(input);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    const userMsg = { id: Date.now(), role: 'user', text: validation.sanitized };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await tutorChat(validation.sanitized, messages, languageName);

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: response.reply,
        correction: response.corrected !== validation.sanitized,
        corrected: response.corrected,
        explanation: response.explanation,
        improved: response.improved
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Track tutor interaction
      await recordActivity('tutor_interactions', 1);
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
        <div className={`${currentLanguage === 'de' ? 'bg-secondary-100 text-secondary-800' : 'bg-primary-100 text-primary-800'} px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2`}>
          <span>{languageConfig.flag}</span>
          <span>{languageName}</span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary-500 text-white rounded-br-none shadow-warm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-educational'}`}>
                {msg.text}
                {msg.correction && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Corrected:</div>
                      <div className="font-medium text-success-700 bg-success-50 p-2 rounded">
                        {msg.corrected}
                      </div>
                    </div>
                    {msg.improved && (
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Improved:</div>
                        <div className="font-medium text-accent-600 bg-accent-50 p-2 rounded">
                          {msg.improved}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {msg.explanation && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-sm text-slate-700">
                      {msg.explanation}
                    </div>
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
              placeholder={currentLanguage === 'en' ? "Write something here..." : "Schreibe etwas hier..."}
              disabled={isTyping}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <Button onClick={handleSend} variant="primary" icon={Send} disabled={isTyping} className="px-6">Send</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GermanTutor;
