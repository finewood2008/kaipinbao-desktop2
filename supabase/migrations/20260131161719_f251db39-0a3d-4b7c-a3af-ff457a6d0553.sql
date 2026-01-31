-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create projects table for product R&D projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_stage INTEGER NOT NULL DEFAULT 1 CHECK (current_stage >= 1 AND current_stage <= 3),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  prd_data JSONB,
  visual_data JSONB,
  landing_page_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Create chat_messages table for AI conversation history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies (access through project ownership)
CREATE POLICY "Users can view messages of their projects" ON public.chat_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = chat_messages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert messages to their projects" ON public.chat_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = chat_messages.project_id AND projects.user_id = auth.uid()));

-- Create generated_images table for AI-generated product images
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on generated_images
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Generated images policies
CREATE POLICY "Users can view images of their projects" ON public.generated_images FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert images to their projects" ON public.generated_images FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update images of their projects" ON public.generated_images FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid()));

-- Create landing_pages table for published marketing pages
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  hero_image_url TEXT,
  pain_points JSONB,
  selling_points JSONB,
  trust_badges JSONB,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on landing_pages
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Landing pages policies - owners can manage, public can view published pages
CREATE POLICY "Users can view their own landing pages" ON public.landing_pages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = landing_pages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Public can view published landing pages" ON public.landing_pages FOR SELECT 
  USING (is_published = true);
CREATE POLICY "Users can insert landing pages for their projects" ON public.landing_pages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = landing_pages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their landing pages" ON public.landing_pages FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = landing_pages.project_id AND projects.user_id = auth.uid()));

-- Create email_submissions table for landing page email collection
CREATE TABLE public.email_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_submissions
ALTER TABLE public.email_submissions ENABLE ROW LEVEL SECURITY;

-- Email submissions policies - anyone can submit, owners can view
CREATE POLICY "Anyone can submit email" ON public.email_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view emails for their landing pages" ON public.email_submissions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.landing_pages lp 
    JOIN public.projects p ON p.id = lp.project_id 
    WHERE lp.id = email_submissions.landing_page_id AND p.user_id = auth.uid()
  ));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();