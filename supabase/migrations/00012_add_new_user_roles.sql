-- Add new roles to user_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'student' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'student';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'teacher' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'teacher';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'school_admin' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'school_admin';
  END IF;
END$$;