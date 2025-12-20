import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userStatsApi } from '../utils/userStatsApi';

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await userStatsApi.getUserProfile(user.id);
      setStats(profile);
      setError(null);
    } catch (err) {
      console.error('Failed to load user stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const recordActivity = async (activityType, count = 1) => {
    if (!user) return;
    
    try {
      await userStatsApi.recordActivity(user.id, activityType, count);
      await loadStats(); // Reload to get updated streak
    } catch (err) {
      console.error('Failed to record activity:', err);
    }
  };

  const learnWord = async (word, language, masteryLevel = 1) => {
    if (!user) return;
    
    try {
      await userStatsApi.learnWord(user.id, word, language, masteryLevel);
      await recordActivity('words_learned');
      await loadStats(); // Reload to get updated words_mastered
    } catch (err) {
      console.error('Failed to mark word as learned:', err);
    }
  };

  const updateWeeklyGoal = async (increment = 1) => {
    if (!user) return;
    
    try {
      const updated = await userStatsApi.updateWeeklyGoal(user.id, increment);
      setStats(updated);
    } catch (err) {
      console.error('Failed to update weekly goal:', err);
    }
  };

  const setWeeklyGoal = async (type, target) => {
    if (!user) return;
    
    try {
      const updated = await userStatsApi.setWeeklyGoal(user.id, type, target);
      setStats(updated);
    } catch (err) {
      console.error('Failed to set weekly goal:', err);
    }
  };

  const learningLevel = stats 
    ? userStatsApi.calculateLearningLevel(stats.words_mastered || 0)
    : null;

  const weeklyGoalProgress = stats && stats.weekly_goal_target > 0
    ? Math.round((stats.weekly_goal_current / stats.weekly_goal_target) * 100)
    : 0;

  return {
    stats,
    loading,
    error,
    learningLevel,
    weeklyGoalProgress,
    recordActivity,
    learnWord,
    updateWeeklyGoal,
    setWeeklyGoal,
    refreshStats: loadStats
  };
};
