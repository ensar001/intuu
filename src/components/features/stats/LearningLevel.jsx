import { useRef, useEffect } from 'react';
import Card from '../../ui/Card';
import StatsNav from '../../layout/StatsNav';
import { Brain, CheckCircle, Award } from 'lucide-react';

const LearningLevel = () => {
  const learningLevelRef = useRef(null);
  const wordsMasteredRef = useRef(null);
  const weeklyGoalsRef = useRef(null);

  const scrollToSection = (sectionId) => {
    // Update URL hash
    window.history.replaceState(null, '', `#${sectionId}`);
    
    const refs = {
      'learning-level': learningLevelRef,
      'words-mastered': wordsMasteredRef,
      'weekly-goals': weeklyGoalsRef,
    };
    
    const container = document.querySelector('.overflow-auto');
    const targetRef = refs[sectionId]?.current;
    
    if (container && targetRef) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = targetRef.getBoundingClientRect().top;
      const offset = targetTop - containerTop - 20;
      
      container.scrollBy({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => scrollToSection(hash), 100);
    }
  }, []);

  return (
    <div className="space-y-8 pr-72">
      <StatsNav onNavigate={scrollToSection} />
        {/* Learning Level Section */}
        <div ref={learningLevelRef} className="scroll-mt-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Learning Level</h1>
            <p className="text-slate-500 mt-2">Track your language proficiency progress</p>
          </div>

          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Brain size={40} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">C1 Advanced</h3>
              <p className="text-slate-500">
                Detailed learning level tracking and progress analytics will be available here soon.
              </p>
            </div>
          </Card>
        </div>

        {/* Words Mastered Section */}
        <div ref={wordsMasteredRef} className="scroll-mt-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Words Mastered</h1>
            <p className="text-slate-500 mt-2">View your vocabulary achievements</p>
          </div>

          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">1,248 Words</h3>
              <p className="text-slate-500">
                Your vocabulary mastery statistics and word lists will be available here soon.
              </p>
            </div>
          </Card>
        </div>

        {/* Weekly Goals Section */}
        <div ref={weeklyGoalsRef} className="scroll-mt-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Weekly Goals</h1>
            <p className="text-slate-500 mt-2">Manage your learning targets</p>
          </div>

          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Award size={40} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">85% Complete</h3>
              <p className="text-slate-500">
                Set and track your weekly learning goals and progress here soon.
              </p>
            </div>
          </Card>
        </div>
    </div>
  );
};

export default LearningLevel;
