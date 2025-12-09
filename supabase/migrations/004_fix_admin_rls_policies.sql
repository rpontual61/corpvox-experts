-- Migration: Fix Admin RLS Policies
-- Description: Update RLS policies to allow admin operations
-- Date: 2025-12-09

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.experts_admin_users;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.experts_admin_sessions;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.experts_admin_activity_log;

-- Create permissive policies for experts_admin_users
CREATE POLICY "Enable all operations for admin users" ON public.experts_admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for experts_admin_sessions
CREATE POLICY "Enable all operations for admin sessions" ON public.experts_admin_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for experts_admin_activity_log
CREATE POLICY "Enable all operations for admin activity log" ON public.experts_admin_activity_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
