-- Migration: Security hardening for functions and views
-- Date: 2026-02-07
-- Description: Fix role-mutable search_path and ensure security-invoker view

-- Ensure functions use a fixed search_path
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

ALTER FUNCTION public.increment_words_mastered(uuid)
  SET search_path = public;

ALTER FUNCTION public.update_user_streak_and_goals()
  SET search_path = public;

ALTER FUNCTION public.cleanup_old_audio_cache()
  SET search_path = public;

-- Ensure view runs with invoker privileges
ALTER VIEW public.user_word_stats
  SET (security_invoker = true);
