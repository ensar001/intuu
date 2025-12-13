import { supabase } from './supabaseClient';

export const userStatsApi = {
  // Get user profile with stats
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Record daily activity
  recordActivity: async (userId, activityType, count = 1) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if activity exists for today
    const { data: existing } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single();

    if (existing) {
      // Update existing activity
      const updates = {};
      if (activityType === 'words_learned') updates.words_learned = (existing.words_learned || 0) + count;
      if (activityType === 'analyzer_uses') updates.analyzer_uses = (existing.analyzer_uses || 0) + count;
      if (activityType === 'tutor_interactions') updates.tutor_interactions = (existing.tutor_interactions || 0) + count;
      if (activityType === 'flashcard_reviews') updates.flashcard_reviews = (existing.flashcard_reviews || 0) + count;

      const { data, error } = await supabase
        .from('user_activities')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new activity
      const newActivity = {
        user_id: userId,
        activity_date: today,
        words_learned: activityType === 'words_learned' ? count : 0,
        analyzer_uses: activityType === 'analyzer_uses' ? count : 0,
        tutor_interactions: activityType === 'tutor_interactions' ? count : 0,
        flashcard_reviews: activityType === 'flashcard_reviews' ? count : 0
      };

      const { data, error } = await supabase
        .from('user_activities')
        .insert([newActivity])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Get activity history
  getActivityHistory: async (userId, days = 30) => {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
      .limit(days);
    
    if (error) throw error;
    return data;
  },

  // Mark word as learned
  learnWord: async (userId, word, language, cardId = null, masteryLevel = 1) => {
    const { data: existing } = await supabase
      .from('learned_words')
      .select('*')
      .eq('user_id', userId)
      .eq(cardId ? 'card_id' : 'word', cardId || word)
      .maybeSingle();

    if (existing) {
      // Update existing word - don't count as new learn
      const { data, error } = await supabase
        .from('learned_words')
        .update({
          mastery_level: Math.max(existing.mastery_level, masteryLevel),
          times_reviewed: (existing.times_reviewed || 0) + 1,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;

      // Only increment words_mastered if FIRST TIME reaching mastery level 3
      if (masteryLevel >= 3 && existing.mastery_level < 3) {
        await supabase.rpc('increment_words_mastered', { user_id: userId });
      }

      return { data, isNew: false };
    } else {
      // Insert new learned word
      const { data, error } = await supabase
        .from('learned_words')
        .insert([{
          user_id: userId,
          card_id: cardId,
          word,
          language,
          mastery_level: masteryLevel,
          times_reviewed: 1
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Only increment words_mastered if mastered on first try
      if (masteryLevel >= 3) {
        await supabase.rpc('increment_words_mastered', { user_id: userId });
      }

      return { data, isNew: true };
    }
  },

  // Get learned words
  getLearnedWords: async (userId, language = null, limit = 10) => {
    let query = supabase
      .from('learned_words')
      .select('*')
      .eq('user_id', userId)
      .order('learned_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update weekly goal progress
  updateWeeklyGoal: async (userId, increment = 1) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('weekly_goal_current, weekly_goal_target')
      .eq('id', userId)
      .single();

    if (profile) {
      const newCurrent = Math.min(
        (profile.weekly_goal_current || 0) + increment,
        profile.weekly_goal_target
      );

      const { data, error } = await supabase
        .from('profiles')
        .update({ weekly_goal_current: newCurrent })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Set weekly goal
  setWeeklyGoal: async (userId, type, target) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        weekly_goal_type: type,
        weekly_goal_target: target,
        weekly_goal_current: 0,
        weekly_goal_reset_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Calculate learning level based on words mastered
  calculateLearningLevel: (wordsMastered) => {
    if (wordsMastered >= 5000) return { level: 'C1', label: 'Advanced', progress: 100 };
    if (wordsMastered >= 4000) return { level: 'B2', label: 'Upper Intermediate', progress: (wordsMastered - 4000) / 10 };
    if (wordsMastered >= 3000) return { level: 'B1', label: 'Intermediate', progress: (wordsMastered - 3000) / 10 };
    if (wordsMastered >= 2000) return { level: 'A2', label: 'Elementary', progress: (wordsMastered - 2000) / 10 };
    if (wordsMastered >= 1000) return { level: 'A1', label: 'Beginner', progress: (wordsMastered - 1000) / 10 };
    return { level: 'A1', label: 'Beginner', progress: wordsMastered / 10 };
  }
};

// Create SQL function for incrementing words_mastered (run this in Supabase SQL editor)
/*
CREATE OR REPLACE FUNCTION increment_words_mastered(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET words_mastered = words_mastered + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
