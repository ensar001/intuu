import { useRef, useEffect, useState } from 'react';
import Card from '../../ui/Card';
import StatsNav from '../../layout/StatsNav';
import { Brain, CheckCircle, Award, TrendingUp, Target, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUserStats } from '../../../hooks/useUserStats';
import { userStatsApi } from '../../../utils/userStatsApi';

const LearningLevel = () => {
  const learningLevelRef = useRef(null);
  const wordsMasteredRef = useRef(null);
  const weeklyGoalsRef = useRef(null);
  
  const { stats, loading, learningLevel, weeklyGoalProgress } = useUserStats();
  const [activityHistory, setActivityHistory] = useState([]);
  const [wordsHistory, setWordsHistory] = useState([]);

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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await userStatsApi.getActivityHistory(stats?.id, 30);
        
        // Format activity history for chart
        const formattedActivity = history.map(day => ({
          date: new Date(day.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          words: day.words_learned || 0,
          analyses: day.analyzer_uses || 0,
          tutorSessions: day.tutor_interactions || 0,
          flashcards: day.flashcard_reviews || 0,
        })).reverse();
        
        setActivityHistory(formattedActivity);
        
        // Calculate cumulative words mastered over time
        let cumulative = 0;
        const wordsOverTime = formattedActivity.map(day => {
          cumulative += day.words;
          return {
            date: day.date,
            total: cumulative
          };
        });
        setWordsHistory(wordsOverTime);
      } catch (error) {
        console.error('Error loading activity history:', error);
      }
    };

    if (stats?.id) {
      loadHistory();
    }
  }, [stats]);

  // Learning level milestones data
  const levelMilestones = [
    { level: 'A1', words: 1000, color: '#94a3b8' },
    { level: 'A2', words: 2000, color: '#64748b' },
    { level: 'B1', words: 3000, color: '#475569' },
    { level: 'B2', words: 4000, color: '#334155' },
    { level: 'C1', words: 5000, color: '#1e293b' },
  ];

  const currentWords = stats?.words_mastered || 0;
  const currentLevelData = levelMilestones.map(milestone => ({
    level: milestone.level,
    current: Math.min(currentWords, milestone.words),
    remaining: Math.max(0, milestone.words - currentWords),
    color: milestone.color
  }));

  // Weekly goal breakdown
  const goalType = stats?.weekly_goal_type || 'words_learned';
  const goalTarget = stats?.weekly_goal_target || 0;
  const goalCurrent = stats?.weekly_goal_current || 0;
  const goalRemaining = Math.max(0, goalTarget - goalCurrent);

  const goalData = [
    { name: 'Completed', value: goalCurrent, color: '#6366f1' },
    { name: 'Remaining', value: goalRemaining, color: '#e2e8f0' }
  ];

  if (loading) {
    return (
      <div className="space-y-8 pr-72">
        <StatsNav onNavigate={scrollToSection} />
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pr-72">
      <StatsNav onNavigate={scrollToSection} />
      
        {/* Learning Level Section */}
        <div ref={learningLevelRef} className="scroll-mt-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Learning Level</h1>
            <p className="text-slate-500 mt-2">Track your language proficiency progress</p>
          </div>

          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Brain size={40} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-2">{learningLevel?.label || 'A1 Beginner'}</h3>
              <p className="text-slate-600 text-lg">{currentWords.toLocaleString()} words mastered</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Progress to next level</span>
                <span>{learningLevel?.progress || 0}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${learningLevel?.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Level Milestones Chart */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-600" />
                Level Milestones
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentLevelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="level" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="current" stackId="a" fill="#6366f1" name="Your Progress" />
                  <Bar dataKey="remaining" stackId="a" fill="#e2e8f0" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Words Mastered Section */}
        <div ref={wordsMasteredRef} className="scroll-mt-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Words Mastered</h1>
            <p className="text-slate-500 mt-2">View your vocabulary achievements</p>
          </div>

          <div className="grid gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Words</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{currentWords.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                  <CheckCircle size={32} />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              Vocabulary Growth Over Time
            </h4>
            {wordsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wordsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Total Words Mastered"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Start learning words to see your progress!</p>
              </div>
            )}
          </Card>

          <Card className="p-8 mt-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary-600" />
              Daily Learning Activity (Last 30 Days)
            </h4>
            {activityHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="words" fill="#10b981" name="Words Learned" />
                  <Bar dataKey="flashcards" fill="#6366f1" name="Flashcard Reviews" />
                  <Bar dataKey="analyses" fill="#f59e0b" name="Text Analyses" />
                  <Bar dataKey="tutorSessions" fill="#ec4899" name="Tutor Sessions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No activity data yet. Start practicing to see your stats!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Weekly Goals Section */}
        <div ref={weeklyGoalsRef} className="scroll-mt-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Weekly Goals</h1>
            <p className="text-slate-500 mt-2">Manage your learning targets</p>
          </div>

          <div className="grid gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">This Week's Goal</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {goalCurrent} / {goalTarget}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {goalType === 'words_learned' ? 'Words to learn' : 'Text analyses to complete'}
                  </p>
                </div>
                <div className="p-4 bg-primary-100 text-primary-600 rounded-full">
                  <Target size={32} />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <h4 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Award size={20} className="text-primary-600" />
              Goal Progress
            </h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={goalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {goalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-6">
              <p className="text-4xl font-bold text-primary-600">{weeklyGoalProgress}%</p>
              <p className="text-slate-600 mt-2">
                {goalRemaining > 0 
                  ? `${goalRemaining} more to reach your goal!` 
                  : 'Goal completed! 🎉'
                }
              </p>
            </div>
          </Card>
        </div>
    </div>
  );
};

export default LearningLevel;
