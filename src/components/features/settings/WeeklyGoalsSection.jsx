import { useState, useEffect } from 'react';
import { Target, BookOpen, Brain } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

export default function WeeklyGoalsSection({ stats, setWeeklyGoal, onMessage, loading, setLoading }) {
  const [goalType, setGoalType] = useState('words');
  const [goalTarget, setGoalTarget] = useState(50);

  useEffect(() => {
    if (stats) {
      setGoalType(stats.weekly_goal_type || 'words');
      setGoalTarget(stats.weekly_goal_target || 50);
    }
  }, [stats]);

  const handleSaveGoal = async () => {
    setLoading(true);
    try {
      await setWeeklyGoal(goalType, goalTarget);
      onMessage({ type: 'success', text: 'Weekly goal updated successfully!' });
    } catch (error) {
      onMessage({ type: 'error', text: 'Failed to update weekly goal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Weekly Goals
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              What would you like to track?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGoalType('words')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  goalType === 'words'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className={`w-6 h-6 ${goalType === 'words' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`font-semibold ${goalType === 'words' ? 'text-indigo-900' : 'text-slate-700'}`}>
                      Words Learned
                    </p>
                    <p className="text-sm text-slate-500">Track vocabulary mastery</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGoalType('analyzer_uses')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  goalType === 'analyzer_uses'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Brain className={`w-6 h-6 ${goalType === 'analyzer_uses' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`font-semibold ${goalType === 'analyzer_uses' ? 'text-indigo-900' : 'text-slate-700'}`}>
                      Text Analyses
                    </p>
                    <p className="text-sm text-slate-500">Track grammar practice</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weekly Target: <span className="text-indigo-600 font-bold">{goalTarget}</span> {goalType === 'words' ? 'words' : 'analyses'}
            </label>
            <input
              type="range"
              min={goalType === 'words' ? "10" : "5"}
              max={goalType === 'words' ? "500" : "50"}
              step={goalType === 'words' ? "10" : "5"}
              value={goalTarget}
              onChange={(e) => setGoalTarget(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{goalType === 'words' ? '10' : '5'}</span>
              <span>{goalType === 'words' ? '500' : '50'}</span>
            </div>
          </div>

          <Button
            onClick={handleSaveGoal}
            variant="primary"
            disabled={loading}
          >
            Save Goal Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}
