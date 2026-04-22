-- ============================================================
-- HIVON BLOG PLATFORM — SUPABASE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- 1. USERS TABLE (profiles linked to Supabase Auth)
CREATE TABLE public.users (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT UNIQUE NOT NULL,
  role      TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('author', 'viewer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. POSTS TABLE
CREATE TABLE public.posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  image_url  TEXT,
  author_id  UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  summary    TEXT,                          -- AI-generated, stored once
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COMMENTS TABLE
CREATE TABLE public.comments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Anyone can view profiles"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- POSTS policies
CREATE POLICY "Anyone can view posts"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authors and admins can create posts"
  ON public.posts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('author', 'admin')
    )
  );

CREATE POLICY "Authors edit own posts; admins edit any"
  ON public.posts FOR UPDATE USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any post"
  ON public.posts FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- COMMENTS policies
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users delete own comments; admins delete any"
  ON public.comments FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET for post images
-- ============================================================

-- Run this in Supabase Dashboard → Storage → New Bucket
-- Name: post-images, Public: true
-- OR run SQL below:

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );
