-- Function to add XP to user profile
-- This uses SECURITY DEFINER to bypass RLS and ensure XP updates always work
CREATE OR REPLACE FUNCTION public.add_user_xp(
  user_id UUID,
  xp_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
  result JSON;
BEGIN
  -- Get current XP and level
  SELECT COALESCE(xp_points, 0), COALESCE(level, 1)
  INTO current_xp, current_level
  FROM public.profiles
  WHERE id = user_id;

  -- If user doesn't exist, return error
  IF current_xp IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found',
      'newXP', 0,
      'newLevel', 1
    );
  END IF;

  -- Calculate new XP and level
  new_xp := current_xp + xp_amount;
  -- Level formula: floor(sqrt(xp / 100)) + 1
  new_level := floor(sqrt(new_xp::numeric / 100)) + 1;

  -- Update profile
  UPDATE public.profiles
  SET 
    xp_points = new_xp,
    level = new_level,
    updated_at = NOW()
  WHERE id = user_id;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'newXP', new_xp,
    'newLevel', new_level,
    'previousXP', current_xp,
    'previousLevel', current_level
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_user_xp(UUID, INTEGER) TO authenticated;

-- Function to check if lesson is already completed
CREATE OR REPLACE FUNCTION public.is_lesson_completed(
  user_id UUID,
  lesson_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_progress
    WHERE user_progress.user_id = is_lesson_completed.user_id
      AND user_progress.lesson_id = is_lesson_completed.lesson_id
      AND user_progress.completed = true
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_lesson_completed(UUID, UUID) TO authenticated;

