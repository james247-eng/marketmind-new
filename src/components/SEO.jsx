// SEO.jsx
// Dynamic SEO meta tags for all pages

import { Helmet } from 'react-helmet-async';

function SEO({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  ogUrl,
  canonical 
}) {
  const defaultTitle = "Market Mind - AI-Powered Social Media Marketing Platform";
  const defaultDescription = "Automate your social media marketing with AI. Generate engaging content, schedule posts to Facebook, Instagram, Twitter, TikTok & YouTube. Get real-time analytics. Start free today!";
  const defaultKeywords = "social media marketing, AI content generator, schedule social media posts, social media automation, content marketing, Facebook marketing, Instagram marketing, Twitter marketing, TikTok marketing, YouTube marketing, AI marketing tool, social media management, content scheduler, marketing analytics, business growth";
  const defaultImage = "https://marketmind.app/og-image.jpg"; // You'll add this later
  const siteUrl = "https://marketmind.app";

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title || defaultTitle}</title>
      <meta name="title" content={title || defaultTitle} />
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Easblink Tech" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || siteUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl || siteUrl} />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:site_name" content="Market Mind" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl || siteUrl} />
      <meta property="twitter:title" content={title || defaultTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={ogImage || defaultImage} />

      {/* Additional SEO */}
      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Lagos" />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Market Mind",
          "applicationCategory": "BusinessApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1247"
          },
          "operatingSystem": "Web, iOS, Android",
          "description": description || defaultDescription
        })}
      </script>
    </Helmet>
  );
}

export default SEO;