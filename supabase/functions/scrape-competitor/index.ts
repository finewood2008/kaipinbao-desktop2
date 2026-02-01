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
        onlyMainContent: true,
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
    const metadata = scrapeData.data?.metadata || {};
    const links = scrapeData.data?.links || [];

    // Extract product info
    const productInfo = extractProductInfo(markdown, metadata, url);
    
    // Extract ONLY main product image (first large image)
    const mainImage = extractMainProductImage(markdown, url);
    console.log("Main image extracted:", mainImage ? "yes" : "no");
    
    // Extract review summary from product page
    const reviewSummary = extractReviewSummary(markdown);
    console.log("Review summary extracted:", JSON.stringify(reviewSummary));

    // Step 2: If Amazon, scrape dedicated reviews page with screenshot
    let reviews: Array<{ text: string; rating?: number }> = [];
    let reviewScreenshotUrl: string | null = null;

    if (isAmazon && asin) {
      console.log("Amazon product detected, ASIN:", asin);
      
      try {
        const reviewsResult = await scrapeAmazonReviewsPage(asin, FIRECRAWL_API_KEY, supabase, productId);
        reviews = reviewsResult.reviews;
        reviewScreenshotUrl = reviewsResult.screenshotUrl;
        console.log(`Scraped ${reviews.length} reviews from dedicated page, screenshot: ${reviewScreenshotUrl ? 'yes' : 'no'}`);
      } catch (reviewError) {
        console.error("Error scraping reviews page:", reviewError);
        // Fall back to extracting from main page
        reviews = extractReviewsFromMarkdown(markdown);
      }
    } else {
      // Non-Amazon: extract reviews from main page
      reviews = extractReviewsFromMarkdown(markdown);
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
          metadata,
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
      // High-res images with size indicators
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._AC_SL1500_[^"'\s\)]*\.(jpg|png|webp)/gi,
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._SL1500_[^"'\s\)]*\.(jpg|png|webp)/gi,
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._AC_SL1200_[^"'\s\)]*\.(jpg|png|webp)/gi,
      // General Amazon images
      /https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+[^"'\s\)]*\.(jpg|png|webp)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = markdown.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first match (usually the main product image)
        return matches[0];
      }
    }
  } else if (lowerUrl.includes("aliexpress")) {
    const pattern = /https?:\/\/[^"'\s]+alicdn\.com[^"'\s]+\.(jpg|png|webp)/gi;
    const matches = markdown.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
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

// Extract review summary from product page (Amazon's "Customer reviews" section)
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

  // Extract rating breakdown (5 star XX%, 4 star YY%, etc.)
  const breakdownPattern = /(\d)\s*star[s]?\s*(\d+)%/gi;
  let breakdownMatch;
  while ((breakdownMatch = breakdownPattern.exec(markdown)) !== null) {
    result.ratingBreakdown.push({
      stars: parseInt(breakdownMatch[1], 10),
      percentage: parseInt(breakdownMatch[2], 10),
    });
  }

  // Extract "Customers say" or top review highlights
  // Amazon often has "Customers like..." or "Customers mention..." sections
  const positivePatterns = [
    /customers\s+(?:like|love|mention|say)[^.]*?(?:quality|durable|value|great|excellent|good|perfect|easy)[^.]*\./gi,
    /positive[^:]*:\s*([^.]+\.)/gi,
    /pros?[^:]*:\s*([^.]+\.)/gi,
  ];
  
  for (const pattern of positivePatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      for (const match of matches.slice(0, 3)) {
        const cleaned = match.replace(/^(customers\s+(?:like|love|mention|say)|positive[^:]*:|pros?[^:]*:)\s*/i, "").trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          result.topPositives.push(cleaned);
        }
      }
    }
  }

  // Extract negative mentions
  const negativePatterns = [
    /customers\s+(?:dislike|complain|mention)[^.]*?(?:issue|problem|broke|poor|cheap|flimsy|difficult)[^.]*\./gi,
    /negative[^:]*:\s*([^.]+\.)/gi,
    /cons?[^:]*:\s*([^.]+\.)/gi,
  ];
  
  for (const pattern of negativePatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      for (const match of matches.slice(0, 3)) {
        const cleaned = match.replace(/^(customers\s+(?:dislike|complain|mention)|negative[^:]*:|cons?[^:]*:)\s*/i, "").trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          result.topNegatives.push(cleaned);
        }
      }
    }
  }

  return result;
}

// Scrape Amazon's dedicated reviews page with screenshot
async function scrapeAmazonReviewsPage(
  asin: string,
  apiKey: string,
  supabase: any,
  productId: string
): Promise<{ reviews: Array<{ text: string; rating?: number }>; screenshotUrl: string | null }> {
  // Try multiple review pages for better coverage
  const reviewUrls = [
    `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent&pageNumber=1`,
    `https://www.amazon.com/product-reviews/${asin}/?sortBy=helpful&pageNumber=1`,
  ];
  
  let allReviews: Array<{ text: string; rating?: number }> = [];
  let screenshotUrl: string | null = null;

  for (const reviewUrl of reviewUrls) {
    if (allReviews.length >= 50) break; // Stop if we have enough
    
    console.log("Scraping reviews page:", reviewUrl);

    try {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: reviewUrl,
          formats: ["markdown", "screenshot"],
          waitFor: 8000, // Increased wait time
          actions: [
            { type: "wait", milliseconds: 3000 },
            { type: "scroll", direction: "down" },
            { type: "wait", milliseconds: 2000 },
            { type: "scroll", direction: "down" },
            { type: "wait", milliseconds: 2000 },
            { type: "scroll", direction: "down" },
            { type: "wait", milliseconds: 1500 },
          ],
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error("Reviews page scrape error:", data);
        continue;
      }

      const reviewsMarkdown = data.data?.markdown || "";
      const screenshotBase64 = data.data?.screenshot;
      
      console.log("Reviews markdown length:", reviewsMarkdown.length);

      // Extract reviews from reviews page
      const pageReviews = extractReviewsFromReviewPage(reviewsMarkdown);
      console.log(`Extracted ${pageReviews.length} reviews from page`);
      
      // Merge reviews (avoid duplicates)
      for (const review of pageReviews) {
        if (!allReviews.some(r => r.text.substring(0, 100) === review.text.substring(0, 100))) {
          allReviews.push(review);
        }
      }

      // Upload screenshot to Supabase Storage if available (only for first page)
      if (!screenshotUrl && screenshotBase64) {
        try {
          screenshotUrl = await uploadScreenshotToStorage(supabase, productId, screenshotBase64);
          console.log("Screenshot uploaded:", screenshotUrl);
        } catch (uploadError) {
          console.error("Screenshot upload error:", uploadError);
        }
      }
    } catch (error) {
      console.error("Error scraping review page:", error);
    }
  }

  return { reviews: allReviews, screenshotUrl };
}

// Upload screenshot to Supabase Storage (NOT storing base64 in database)
async function uploadScreenshotToStorage(
  supabase: any,
  productId: string,
  base64Data: string
): Promise<string | null> {
  try {
    // Handle different base64 formats from Firecrawl
    let base64Clean = base64Data;
    
    // Remove data URL prefix if present
    if (base64Clean.startsWith('data:')) {
      base64Clean = base64Clean.replace(/^data:image\/\w+;base64,/, "");
    }
    
    // Validate base64 string
    if (!base64Clean || base64Clean.length < 100) {
      console.log("Screenshot data too short or empty");
      return null;
    }
    
    // Clean any whitespace/newlines
    base64Clean = base64Clean.replace(/[\s\n\r]/g, '');
    
    // Verify it's valid base64
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Clean)) {
      console.log("Invalid base64 characters detected");
      return null;
    }
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `${productId}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from("review-screenshots")
      .upload(fileName, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("review-screenshots")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error("Screenshot processing error:", error);
    return null;
  }
}

// Extract reviews from Amazon's dedicated reviews page
function extractReviewsFromReviewPage(markdown: string): Array<{ text: string; rating?: number }> {
  const reviews: Array<{ text: string; rating?: number }> = [];
  
  console.log("Parsing reviews from markdown...");
  
  // Method 1: Look for review blocks with clear patterns
  // Amazon reviews typically have: rating, title, "Verified Purchase", then content
  
  // Pattern for review blocks - looking for the structure:
  // "X.0 out of 5 stars" ... "Verified Purchase" ... content
  const reviewBlockPattern = /(\d)\.0 out of 5 stars[\s\S]*?(?:Verified Purchase|Reviewed in)[\s\S]*?\n\n([\s\S]*?)(?=\d\.0 out of 5 stars|Helpful|Report|$)/gi;
  
  let match;
  while ((match = reviewBlockPattern.exec(markdown)) !== null) {
    const rating = parseInt(match[1], 10);
    let content = match[2].trim();
    
    // Clean up the content
    content = content
      .replace(/^\s*\n/gm, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\d+ people found this helpful.*$/i, '')
      .replace(/Report$/i, '')
      .replace(/Helpful$/i, '')
      .trim();
    
    if (isValidReviewText(content) && content.length >= 30) {
      reviews.push({ text: content, rating });
    }
  }
  
  // Method 2: If pattern matching fails, try line-by-line extraction
  if (reviews.length < 5) {
    console.log("Using fallback line-based extraction...");
    
    const lines = markdown.split(/\n+/);
    let currentRating: number | undefined;
    let potentialReview = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for rating
      const ratingMatch = line.match(/^(\d)\.0 out of 5 stars/i);
      if (ratingMatch) {
        // Save previous review if valid
        if (potentialReview && isValidReviewText(potentialReview) && potentialReview.length >= 50) {
          reviews.push({ text: potentialReview.trim(), rating: currentRating });
        }
        currentRating = parseInt(ratingMatch[1], 10);
        potentialReview = '';
        continue;
      }
      
      // Skip UI elements
      if (isUiElement(line)) continue;
      
      // Skip very short lines that are likely titles or headers
      if (line.length < 20) continue;
      
      // Accumulate review content
      if (currentRating && line.length >= 20) {
        // Check if this looks like review content
        if (!line.includes('amazon.com') && 
            !line.startsWith('[') && 
            !line.includes('Verified Purchase') &&
            !line.match(/^Reviewed in/i)) {
          potentialReview += ' ' + line;
        }
      }
      
      // Also look for standalone long paragraphs that might be reviews
      if (line.length >= 100 && isValidReviewText(line)) {
        // Try to find associated rating
        for (let j = Math.max(0, i - 10); j < i; j++) {
          const rMatch = lines[j].match(/(\d)\.0 out of 5 stars/i);
          if (rMatch) {
            reviews.push({ text: line, rating: parseInt(rMatch[1], 10) });
            break;
          }
        }
      }
    }
    
    // Don't forget last review
    if (potentialReview && isValidReviewText(potentialReview) && potentialReview.length >= 50) {
      reviews.push({ text: potentialReview.trim(), rating: currentRating });
    }
  }
  
  // Method 3: Extract any substantial text blocks as fallback
  if (reviews.length < 3) {
    console.log("Using text block extraction fallback...");
    
    // Split by double newlines to get paragraphs
    const paragraphs = markdown.split(/\n\n+/);
    
    for (const para of paragraphs) {
      const cleaned = para.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Look for paragraphs that look like reviews (substantial text, no URLs)
      if (cleaned.length >= 80 && 
          cleaned.length <= 2000 && 
          isValidReviewText(cleaned) &&
          !cleaned.includes('Add to') &&
          !cleaned.includes('Buy Now') &&
          !cleaned.includes('customers mention')) {
        
        // Try to find a rating near this text
        const beforeText = markdown.substring(0, markdown.indexOf(para));
        const lastRating = beforeText.match(/(\d)\.0 out of 5 stars/gi);
        const rating = lastRating ? parseInt(lastRating[lastRating.length - 1][0], 10) : undefined;
        
        if (!reviews.some(r => r.text.includes(cleaned.substring(0, 50)))) {
          reviews.push({ text: cleaned, rating });
        }
      }
    }
  }
  
  console.log(`Total reviews extracted: ${reviews.length}`);
  return reviews.slice(0, 100); // Limit to 100 reviews
}

// Check if a line is likely a UI element
function isUiElement(line: string): boolean {
  const uiPatterns = [
    /^(see|read|show)\s+(more|all|full)/i,
    /^(helpful|report|share)/i,
    /^\d+\s*(people|person)\s+found/i,
    /^verified purchase$/i,
    /^reviewed in/i,
    /^\d+\s*out of\s*\d+/i,
    /^\[.*\]$/,
    /^!\[/,
    /amazon\.com/i,
    /^http/i,
    /^Add to/i,
    /^Buy Now/i,
    /^In Stock/i,
    /^Quantity/i,
    /customer reviews?$/i,
    /^Color:/i,
    /^Size:/i,
    /^Style:/i,
  ];
  
  return uiPatterns.some(p => p.test(line.trim()));
}

// Validate that text is actual review content, not URL fragments or UI elements
function isValidReviewText(text: string): boolean {
  if (!text || text.length < 30) return false;
  if (text.length > 3000) return false;
  
  // Reject URL fragments
  if (/reviews?\/R[A-Z0-9]+/i.test(text)) return false;
  if (text.includes("amazon.com")) return false;
  if (text.includes("http://") || text.includes("https://")) return false;
  
  // Reject common UI elements
  const uiPatterns = [
    /^(see|read|show)\s+(more|all|full)/i,
    /^(helpful|report|share)/i,
    /^\d+\s*(people|person)\s+found/i,
    /^verified purchase$/i,
    /^reviewed in/i,
    /^\d+\s*out of\s*\d+/i,
  ];
  
  if (uiPatterns.some(p => p.test(text.trim()))) return false;
  
  // Must contain actual words (not just numbers/punctuation)
  if (!/[a-zA-Z]{4,}/.test(text)) return false;
  
  return true;
}

// Fallback: extract reviews from main page markdown
function extractReviewsFromMarkdown(markdown: string): Array<{ text: string; rating?: number }> {
  const reviews: Array<{ text: string; rating?: number }> = [];
  
  const lines = markdown.split(/\n+/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!isValidReviewText(line)) continue;
    
    if (line.length >= 50 && line.length <= 2000) {
      // Try to find associated rating
      let rating: number | undefined;
      const ratingMatch = line.match(/(\d)\s*(?:star|★|⭐)/i);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1], 10);
      }
      
      reviews.push({ text: line, rating });
    }
  }
  
  return reviews.slice(0, 50);
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
    /Price:\s*([\$￥]?[\d,]+\.?\d*)/gi,
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
    /(\d+\.?\d*)\s*stars?/i,
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
      .replace(/\s*[-|:]\s*(Amazon|AliExpress|eBay|淘宝|天猫).*$/i, "")
      .trim();
  }

  return { title, description, price, rating, reviewCount };
}
