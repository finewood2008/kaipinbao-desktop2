-- Create competitor_products table
CREATE TABLE public.competitor_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  product_title TEXT,
  product_description TEXT,
  price TEXT,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  scraped_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competitor_reviews table
CREATE TABLE public.competitor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_product_id UUID NOT NULL REFERENCES public.competitor_products(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  rating INTEGER,
  sentiment TEXT DEFAULT 'neutral',
  key_points TEXT[],
  is_positive BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS competitor_research_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prd_progress JSONB DEFAULT '{"usageScenario": false, "targetAudience": false, "designStyle": false, "coreFeatures": false, "confirmed": false}'::jsonb;

-- Enable RLS on competitor_products
ALTER TABLE public.competitor_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for competitor_products
CREATE POLICY "Users can view competitor products of their projects"
ON public.competitor_products FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = competitor_products.project_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert competitor products to their projects"
ON public.competitor_products FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = competitor_products.project_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update competitor products of their projects"
ON public.competitor_products FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = competitor_products.project_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete competitor products of their projects"
ON public.competitor_products FOR DELETE
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = competitor_products.project_id
  AND projects.user_id = auth.uid()
));

-- Enable RLS on competitor_reviews
ALTER TABLE public.competitor_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for competitor_reviews
CREATE POLICY "Users can view reviews of their competitor products"
ON public.competitor_reviews FOR SELECT
USING (EXISTS (
  SELECT 1 FROM competitor_products cp
  JOIN projects p ON p.id = cp.project_id
  WHERE cp.id = competitor_reviews.competitor_product_id
  AND p.user_id = auth.uid()
));

CREATE POLICY "Users can insert reviews to their competitor products"
ON public.competitor_reviews FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM competitor_products cp
  JOIN projects p ON p.id = cp.project_id
  WHERE cp.id = competitor_reviews.competitor_product_id
  AND p.user_id = auth.uid()
));

CREATE POLICY "Users can delete reviews of their competitor products"
ON public.competitor_reviews FOR DELETE
USING (EXISTS (
  SELECT 1 FROM competitor_products cp
  JOIN projects p ON p.id = cp.project_id
  WHERE cp.id = competitor_reviews.competitor_product_id
  AND p.user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_competitor_products_updated_at
BEFORE UPDATE ON public.competitor_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();