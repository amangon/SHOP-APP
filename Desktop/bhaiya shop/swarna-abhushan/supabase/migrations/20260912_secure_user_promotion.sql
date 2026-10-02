-- ============================================================
-- SECURE USER PROMOTION/DEMOTION RPCs
-- ============================================================

-- Promote a user to admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(
  target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = caller_id
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only existing admins can promote users';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required';
  END IF;

  IF target_user_id = caller_id THEN
    RAISE EXCEPTION 'Self-promotion is not allowed';
  END IF;

  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', 'admin'
  );
END;
$$;

-- Demote a user from admin
CREATE OR REPLACE FUNCTION public.demote_user_from_admin(
  target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  admin_count integer;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = caller_id
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only existing admins can demote users';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required';
  END IF;

  IF target_user_id = caller_id THEN
    RAISE EXCEPTION 'Self-demotion is not allowed';
  END IF;

  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';

  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot demote the last admin';
  END IF;

  UPDATE public.profiles
  SET role = 'user'
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', 'user'
  );
END;
$$;

-- Secure profile update RPC for normal users
CREATE OR REPLACE FUNCTION public.update_profile(
  profile_id uuid,
  new_full_name text DEFAULT NULL,
  new_email text DEFAULT NULL,
  new_frames_name text DEFAULT NULL,
  new_photo_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF caller_id != profile_id THEN
    RAISE EXCEPTION 'Cannot update another user profile';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(new_full_name, full_name),
    email = COALESCE(new_email, email),
    frames_name = COALESCE(new_frames_name, frames_name),
    photo_url = COALESCE(new_photo_url, photo_url),
    updated_at = NOW()
  WHERE id = profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', profile_id
  );
END;
$$;

-- Revoke public access and grant to authenticated
REVOKE ALL ON FUNCTION public.promote_user_to_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.demote_user_from_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.demote_user_from_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.update_profile(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_profile(uuid, text, text, text, text) TO authenticated;

-- Drop the old overly permissive user update policy and replace with a safe one
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'user')
  );
