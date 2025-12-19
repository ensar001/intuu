import { useState } from 'react';
import { Zap, Sparkles, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { analyzeText as analyzeTextAPI } from '../../utils/geminiApi';
import { LANGUAGES } from '../../utils/constants';
import { useTranslation } from '../../utils/translations';
import { validateAnalysisText } from '../../utils/inputValidation';
import { useUserStats } from '../../hooks/useUserStats';

const TextAnalyzer = ({ currentLanguage = 'de', interfaceLanguage = 'en' }) => {
  const { recordActivity, updateWeeklyGoal } = useUserStats();
  const languageConfig = LANGUAGES.find(lang => lang.id === currentLanguage) || LANGUAGES[1];
  const languageName = languageConfig.name;
  const { t } = useTranslation(interfaceLanguage);
  
  // Get the interface language name for translation target
  const interfaceLanguageConfig = LANGUAGES.find(lang => lang.id === interfaceLanguage);
  const interfaceLanguageName = interfaceLanguageConfig ? interfaceLanguageConfig.name : 'English';
  
  // If learning language is same as interface language, don't translate
  const shouldTranslate = currentLanguage !== interfaceLanguage;
  
  const [text, setText] = useState(
    currentLanguage === 'de' 
      ? "Ich bin gestern ins Kino gegangen, weil ich den neuen Film sehen wollte. Das war eine gute Entscheidung."
      : "I went to the cinema yesterday because I wanted to see the new film. That was a good decision."
  );
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('b1');
  const [error, setError] = useState(null);

  const levels = [
    { id: 'a2', label: 'A2', color: 'bg-success-100 text-success-700 border-success-200' },
    { id: 'b1', label: 'B1', color: 'bg-primary-100 text-primary-700 border-primary-200' },
    { id: 'b2', label: 'B2', color: 'bg-primary-200 text-primary-800 border-primary-300' },
    { id: 'c1', label: 'C1', color: 'bg-accent-100 text-accent-700 border-accent-200' },
    { id: 'c2', label: 'C2', color: 'bg-secondary-100 text-secondary-700 border-secondary-200' }
  ];

  const handleAnalyze = async () => {
    // Validate input
    const validation = validateAnalysisText(text);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeTextAPI(
        validation.sanitized,
        selectedLevel,
        languageName,
        interfaceLanguageName,
        shouldTranslate
      );
      setAnalysis(result.sentences);
      
      // Track activity and update weekly goal
      await recordActivity('analyzer_uses', 1);
      await updateWeeklyGoal(1);
    } catch (error) {
      console.error('Text analysis error:', error);
      const errorMessage = error.message || "Failed to analyze text.";
      setError(errorMessage + " Make sure the backend server is running on port 3001.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{languageName} Text Analyzer</h2>
          <p className="text-slate-500">Paste your {languageName} text to analyze grammar, cases, and sentence structures.</p>
        </div>
        <div className={`${currentLanguage === 'de' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'} px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2`}>
          <span>{languageConfig.flag}</span>
          <span>{languageName}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-500 hover:text-red-700 text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Level Selection */}
      {/* Level Selection */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Target Level:</span>
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${
                selectedLevel === level.id
                  ? level.color + ' scale-105 shadow-md'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-4 flex flex-col h-[500px]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full p-4 resize-none outline-none text-lg text-slate-700 font-serif leading-relaxed"
            placeholder="Schreiben Sie hier Ihren deutschen Text..."
          />
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={handleAnalyze} icon={isAnalyzing ? Loader2 : Sparkles} variant="magic" disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Grammar ✨'}
            </Button>
          </div>
        </Card>

        {/* Output Section */}
        <Card className="p-0 h-[500px] overflow-y-auto bg-slate-50">
          {!analysis ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Zap size={48} className="mb-4 text-slate-300" />
              <p>Analysis results will appear here.</p>
              <p className="text-sm mt-2">We'll break down grammar structures, cases, and verb forms.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {analysis.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Satz {idx + 1}</h4>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.level}</span>
                  </div>
                  <p className="text-lg leading-relaxed mb-2">
                    {item.chunks && item.chunks.map((chunk, cIdx) => (
                      <span 
                        key={cIdx} 
                        className={
                          chunk.type === 'grammar' ? 'bg-blue-100 text-blue-900 px-1 rounded mx-1 border-b-2 border-blue-200' : 
                          chunk.type === 'verb' ? 'bg-emerald-50 text-emerald-800 px-1 rounded mx-1 font-medium' :
                          chunk.type === 'case' ? 'bg-purple-100 text-purple-900 px-1 rounded mx-1 border-b-2 border-purple-200' : ''
                        }
                        title={chunk.note || chunk.type}
                      >
                        {chunk.text}
                      </span>
                    ))}
                  </p>
                  
                  <p className="text-sm text-slate-500 italic mb-3 pl-2 border-l-2 border-slate-300">
                    {item.translation}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.grammar && item.grammar.map((gram, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 flex items-center gap-1">
                        <Zap size={10} /> {gram}
                      </span>
                    ))}
                    {item.verbs && item.verbs.map((verb, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                        v. {verb}
                      </span>
                    ))}
                    {item.cases && item.cases.map((cas, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">
                        {cas}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TextAnalyzer;
