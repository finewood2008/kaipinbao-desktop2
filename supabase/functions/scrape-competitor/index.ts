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

    // Detect platform and check if it's Amazon
    const isAmazon = url.toLowerCase().includes("amazon");
    const asin = isAmazon ? extractAsin(url) : null;

    // Step 1: Scrape product page
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false, // Get full page for better extraction
        waitFor: 5000,
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

    const markdown = scrapeData.data?.markdown || "";
    const html = scrapeData.data?.html || "";
    const metadata = scrapeData.data?.metadata || {};

    // Extract product info
    const productInfo = extractProductInfo(markdown, metadata, url);
    
    // Extract ONLY main product image (first large image)
    const mainImage = extractMainProductImage(markdown, url);
    console.log("Main image extracted:", mainImage ? "yes" : "no");
    
    // Extract review summary from product page
    const reviewSummary = extractReviewSummary(markdown);
    console.log("Review summary extracted:", JSON.stringify(reviewSummary));

    // Step 2: If Amazon, scrape dedicated reviews page
    let reviews: Array<{ text: string; rating?: number }> = [];
    let reviewScreenshotUrl: string | null = null;

    if (isAmazon && asin) {
      console.log("Amazon product detected, ASIN:", asin);
      
      try {
        const reviewsResult = await scrapeAmazonReviewsPage(asin, FIRECRAWL_API_KEY, supabase, productId);
        reviews = reviewsResult.reviews;
        reviewScreenshotUrl = reviewsResult.screenshotUrl;
        console.log(`Scraped ${reviews.length} reviews from dedicated page`);
      } catch (reviewError) {
        console.error("Error scraping reviews page:", reviewError);
        // Fall back to extracting from main page HTML
        reviews = extractReviewsFromHtml(html);
        console.log(`Fallback: extracted ${reviews.length} reviews from main page HTML`);
      }
    } else {
      // Non-Amazon: extract reviews from main page
      reviews = extractReviewsFromHtml(html);
    }

    // Update product with scraped data
    const { error: updateError } = await supabase
      .from("competitor_products")
      .update({
        product_title: productInfo.title,
        product_description: productInfo.description,
        price: productInfo.price,
        rating: productInfo.rating,
        review_count: productInfo.reviewCount,
        main_image: mainImage,
        product_images: mainImage ? [mainImage] : [],
        review_summary: reviewSummary,
        review_screenshot_url: reviewScreenshotUrl,
        scraped_data: {
          markdown: markdown.slice(0, 50000),
          extractedAt: new Date().toISOString(),
          asin: asin,
        },
        status: "completed",
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Save reviews
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
        hasScreenshot: !!reviewScreenshotUrl,
        hasReviewSummary: !!(reviewSummary.topPositives.length || reviewSummary.topNegatives.length),
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

// Extract ASIN from Amazon URL
function extractAsin(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

// Extract only the main product image (first large image)
function extractMainProductImage(markdown: string, url: string): string | null {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes("amazon")) {
    // Amazon main image patterns - prioritize large images
    const patterns = [
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._AC_SL1500_[^"'\s\)]*\.(jpg|png|webp)/gi,
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._SL1500_[^"'\s\)]*\.(jpg|png|webp)/gi,
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._AC_SL1200_[^"'\s\)]*\.(jpg|png|webp)/gi,
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+[^"'\s\)]*\.(jpg|png|webp)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = markdown.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
  }
  
  // Fallback: any large image
  const generalPattern = /https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi;
  const matches = markdown.match(generalPattern);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  
  return null;
}

// Extract review summary from product page
function extractReviewSummary(markdown: string): {
  overallRating: number | null;
  totalReviews: number | null;
  ratingBreakdown: { stars: number; percentage: number }[];
  topPositives: string[];
  topNegatives: string[];
} {
  const result = {
    overallRating: null as number | null,
    totalReviews: null as number | null,
    ratingBreakdown: [] as { stars: number; percentage: number }[],
    topPositives: [] as string[],
    topNegatives: [] as string[],
  };

  // Extract overall rating
  const ratingMatch = markdown.match(/(\d+\.?\d*)\s*out of\s*5\s*stars?/i);
  if (ratingMatch) {
    result.overallRating = parseFloat(ratingMatch[1]);
  }

  // Extract total reviews
  const reviewCountMatch = markdown.match(/([\d,]+)\s*(?:global\s+)?(?:ratings?|reviews?|customer\s+reviews?)/i);
  if (reviewCountMatch) {
    result.totalReviews = parseInt(reviewCountMatch[1].replace(/,/g, ""), 10);
  }

  // Extract rating breakdown
  const breakdownPattern = /(\d)\s*star[s]?\s*(\d+)%/gi;
  let breakdownMatch;
  while ((breakdownMatch = breakdownPattern.exec(markdown)) !== null) {
    result.ratingBreakdown.push({
      stars: parseInt(breakdownMatch[1], 10),
      percentage: parseInt(breakdownMatch[2], 10),
    });
  }

  // Extract "Customers say" highlights
  const positivePatterns = [
    /customers\s+(?:like|love|mention|say)[^.]*?(?:quality|durable|value|great|excellent|good|perfect|easy)[^.]*\./gi,
  ];
  
  for (const pattern of positivePatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      for (const match of matches.slice(0, 3)) {
        const cleaned = match.replace(/^customers\s+(?:like|love|mention|say)\s*/i, "").trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          result.topPositives.push(cleaned);
        }
      }
    }
  }

  return result;
}

// Scrape Amazon's dedicated reviews page
async function scrapeAmazonReviewsPage(
  asin: string,
  apiKey: string,
  supabase: any,
  productId: string
): Promise<{ reviews: Array<{ text: string; rating?: number }>; screenshotUrl: string | null }> {
  // Scrape multiple pages for more reviews
  const reviewUrls = [
    `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent&pageNumber=1`,
    `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent&pageNumber=2`,
    `https://www.amazon.com/product-reviews/${asin}/?sortBy=helpful&pageNumber=1`,
  ];
  
  let allReviews: Array<{ text: string; rating?: number }> = [];
  let screenshotUrl: string | null = null;

  for (const reviewUrl of reviewUrls) {
    if (allReviews.length >= 80) break;
    
    console.log("Scraping reviews page:", reviewUrl);

    try {
      // Use HTML format for better structured extraction
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: reviewUrl,
          formats: ["html", "markdown"],
          onlyMainContent: false,
          waitFor: 10000, // Wait longer for reviews to load
          actions: [
            { type: "wait", milliseconds: 3000 },
            { type: "scroll", direction: "down", amount: 500 },
            { type: "wait", milliseconds: 2000 },
            { type: "scroll", direction: "down", amount: 500 },
            { type: "wait", milliseconds: 2000 },
            { type: "scroll", direction: "down", amount: 500 },
            { type: "wait", milliseconds: 2000 },
          ],
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error("Reviews page scrape error:", data.error || data);
        continue;
      }

      const reviewsHtml = data.data?.html || "";
      const reviewsMarkdown = data.data?.markdown || "";
      
      console.log("HTML length:", reviewsHtml.length, "Markdown length:", reviewsMarkdown.length);

      // Extract reviews from HTML (more reliable)
      let pageReviews = extractReviewsFromHtml(reviewsHtml);
      console.log(`Extracted ${pageReviews.length} reviews from HTML`);
      
      // If HTML extraction fails, try markdown
      if (pageReviews.length < 3) {
        const markdownReviews = extractReviewsFromMarkdownAdvanced(reviewsMarkdown);
        console.log(`Extracted ${markdownReviews.length} reviews from markdown`);
        if (markdownReviews.length > pageReviews.length) {
          pageReviews = markdownReviews;
        }
      }
      
      // Merge reviews (avoid duplicates)
      for (const review of pageReviews) {
        const isDuplicate = allReviews.some(r => 
          r.text.length > 50 && review.text.length > 50 &&
          (r.text.substring(0, 80) === review.text.substring(0, 80) ||
           r.text.includes(review.text.substring(0, 50)))
        );
        if (!isDuplicate) {
          allReviews.push(review);
        }
      }
      
      console.log(`Total reviews so far: ${allReviews.length}`);
    } catch (error) {
      console.error("Error scraping review page:", error);
    }
  }

  return { reviews: allReviews, screenshotUrl };
}

// Extract reviews from HTML (more reliable than markdown)
function extractReviewsFromHtml(html: string): Array<{ text: string; rating?: number }> {
  const reviews: Array<{ text: string; rating?: number }> = [];
  
  if (!html || html.length < 100) return reviews;

  // Pattern 1: Amazon review body with data-hook attribute
  // data-hook="review-body"
  const reviewBodyPattern = /<span[^>]*data-hook="review-body"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
  let match;
  while ((match = reviewBodyPattern.exec(html)) !== null) {
    const content = cleanHtmlText(match[1]);
    if (isValidReviewContent(content)) {
      // Try to find rating near this review
      const rating = findNearbyRating(html, match.index);
      reviews.push({ text: content, rating });
    }
  }

  // Pattern 2: Review text in div with specific class patterns
  const reviewDivPattern = /<div[^>]*class="[^"]*review-text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = reviewDivPattern.exec(html)) !== null) {
    const content = cleanHtmlText(match[1]);
    if (isValidReviewContent(content) && !reviews.some(r => r.text.includes(content.substring(0, 50)))) {
      const rating = findNearbyRating(html, match.index);
      reviews.push({ text: content, rating });
    }
  }

  // Pattern 3: Look for review content in span tags with substantial text
  const spanPattern = /<span[^>]*>([\s\S]{100,2000}?)<\/span>/gi;
  while ((match = spanPattern.exec(html)) !== null) {
    const content = cleanHtmlText(match[1]);
    // Check if this looks like a review (not a product description, not HTML)
    if (isValidReviewContent(content) && 
        !content.includes("Add to Cart") &&
        !content.includes("Buy Now") &&
        !content.includes("customers mention") &&
        !reviews.some(r => r.text.includes(content.substring(0, 50)))) {
      const rating = findNearbyRating(html, match.index);
      reviews.push({ text: content, rating });
    }
  }

  // Pattern 4: Look for paragraphs that might be reviews
  const pPattern = /<p[^>]*>([\s\S]{80,1500}?)<\/p>/gi;
  while ((match = pPattern.exec(html)) !== null) {
    const content = cleanHtmlText(match[1]);
    if (isValidReviewContent(content) && !reviews.some(r => r.text.includes(content.substring(0, 50)))) {
      const rating = findNearbyRating(html, match.index);
      reviews.push({ text: content, rating });
    }
  }

  console.log(`HTML extraction found ${reviews.length} reviews`);
  return reviews.slice(0, 100);
}

// Clean HTML text
function cleanHtmlText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Find rating near a position in HTML
function findNearbyRating(html: string, position: number): number | undefined {
  // Look backwards up to 500 characters for a rating
  const searchStart = Math.max(0, position - 500);
  const searchText = html.substring(searchStart, position);
  
  // Look for "X out of 5 stars" pattern
  const patterns = [
    /(\d)\.0 out of 5 stars/gi,
    /(\d) out of 5 stars/gi,
    /a-star-(\d)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = [...searchText.matchAll(pattern)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return parseInt(lastMatch[1], 10);
    }
  }
  
  return undefined;
}

// Validate review content
function isValidReviewContent(text: string): boolean {
  if (!text || text.length < 50 || text.length > 3000) return false;
  
  // Reject URL fragments
  if (/https?:\/\//i.test(text)) return false;
  if (text.includes("amazon.com")) return false;
  
  // Reject UI elements
  const uiPatterns = [
    /^(see|read|show)\s+(more|all|full)/i,
    /^(helpful|report|share)/i,
    /^\d+\s*(people|person)\s+found/i,
    /^verified purchase$/i,
    /^reviewed in/i,
    /add to cart/i,
    /buy now/i,
    /in stock/i,
    /free shipping/i,
    /sold by/i,
    /sponsored/i,
    /advertisement/i,
  ];
  
  if (uiPatterns.some(p => p.test(text))) return false;
  
  // Must have at least 3 words
  const wordCount = text.split(/\s+/).filter(w => w.length >= 3).length;
  if (wordCount < 5) return false;
  
  // Must contain actual sentences (letters, not just numbers)
  if (!/[a-zA-Z]{5,}/.test(text)) return false;
  
  return true;
}

// Advanced markdown extraction
function extractReviewsFromMarkdownAdvanced(markdown: string): Array<{ text: string; rating?: number }> {
  const reviews: Array<{ text: string; rating?: number }> = [];
  
  if (!markdown || markdown.length < 100) return reviews;

  // Split by potential review boundaries
  const sections = markdown.split(/(?=\d\.0 out of 5 stars)/gi);
  
  for (const section of sections) {
    if (section.length < 100) continue;
    
    // Extract rating from section start
    const ratingMatch = section.match(/^(\d)\.0 out of 5 stars/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : undefined;
    
    // Find review content (skip headers, find substantial text)
    const lines = section.split(/\n+/);
    let reviewText = '';
    let foundVerified = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty and short lines
      if (trimmed.length < 20) continue;
      
      // Mark when we've passed "Verified Purchase"
      if (/verified purchase/i.test(trimmed)) {
        foundVerified = true;
        continue;
      }
      
      // Skip UI elements
      if (isUiLine(trimmed)) continue;
      
      // After "Verified Purchase", collect review content
      if (foundVerified && trimmed.length >= 30) {
        // Stop if we hit "Helpful" or "Report"
        if (/^\d+ people found this helpful/i.test(trimmed)) break;
        if (/^(helpful|report)$/i.test(trimmed)) break;
        
        reviewText += ' ' + trimmed;
      }
    }
    
    reviewText = reviewText.trim();
    if (reviewText.length >= 50 && isValidReviewContent(reviewText)) {
      reviews.push({ text: reviewText, rating });
    }
  }
  
  // Also try paragraph-based extraction
  const paragraphs = markdown.split(/\n\n+/);
  for (const para of paragraphs) {
    const cleaned = para.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (cleaned.length >= 80 && 
        cleaned.length <= 2000 && 
        isValidReviewContent(cleaned) &&
        !reviews.some(r => r.text.includes(cleaned.substring(0, 50)))) {
      reviews.push({ text: cleaned });
    }
  }
  
  return reviews;
}

// Check if a line is UI element
function isUiLine(line: string): boolean {
  const patterns = [
    /^(see|read|show)\s+(more|all|full)/i,
    /^(helpful|report|share)/i,
    /^\d+\s*(people|person)\s+found/i,
    /^verified purchase$/i,
    /^reviewed in/i,
    /^\d+\s*out of\s*\d+/i,
    /^\[.*\]$/,
    /^!\[/,
    /amazon\.com/i,
    /^https?:/i,
    /^add to/i,
    /^buy now/i,
    /^in stock/i,
    /^color:/i,
    /^size:/i,
    /^style:/i,
    /^\d+\s*star/i,
    /customer reviews?$/i,
  ];
  
  return patterns.some(p => p.test(line.trim()));
}

function extractProductInfo(markdown: string, metadata: any, url: string) {
  let title = metadata.title || "";
  let description = metadata.description || "";
  let price = "";
  let rating = null;
  let reviewCount = null;

  // Extract price
  const pricePatterns = [
    /\$[\d,]+\.?\d*/g,
    /￥[\d,]+\.?\d*/g,
    /US\s*\$[\d,]+\.?\d*/gi,
  ];

  for (const pattern of pricePatterns) {
    const matches = markdown.match(pattern);
    if (matches && matches.length > 0) {
      price = matches[0].trim();
      break;
    }
  }

  // Extract rating
  const ratingPatterns = [
    /(\d+\.?\d*)\s*out of\s*5/i,
    /Rating:\s*(\d+\.?\d*)/i,
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

  // Extract review count
  const reviewPatterns = [
    /([\d,]+)\s*(?:global\s+)?(?:ratings?|reviews?)/i,
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
    title = title
      .replace(/\s*[-|:]\s*(Amazon|AliExpress|eBay).*$/i, "")
      .trim();
  }

  return { title, description, price, rating, reviewCount };
}
