-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Function to automatically set first user as admin if no admin exists
CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
  first_user_id UUID;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';
  
  -- If no admin exists, set the first user as admin
  IF admin_count = 0 THEN
    SELECT id INTO first_user_id
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET role = 'admin'
      WHERE id = first_user_id;
      
      RAISE NOTICE 'First user (ID: %) has been set as admin', first_user_id;
    END IF;
  END IF;
END;
$$;

-- Run the function to ensure admin exists
SELECT public.ensure_admin_exists();

-- Update RLS policies for admin access to courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Update RLS policies for admin access to lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Update RLS policies for admin access to quizzes
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Update handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
  user_role TEXT := 'user';
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';
  
  -- If no admin exists, make this user an admin
  IF admin_count = 0 THEN
    user_role := 'admin';
  END IF;
  
  INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    user_role
  );
  RETURN NEW;
END;
$$;

