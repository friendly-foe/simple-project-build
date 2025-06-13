
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resumes table  
CREATE TABLE public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_analysis JSONB,
  skills_extracted TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create career_paths table (using different column names to avoid reserved keywords)
CREATE TABLE public.career_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  current_role_title TEXT NOT NULL,
  target_role_title TEXT NOT NULL,
  timeline_months INTEGER NOT NULL,
  required_skills TEXT[],
  learning_resources JSONB,
  milestones JSONB,
  ai_recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_matches table
CREATE TABLE public.job_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  job_description TEXT,
  match_score INTEGER,
  match_reasons TEXT[],
  salary_range TEXT,
  location TEXT,
  job_url TEXT,
  status TEXT DEFAULT 'interested',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for resumes
CREATE POLICY "Users can view their own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for career_paths
CREATE POLICY "Users can view their own career paths" ON public.career_paths
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own career paths" ON public.career_paths
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own career paths" ON public.career_paths
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own career paths" ON public.career_paths
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for job_matches
CREATE POLICY "Users can view their own job matches" ON public.job_matches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own job matches" ON public.job_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job matches" ON public.job_matches
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job matches" ON public.job_matches
  FOR DELETE USING (auth.uid() = user_id);
