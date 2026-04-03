-- Supabase Production Security: Row Level Security (RLS)
-- Execute this script in the Supabase SQL Editor to secure your data.

-- 1. Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_trackers ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies for "users" table
-- Users can only see and update their own record
CREATE POLICY "Users can view their own record" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- 3. Define Policies for "resume_profiles" table
-- Users can manage only their own resumes
CREATE POLICY "Users can manage their own resumes" 
ON resume_profiles FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Define Policies for "job_trackers" table
-- Users can manage only their own tracked jobs
CREATE POLICY "Users can manage their own job trackers" 
ON job_trackers FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Public access (optional, if any)
-- e.g., if you have a public landing page or similar.
-- For now, we assume all data is private per user.

-- Note: Ensure your 'users.id' and 'auth.users.id' are synchronized.
-- If you use Laravel's internal Auth, ensure the UUIDs match the Supabase Auth UUIDs.
