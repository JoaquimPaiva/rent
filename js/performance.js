// Performance Optimizations v2 - Improved with cross-browser support and additional optimizations
class PerformanceOptimizer {
  constructor() {
    this.intersectionObserver = null;
    this.virtualScrollers = new Map();
    this.lazyLoadedImages = new Set();
    this.debounceTimers = new Map();
    this.rafCallbacks = new Map();
    this.animationFrameId = null;
    this.lastScrollTime = 0;
    this.isScrolling = false;
    
    this.init();
  }

  init() {
    try {
      // Check for browser support before initializing features
      if (this.supportsPerformanceFeatures()) {
        this.setupIntersectionObserver();
        this.setupLazyLoading();
        this.setupVirtualScrolling();
        this.setupDebouncing();
        this.setupImageOptimization();
        this.setupBundleSplitting();
        this.setupPerformanceMonitoring();
        this.setupSmoothScrolling();
        this.setupRequestAnimationFrame();
        this.setupCriticalCSS();
        this.setupConnectionAwareLoading();
      }
    } catch (error) {
      console.warn('Error initializing performance optimizations:', error);
    }
  }

  supportsPerformanceFeatures() {
    return (
      'IntersectionObserver' in window &&
      'requestAnimationFrame' in window &&
      'PerformanceObserver' in window
    );
  }

  // Improved IntersectionObserver with better fallback
  setupIntersectionObserver() {
    try {
      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadLazyElement(entry.target);
              this.intersectionObserver.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: '50px',
          threshold: 0.1
        });
      } else {
        this.fallbackLazyLoad();
      }
    } catch (error) {
      console.warn('Error setting up IntersectionObserver:', error);
      this.fallbackLazyLoad();
    }
  }

  fallbackLazyLoad() {
    // Basic lazy load for browsers without IntersectionObserver
    const lazyElements = [...document.querySelectorAll('[data-src], [data-lazy-component]')];
    
    const lazyLoad = () => {
      lazyElements.forEach((el, index) => {
        if (this.isElementInViewport(el)) {
          this.loadLazyElement(el);
          lazyElements.splice(index, 1);
        }
      });
      
      if (lazyElements.length > 0) {
        requestAnimationFrame(lazyLoad);
      }
    };
    
    // Initial check + check on scroll
    lazyLoad();
    window.addEventListener('scroll', lazyLoad, { passive: true });
  }

  isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0 &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.right >= 0
    );
  }

  // Improved Lazy Loading with WebP detection
  setupLazyLoading() {
    try {
      const lazyImages = document.querySelectorAll('img[data-src]');
      const lazyComponents = document.querySelectorAll('[data-lazy-component]');
      
      if (this.intersectionObserver) {
        lazyImages.forEach(img => this.intersectionObserver.observe(img));
        lazyComponents.forEach(comp => this.intersectionObserver.observe(comp));
      }
    } catch (error) {
      console.warn('Error setting up lazy loading:', error);
    }
  }

  loadLazyElement(element) {
    try {
      if (element.tagName === 'IMG' && element.dataset.src) {
        // Use WebP if supported
        const src = this.supportsWebP() && element.dataset.webp 
          ? element.dataset.webp 
          : element.dataset.src;
        
        element.src = src;
        element.classList.remove('lazy');
        this.lazyLoadedImages.add(element);
        
        // Preload next image
        this.preloadNextImage(element);
      } else if (element.dataset.lazyComponent) {
        this.loadComponent(element);
      }
    } catch (error) {
      console.warn('Error loading lazy element:', error);
    }
  }

  // Improved WebP detection with caching
  supportsWebP() {
    if (typeof this._webpSupport !== 'undefined') {
      return this._webpSupport;
    }
    
    try {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        canvas.width = 1;
        canvas.height = 1;
        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
      }
      return false;
    } catch (error) {
      console.warn('Error checking WebP support:', error);
      return false;
    }
  }

  // Improved Virtual Scrolling with resize observer
  setupVirtualScrolling() {
    try {
      const virtualLists = document.querySelectorAll('[data-virtual-scroll]');
      virtualLists.forEach(list => {
        this.createVirtualScroller(list);
      });
      
      // Add ResizeObserver for containers if supported
      if ('ResizeObserver' in window) {
        this.virtualScrollers.forEach((scroller, container) => {
          const observer = new ResizeObserver(() => {
            scroller.updateViewport();
            scroller.render();
          });
          observer.observe(container);
        });
      }
    } catch (error) {
      console.warn('Error setting up virtual scrolling:', error);
    }
  }

  // Improved Performance Monitoring with feature detection
  setupPerformanceMonitoring() {
    try {
      if ('PerformanceObserver' in window) {
        // Check for supported entryTypes
        const supportedEntryTypes = PerformanceObserver.supportedEntryTypes || [];
        
        if (supportedEntryTypes.includes('largest-contentful-paint')) {
          this.monitorLCP();
        }
        
        if (supportedEntryTypes.includes('first-input')) {
          this.monitorFID();
        }
        
        if (supportedEntryTypes.includes('layout-shift')) {
          this.monitorCLS();
        }
        
        if (supportedEntryTypes.includes('longtask')) {
          this.monitorLongTasks();
        }
      }
      
      this.monitorMemoryUsage();
    } catch (error) {
      console.warn('Error setting up performance monitoring:', error);
    }
  }

  monitorLCP() {
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('Error monitoring LCP:', error);
    }
  }

  monitorFID() {
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      }).observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('Error monitoring FID:', error);
    }
  }

  monitorCLS() {
    try {
      let cls = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
            console.log('CLS:', cls);
          }
        });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('Error monitoring CLS:', error);
    }
  }

  // New: Smooth Scrolling Implementation
  setupSmoothScrolling() {
    try {
      // Smooth scroll for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            this.scrollToElement(target, 800);
          }
        });
      });
    } catch (error) {
      console.warn('Error setting up smooth scrolling:', error);
    }
  }

  scrollToElement(element, duration = 600) {
    const start = window.pageYOffset;
    const target = element.getBoundingClientRect().top + start;
    const distance = target - start;
    let startTime = null;
    
    const animation = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, start, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };
    
    requestAnimationFrame(animation);
  }

  easeInOutQuad(t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t + b;
    t--;
    return -c/2 * (t*(t-2) - 1) + b;
  }

  // New: Request Animation Frame optimization
  setupRequestAnimationFrame() {
    this.animationFrameId = requestAnimationFrame(this.processRafCallbacks.bind(this));
  }

  addRafCallback(id, callback) {
    this.rafCallbacks.set(id, callback);
  }

  removeRafCallback(id) {
    this.rafCallbacks.delete(id);
  }

  processRafCallbacks() {
    this.rafCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in RAF callback:', error);
      }
    });
    this.animationFrameId = requestAnimationFrame(this.processRafCallbacks.bind(this));
  }

  // New: Critical CSS inlining
  setupCriticalCSS() {
    try {
      const criticalStyles = document.querySelectorAll('style[critical]');
      criticalStyles.forEach(style => {
        document.head.insertBefore(style, document.head.firstChild);
      });
    } catch (error) {
      console.warn('Error setting up critical CSS:', error);
    }
  }

  // New: Connection-aware loading
  setupConnectionAwareLoading() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        // Reduce quality for slow connections
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.enableLowQualityMode();
        }
        
        // Listen for connection changes
        connection.addEventListener('change', () => {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            this.enableLowQualityMode();
          } else {
            this.disableLowQualityMode();
          }
        });
      }
    } catch (error) {
      console.warn('Error setting up connection-aware loading:', error);
    }
  }

  enableLowQualityMode() {
    document.documentElement.classList.add('low-quality');
    // Replace images with low quality versions if available
    document.querySelectorAll('img[data-lowsrc]').forEach(img => {
      img.src = img.dataset.lowsrc;
    });
  }

  disableLowQualityMode() {
    document.documentElement.classList.remove('low-quality');
    // Restore original images
    document.querySelectorAll('img[data-lowsrc]').forEach(img => {
      if (img.dataset.src && !this.lazyLoadedImages.has(img)) {
        img.src = img.dataset.src;
      }
    });
  }

  // Improved cleanup
  destroy() {
    try {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
      }
      
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();
      
      this.virtualScrollers.clear();
      
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      // Remove all event listeners
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('resize', this.handleResize);
    } catch (error) {
      console.warn('Error destroying optimizer:', error);
    }
  }
}

// Initialize with feature detection
document.addEventListener('DOMContentLoaded', () => {
  try {
    if ('requestIdleCallback' in window) {
      // Wait for idle time to initialize non-critical optimizations
      window.requestIdleCallback(() => {
        window.performanceOptimizer = new PerformanceOptimizer();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      window.performanceOptimizer = new PerformanceOptimizer();
    }
  } catch (error) {
    console.warn('Error initializing performance optimizer:', error);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  try {
    if (window.performanceOptimizer) {
      window.performanceOptimizer.destroy();
    }
  } catch (error) {
    console.warn('Error cleaning up optimizer:', error);
  }
});