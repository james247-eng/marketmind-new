// Blog.jsx
// Blog listing page with SEO

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import './Blog.css';

function Blog() {
  const navigate = useNavigate();

  // Mock blog posts - in production, fetch from CMS or API
  const blogPosts = [
    {
      id: 1,
      title: "10 Proven Strategies to Boost Your Social Media Engagement in 2024",
      excerpt: "Discover the latest tactics that top brands use to increase likes, comments, and shares. From interactive content to optimal posting times, we cover everything you need to know.",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
      category: "Social Media Tips",
      author: "Sarah Johnson",
      date: "December 15, 2024",
      readTime: "8 min read",
      slug: "boost-social-media-engagement-2024"
    },
    {
      id: 2,
      title: "The Complete Guide to AI-Powered Content Creation for Businesses",
      excerpt: "Learn how artificial intelligence is revolutionizing content marketing. Step-by-step guide to using AI tools to create engaging, authentic content that converts.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      category: "AI & Marketing",
      author: "Michael Chen",
      date: "December 10, 2024",
      readTime: "12 min read",
      slug: "ai-content-creation-guide"
    },
    {
      id: 3,
      title: "How to Build a Social Media Calendar That Actually Works",
      excerpt: "Planning is key to social media success. Get our free template and learn the exact process we use to plan 30 days of content in just 2 hours.",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
      category: "Content Strategy",
      author: "Emma Williams",
      date: "December 5, 2024",
      readTime: "10 min read",
      slug: "social-media-calendar-guide"
    },
    {
      id: 4,
      title: "Instagram Reels vs TikTok: Which Platform Should You Focus On?",
      excerpt: "A data-driven comparison of both platforms. Audience demographics, algorithm insights, and best practices to help you decide where to invest your time.",
      image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80",
      category: "Platform Analysis",
      author: "David Park",
      date: "November 28, 2024",
      readTime: "7 min read",
      slug: "instagram-reels-vs-tiktok"
    },
    {
      id: 5,
      title: "5 Analytics Metrics That Actually Matter for Your Business",
      excerpt: "Stop tracking vanity metrics. Learn which KPIs drive real business results and how to measure them effectively using your social media analytics.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      category: "Analytics",
      author: "Lisa Anderson",
      date: "November 20, 2024",
      readTime: "6 min read",
      slug: "social-media-metrics-that-matter"
    },
    {
      id: 6,
      title: "Automating Your Social Media: What to Automate and What to Keep Human",
      excerpt: "Find the perfect balance between efficiency and authenticity. Our framework for deciding which tasks to automate and which require a personal touch.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      category: "Automation",
      author: "James Wilson",
      date: "November 15, 2024",
      readTime: "9 min read",
      slug: "social-media-automation-guide"
    }
  ];

  const categories = ["All", "Social Media Tips", "AI & Marketing", "Content Strategy", "Platform Analysis", "Analytics", "Automation"];

  return (
    <>
      <SEO 
        title="Blog - Market Mind | Social Media Marketing Tips & Strategies"
        description="Expert insights on social media marketing, AI content creation, automation strategies, and analytics. Learn from industry professionals to grow your business."
        keywords="social media blog, marketing tips, AI content creation, social media strategy, Instagram tips, TikTok marketing, content calendar, social media automation"
      />

      <div className="blog-page">
        <Navbar />

        {/* Hero */}
        <section className="blog-hero">
          <div className="blog-hero-container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1>Marketing Insights & Tips</h1>
              <p>Learn the latest strategies to grow your audience and master social media marketing</p>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="blog-categories">
          <div className="blog-container">
            <div className="categories-list">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`category-btn ${index === 0 ? 'active' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="featured-post-section">
          <div className="blog-container">
            <motion.div
              className="featured-post"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="featured-image">
                <img src={blogPosts[0].image} alt={blogPosts[0].title} loading="eager" />
                <span className="featured-badge">Featured</span>
              </div>
              <div className="featured-content">
                <span className="blog-category">{blogPosts[0].category}</span>
                <h2>{blogPosts[0].title}</h2>
                <p>{blogPosts[0].excerpt}</p>
                <div className="blog-meta">
                  <div className="meta-left">
                    <span className="meta-item">
                      <Calendar size={16} />
                      {blogPosts[0].date}
                    </span>
                    <span className="meta-item">
                      <Clock size={16} />
                      {blogPosts[0].readTime}
                    </span>
                  </div>
                  <button className="read-more-btn">
                    Read Article
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="blog-grid-section">
          <div className="blog-container">
            <div className="blog-grid">
              {blogPosts.slice(1).map((post, index) => (
                <motion.article
                  key={post.id}
                  className="blog-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="blog-card-image">
                    <img src={post.image} alt={post.title} loading="lazy" />
                  </div>
                  <div className="blog-card-content">
                    <span className="blog-category">{post.category}</span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <div className="blog-card-footer">
                      <div className="blog-card-meta">
                        <span className="meta-item">
                          <Calendar size={14} />
                          {post.date}
                        </span>
                        <span className="meta-item">
                          <Clock size={14} />
                          {post.readTime}
                        </span>
                      </div>
                      <button className="read-more-link">
                        Read More
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="blog-newsletter">
          <div className="blog-container">
            <motion.div
              className="newsletter-box"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <TrendingUp size={48} className="newsletter-icon" />
              <h2>Get Weekly Marketing Tips</h2>
              <p>Join 25,000+ marketers who receive our weekly newsletter with actionable insights</p>
              <form className="newsletter-form">
                <input type="email" placeholder="Enter your email" />
                <button type="submit">Subscribe</button>
              </form>
              <span className="newsletter-privacy">No spam. Unsubscribe anytime.</span>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Blog;