// Mobile Gestures and Interactions
class MobileGestures {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.swipeThreshold = 50;
    this.longPressThreshold = 500;
    this.longPressTimer = null;
    this.isLongPress = false;
    
    this.init();
  }

  init() {
    this.setupSwipeGestures();
    this.setupPullToRefresh();
    this.setupLongPress();
    this.setupMobileNavigation();
    this.setupKeyboardHandling();
    this.setupOrientationHandling();
  }

  setupSwipeGestures() {
    const swipeableElements = document.querySelectorAll('.swipeable, .list-item, .widget');
    
    swipeableElements.forEach(element => {
      element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    });
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.isLongPress = false;
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      this.handleLongPress(e.target);
    }, this.longPressThreshold);
  }

  handleTouchMove(e) {
    const touch = e.touches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
    
    // Cancel long press if moved
    if (Math.abs(this.touchEndX - this.touchStartX) > 10 || 
        Math.abs(this.touchEndY - this.touchStartY) > 10) {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }
    
    // Handle swipe during move
    const element = e.target.closest('.swipeable');
    if (element) {
      const deltaX = this.touchEndX - this.touchStartX;
      if (Math.abs(deltaX) > 20) {
        element.classList.add('swiping');
        const transform = Math.max(-100, Math.min(100, deltaX));
        element.querySelector('.swipe-content').style.transform = `translateX(${transform}px)`;
      }
    }
  }

  handleTouchEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) {
        this.handleSwipeRight(e.target);
      } else {
        this.handleSwipeLeft(e.target);
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.swipeThreshold) {
      if (deltaY > 0) {
        this.handleSwipeDown(e.target);
      } else {
        this.handleSwipeUp(e.target);
      }
    }
    
    // Reset swipe state
    const element = e.target.closest('.swipeable');
    if (element) {
      element.classList.remove('swiping');
      element.querySelector('.swipe-content').style.transform = '';
    }
  }

  handleSwipeLeft(element) {
    const widget = element.closest('.widget');
    if (widget) {
      // Show widget actions
      this.showWidgetActions(widget);
    }
    
    const listItem = element.closest('.list-item');
    if (listItem) {
      // Show item actions
      this.showItemActions(listItem);
    }
  }

  handleSwipeRight(element) {
    const widget = element.closest('.widget');
    if (widget) {
      // Hide widget actions
      this.hideWidgetActions(widget);
    }
    
    const listItem = element.closest('.list-item');
    if (listItem) {
      // Hide item actions
      this.hideItemActions(listItem);
    }
  }

  handleSwipeUp(element) {
    // Navigate to next page or scroll up
    }

  handleSwipeDown(element) {
    // Navigate to previous page or scroll down
    }

  handleLongPress(element) {
    // Show context menu or selection mode
    this.showContextMenu(element);
  }

  showWidgetActions(widget) {
    // Create or show action buttons
    let actions = widget.querySelector('.widget-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'widget-actions';
      actions.innerHTML = `
        <button class="action-btn minimize" title="Minimizar">−</button>
        <button class="action-btn remove" title="Remover">×</button>
      `;
      widget.appendChild(actions);
    }
    actions.style.display = 'flex';
  }

  hideWidgetActions(widget) {
    const actions = widget.querySelector('.widget-actions');
    if (actions) {
      actions.style.display = 'none';
    }
  }

  showItemActions(listItem) {
    // Create or show item action buttons
    let actions = listItem.querySelector('.item-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'item-actions';
      actions.innerHTML = `
        <button class="action-btn edit" title="Editar">✏️</button>
        <button class="action-btn delete" title="Eliminar">🗑️</button>
      `;
      listItem.appendChild(actions);
    }
    actions.style.display = 'flex';
  }

  hideItemActions(listItem) {
    const actions = listItem.querySelector('.item-actions');
    if (actions) {
      actions.style.display = 'none';
    }
  }

  showContextMenu(element) {
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="edit">Editar</div>
      <div class="context-menu-item" data-action="duplicate">Duplicar</div>
      <div class="context-menu-item" data-action="delete">Eliminar</div>
    `;
    
    // Position menu
    const rect = element.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = rect.bottom + 'px';
    menu.style.zIndex = '10000';
    
    document.body.appendChild(menu);
    
    // Handle menu actions
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleContextAction(action, element);
      }
      menu.remove();
    });
    
    // Close menu on outside click
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
  }

  handleContextAction(action, element) {
    switch (action) {
      case 'edit':
        // Handle edit action
        break;
      case 'duplicate':
        // Handle duplicate action
        break;
      case 'delete':
        // Handle delete action
        if (confirm('Tem a certeza que quer eliminar este item?')) {
          element.remove();
        }
        break;
    }
  }

  setupPullToRefresh() {
    const pullToRefreshElements = document.querySelectorAll('.pull-to-refresh');
    
    pullToRefreshElements.forEach(element => {
      let startY = 0;
      let currentY = 0;
      let pullDistance = 0;
      let isPulling = false;
      
      const indicator = document.createElement('div');
      indicator.className = 'pull-to-refresh-indicator';
      element.appendChild(indicator);
      
      element.addEventListener('touchstart', (e) => {
        if (element.scrollTop === 0) {
          startY = e.touches[0].clientY;
          isPulling = true;
        }
      }, { passive: false });
      
      element.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        
        currentY = e.touches[0].clientY;
        pullDistance = currentY - startY;
        
        if (pullDistance > 0 && element.scrollTop === 0) {
          e.preventDefault();
          indicator.style.transform = `translateX(-50%) translateY(${Math.min(pullDistance / 2, 50)}px)`;
          
          if (pullDistance > 100) {
            indicator.classList.add('active');
          } else {
            indicator.classList.remove('active');
          }
        }
      }, { passive: false });
      
      element.addEventListener('touchend', () => {
        if (isPulling && pullDistance > 100) {
          // Trigger refresh
          this.handleRefresh(element);
        }
        
        // Reset
        isPulling = false;
        pullDistance = 0;
        indicator.style.transform = '';
        indicator.classList.remove('active');
      });
    });
  }

  handleRefresh(element) {
    // Show loading state
    element.classList.add('refreshing');
    
    // Simulate refresh
    setTimeout(() => {
      element.classList.remove('refreshing');
      // Trigger actual refresh logic here
      window.location.reload();
    }, 1000);
  }

  setupLongPress() {
    // Global long press detection
    document.addEventListener('touchstart', (e) => {
      const element = e.target.closest('[data-long-press]');
      if (element) {
        this.longPressTimer = setTimeout(() => {
          this.handleLongPress(element);
        }, this.longPressThreshold);
      }
    });
    
    document.addEventListener('touchend', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });
  }

  setupMobileNavigation() {
    // Handle mobile navigation active states
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navItems = document.querySelectorAll('.mobile-nav-item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href === currentPage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Add haptic feedback
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      });
    });
  }

  setupKeyboardHandling() {
    // Handle keyboard appearance on mobile
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        document.body.classList.add('keyboard-open');
        
        // Scroll to input
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
      
      input.addEventListener('blur', () => {
        document.body.classList.remove('keyboard-open');
      });
    });
  }

  setupOrientationHandling() {
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        this.handleOrientationChange();
      }, 500);
    });
    
    // Handle resize (for desktop browsers)
    window.addEventListener('resize', () => {
      this.handleOrientationChange();
    });
  }

  handleOrientationChange() {
    // Update layout for new orientation
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isLandscape) {
      document.body.classList.add('landscape');
      document.body.classList.remove('portrait');
    } else {
      document.body.classList.add('portrait');
      document.body.classList.remove('landscape');
    }
    
    // Update virtual scrollers if they exist
    if (window.performanceOptimizer) {
      window.performanceOptimizer.handleResize();
    }
    
    // Update dashboard layout if it exists
    if (window.dashboard) {
      window.dashboard.handleResize();
    }
  }

  // Utility methods
  vibrate(pattern = [50]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  showToast(message, type = 'info') {
    // Use existing notification system
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }
}

// Initialize mobile gestures
document.addEventListener('DOMContentLoaded', () => {
  window.mobileGestures = new MobileGestures();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.mobileGestures) {
    // Cleanup any timers or event listeners
  }
});
