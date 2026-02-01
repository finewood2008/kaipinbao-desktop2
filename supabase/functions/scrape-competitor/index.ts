import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, url } = await req.json();

    if (!productId || !url) {
      return new Response(
        JSON.stringify({ success: false, error: "productId and url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to scraping
    await supabase
      .from("competitor_products")
      .update({ status: "scraping" })
      .eq("id", productId);

    console.log("Scraping URL:", url);

    // Call Firecrawl API
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html", "links"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error("Firecrawl error:", scrapeData);
      await supabase
        .from("competitor_products")
        .update({ status: "failed" })
        .eq("id", productId);

      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || "Scraping failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract product info from scraped data
    const markdown = scrapeData.data?.markdown || "";
    const metadata = scrapeData.data?.metadata || {};
    const links = scrapeData.data?.links || [];

    // Try to extract product details
    const productInfo = extractProductInfo(markdown, metadata, url);
    
    // Extract product images
    const productImages = extractProductImages(markdown, links, url);
    console.log(`Extracted ${productImages.length} product images`);

    // Update product with scraped data
    const { error: updateError } = await supabase
      .from("competitor_products")
      .update({
        product_title: productInfo.title,
        product_description: productInfo.description,
        price: productInfo.price,
        rating: productInfo.rating,
        review_count: productInfo.reviewCount,
        product_images: productImages,
        scraped_data: {
          markdown: markdown.slice(0, 50000), // Limit size
          metadata,
          extractedAt: new Date().toISOString(),
        },
        status: "completed",
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Extract and save reviews
    const reviews = extractReviews(markdown);
    if (reviews.length > 0) {
      const reviewsToInsert = reviews.slice(0, 100).map((review) => ({
        competitor_product_id: productId,
        review_text: review.text,
        rating: review.rating,
        sentiment: "neutral",
        is_positive: null,
      }));

      await supabase.from("competitor_reviews").insert(reviewsToInsert);
    }

    console.log(`Scraped product: ${productInfo.title}, ${reviews.length} reviews found`);

    return new Response(
      JSON.stringify({
        success: true,
        productInfo,
        reviewCount: reviews.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractProductInfo(markdown: string, metadata: any, url: string) {
  const lowerUrl = url.toLowerCase();
  let title = metadata.title || "";
  let description = metadata.description || "";
  let price = "";
  let rating = null;
  let reviewCount = null;

  // Try to extract price
  const pricePatterns = [
    /\$[\d,]+\.?\d*/g,
    /￥[\d,]+\.?\d*/g,
    /US\s*\$[\d,]+\.?\d*/gi,
    /Price:\s*([\$￥]?[\d,]+\.?\d*)/gi,
  ];

  for (const pattern of pricePatterns) {
    const matches = markdown.match(pattern);
    if (matches && matches.length > 0) {
      price = matches[0].trim();
      break;
    }
  }

  // Try to extract rating
  const ratingPatterns = [
    /(\d+\.?\d*)\s*out of\s*5/i,
    /Rating:\s*(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*stars?/i,
    /★\s*(\d+\.?\d*)/,
  ];

  for (const pattern of ratingPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (parsed >= 0 && parsed <= 5) {
        rating = parsed;
        break;
      }
    }
  }

  // Try to extract review count
  const reviewPatterns = [
    /([\d,]+)\s*(?:reviews?|ratings?|评价|评论)/i,
    /(\d+)\s*customer\s*reviews?/i,
  ];

  for (const pattern of reviewPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      reviewCount = parseInt(match[1].replace(/,/g, ""), 10);
      break;
    }
  }

  // Clean up title
  if (title) {
    // Remove common suffixes
    title = title
      .replace(/\s*[-|:]\s*(Amazon|AliExpress|eBay|淘宝|天猫).*$/i, "")
      .trim();
  }

  return { title, description, price, rating, reviewCount };
}

function extractProductImages(markdown: string, links: string[], url: string): string[] {
  const images: Set<string> = new Set();
  const lowerUrl = url.toLowerCase();
  
  // Extract image URLs from markdown (![alt](url) format)
  const markdownImagePattern = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/gi;
  let match;
  while ((match = markdownImagePattern.exec(markdown)) !== null) {
    const imgUrl = match[1];
    if (isProductImage(imgUrl, lowerUrl)) {
      images.add(imgUrl);
    }
  }
  
  // Extract from HTML img tags in markdown
  const htmlImagePattern = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  while ((match = htmlImagePattern.exec(markdown)) !== null) {
    const imgUrl = match[1];
    if (isProductImage(imgUrl, lowerUrl)) {
      images.add(imgUrl);
    }
  }
  
  // Extract from links array (filter for image URLs)
  for (const link of links) {
    if (/\.(jpg|jpeg|png|webp|gif)/i.test(link) && isProductImage(link, lowerUrl)) {
      images.add(link);
    }
  }
  
  // Convert to array and limit to first 10 images
  return Array.from(images).slice(0, 10);
}

function isProductImage(imgUrl: string, sourceUrl: string): boolean {
  const lowerImg = imgUrl.toLowerCase();
  
  // Exclude common non-product images
  const excludePatterns = [
    /logo/i,
    /icon/i,
    /favicon/i,
    /avatar/i,
    /banner/i,
    /ad[_-]/i,
    /advertisement/i,
    /sprite/i,
    /button/i,
    /arrow/i,
    /loader/i,
    /loading/i,
    /placeholder/i,
    /1x1/,
    /transparent/i,
    /pixel/i,
  ];
  
  if (excludePatterns.some(pattern => pattern.test(lowerImg))) {
    return false;
  }
  
  // For Amazon, look for product images
  if (sourceUrl.includes("amazon")) {
    // Amazon product images typically contain these patterns
    if (lowerImg.includes("images-amazon") || lowerImg.includes("m.media-amazon")) {
      // Filter for larger images (product photos are usually larger)
      if (lowerImg.includes("._sl") || lowerImg.includes("._ac_") || lowerImg.includes("._ss")) {
        return true;
      }
      // Include if it looks like a product image size
      if (/\d{3,4}x\d{3,4}|_\d{3,4}_/i.test(lowerImg)) {
        return true;
      }
      return true; // Include most Amazon images by default
    }
  }
  
  // For AliExpress
  if (sourceUrl.includes("aliexpress")) {
    if (lowerImg.includes("ae01.alicdn") || lowerImg.includes("ae04.alicdn")) {
      return true;
    }
  }
  
  // For eBay
  if (sourceUrl.includes("ebay")) {
    if (lowerImg.includes("ebayimg.com")) {
      return true;
    }
  }
  
  // General: include if it's a large enough image URL
  if (/\.(jpg|jpeg|png|webp)/i.test(lowerImg)) {
    return true;
  }
  
  return false;
}

function extractReviews(markdown: string): Array<{ text: string; rating?: number }> {
  const reviews: Array<{ text: string; rating?: number }> = [];
  
  // Look for review sections
  const reviewSectionPatterns = [
    /(?:Customer Reviews?|Reviews?|评价|评论)[\s\S]*?(?=\n\n|\Z)/gi,
    /(?:★{1,5}|⭐{1,5})[\s\S]*?(?=(?:★{1,5}|⭐{1,5})|\n\n|\Z)/g,
  ];

  for (const pattern of reviewSectionPatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Split into individual reviews
        const lines = match.split(/\n+/).filter(line => line.trim().length > 20);
        for (const line of lines) {
          if (line.length > 20 && line.length < 2000) {
            // Try to extract rating from the review
            let rating: number | undefined;
            const ratingMatch = line.match(/(\d+)\s*(?:star|★|⭐)/i);
            if (ratingMatch) {
              rating = parseInt(ratingMatch[1], 10);
            }
            
            reviews.push({
              text: line.trim(),
              rating,
            });
          }
        }
      }
    }
  }

  return reviews;
}
