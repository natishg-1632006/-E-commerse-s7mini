import macbookImg from '../assets/products/macbook.jpg';
import rogImg from '../assets/products/rog.jpg';
import dellImg from '../assets/products/dell.jpg';
import ssdImg from '../assets/products/samsung_t7_ssd.jpg';
import sleeveImg from '../assets/products/laptop_sleeve_leather.jpg';
import matImg from '../assets/products/premium_desk_mat.jpg';
import guideImg from '../assets/products/guide.jpg';

export const FALLBACK_PRODUCT_IMAGES = {
  macbook: macbookImg,
  rog: rogImg,
  dell: dellImg,
  ssd: ssdImg,
  sleeve: sleeveImg,
  mat: matImg,
  default: guideImg,
};

const CLOUDFRONT_DOMAIN = import.meta.env.VITE_CLOUDFRONT_DOMAIN || 'https://d2c24kno5aj17g.cloudfront.net';

/**
 * Safely extracts a valid image URL from any product, category, or item object.
 * Handles string URLs, nested object URLs ({ url: '...' }), arrays, and S3 URLs.
 */
export const getImageUrl = (item: any): string => {
  if (!item) return guideImg;

  let candidateUrl: string | null = null;

  // If item itself is a string
  if (typeof item === 'string' && item.trim() !== '') {
    candidateUrl = item.trim();
  } else if (typeof item === 'object' && item !== null) {
    // 1. Check direct properties
    if (typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      candidateUrl = item.imageUrl.trim();
    } else if (typeof item.image === 'string' && item.image.trim() !== '') {
      candidateUrl = item.image.trim();
    } else if (typeof item.url === 'string' && item.url.trim() !== '') {
      candidateUrl = item.url.trim();
    } else if (typeof item.image === 'object' && item.image !== null) {
      candidateUrl = item.image.url || item.image.imageUrl || item.image.src || item.image.location || null;
    }

    // 2. Images array (can be array of strings or array of objects)
    if (!candidateUrl && Array.isArray(item.images) && item.images.length > 0) {
      const firstImg = item.images[0];
      if (typeof firstImg === 'string' && firstImg.trim() !== '') {
        candidateUrl = firstImg.trim();
      } else if (typeof firstImg === 'object' && firstImg !== null) {
        candidateUrl = firstImg.url || firstImg.imageUrl || firstImg.src || firstImg.location || null;
      }
    }

    // 3. Stringified JSON array fallback
    if (!candidateUrl && typeof item.images === 'string') {
      try {
        const parsed = JSON.parse(item.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          candidateUrl = typeof first === 'string' ? first : first?.url || first?.imageUrl || null;
        }
      } catch (_) {}
    }
  }

  // Rewrite candidate URL to CloudFront HTTPS endpoint if applicable
  if (candidateUrl) {
    // Convert direct S3 URLs to CloudFront domain path
    if (candidateUrl.includes('s3.ap-south-2.amazonaws.com/')) {
      const parts = candidateUrl.split('s3.ap-south-2.amazonaws.com/');
      const keyPath = parts[1];
      return `${CLOUDFRONT_DOMAIN}/${keyPath}`;
    }

    if (candidateUrl.includes('s3.ap-southeast-1.amazonaws.com/')) {
      const parts = candidateUrl.split('s3.ap-southeast-1.amazonaws.com/');
      const keyPath = parts[1];
      return `${CLOUDFRONT_DOMAIN}/${keyPath}`;
    }

    if (candidateUrl.includes('s3.amazonaws.com/')) {
      const parts = candidateUrl.split('s3.amazonaws.com/');
      const keyPath = parts[1];
      return `${CLOUDFRONT_DOMAIN}/${keyPath}`;
    }

    // Relative S3 keys (e.g. products/xyz.jpg, categories/abc.jpg)
    if (candidateUrl.startsWith('products/') || candidateUrl.startsWith('categories/') || candidateUrl.startsWith('images/')) {
      return `${CLOUDFRONT_DOMAIN}/${candidateUrl}`;
    }

    if (
      candidateUrl.startsWith('http://') ||
      candidateUrl.startsWith('https://') ||
      candidateUrl.startsWith('data:') ||
      candidateUrl.startsWith('blob:') ||
      candidateUrl.startsWith('/')
    ) {
      return candidateUrl;
    }
  }

  // Fallback based on product / category name keywords
  const name = String(item.name || item.productName || item.categoryName || item.title || '').toLowerCase();
  if (name.includes('macbook') || name.includes('apple')) return macbookImg;
  if (name.includes('zephyrus') || name.includes('tuf') || name.includes('rog') || name.includes('asus')) return rogImg;
  if (name.includes('xps') || name.includes('dell') || name.includes('latitude')) return dellImg;
  if (name.includes('ssd') || name.includes('samsung') || name.includes('drive')) return ssdImg;
  if (name.includes('sleeve') || name.includes('leather') || name.includes('case')) return sleeveImg;
  if (name.includes('mat') || name.includes('desk') || name.includes('mousepad')) return matImg;

  return guideImg;
};

/**
 * Image error handler to replace broken URLs with local fallback
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = guideImg
) => {
  const target = event.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
  }
};
