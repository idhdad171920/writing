/**
 * Interactive Novel Web App - JavaScript Utilities
 * Provides optional enhancements for smooth scrolling, reading progress, and bookmarking
 */

// Smooth scroll behavior for all internal links
document.addEventListener('DOMContentLoaded', function() {
  // Enable smooth scrolling
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Initialize reading progress tracking
  initReadingProgress();
  
  // Initialize bookmarking functionality
  initBookmarking();
});

/**
 * Reading Progress Tracking
 * Tracks how far the user has scrolled through the current page
 */
function initReadingProgress() {
  // Only track progress on section pages (not on index.html)
  const isIndexPage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname.endsWith('/');
  
  if (isIndexPage) return;
  
  // Create progress bar element
  const progressBar = document.createElement('div');
  progressBar.id = 'reading-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: var(--secondary-color, #3498db);
    z-index: 1000;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);
  
  // Update progress on scroll
  window.addEventListener('scroll', function() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    progressBar.style.width = Math.min(scrollPercentage, 100) + '%';
    
    // Save progress to localStorage
    saveReadingProgress(scrollPercentage);
  });
  
  // Restore previous reading position
  restoreReadingProgress();
}

/**
 * Save reading progress to localStorage
 */
function saveReadingProgress(percentage) {
  const currentPage = getCurrentPageKey();
  if (!currentPage) return;
  
  const progressData = {
    percentage: percentage,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(`progress_${currentPage}`, JSON.stringify(progressData));
  } catch (e) {
    console.warn('Unable to save reading progress:', e);
  }
}

/**
 * Restore reading progress from localStorage
 */
function restoreReadingProgress() {
  const currentPage = getCurrentPageKey();
  if (!currentPage) return;
  
  try {
    const savedProgress = localStorage.getItem(`progress_${currentPage}`);
    if (savedProgress) {
      const data = JSON.parse(savedProgress);
      // Only restore if saved within last 7 days
      const daysSinceLastVisit = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastVisit < 7 && data.percentage > 5) {
        // Show notification to user
        showRestorePrompt(data.percentage);
      }
    }
  } catch (e) {
    console.warn('Unable to restore reading progress:', e);
  }
}

/**
 * Show prompt to restore reading position
 */
function showRestorePrompt(percentage) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--primary-color, #2c3e50);
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    font-family: var(--font-secondary, Arial, sans-serif);
    font-size: 14px;
  `;
  
  notification.innerHTML = `
    <p style="margin: 0 0 10px 0;">Continue where you left off?</p>
    <button id="restore-yes" style="margin-right: 10px; padding: 5px 15px; cursor: pointer;">Yes</button>
    <button id="restore-no" style="padding: 5px 15px; cursor: pointer;">No</button>
  `;
  
  document.body.appendChild(notification);
  
  document.getElementById('restore-yes').addEventListener('click', function() {
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollPosition = (percentage / 100) * (documentHeight - windowHeight);
    window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    notification.remove();
  });
  
  document.getElementById('restore-no').addEventListener('click', function() {
    notification.remove();
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

/**
 * Bookmarking Functionality
 * Allows users to bookmark their current position
 */
function initBookmarking() {
  // Only on section pages
  const isIndexPage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname.endsWith('/');
  
  if (isIndexPage) return;
  
  // Create bookmark button
  const bookmarkBtn = document.createElement('button');
  bookmarkBtn.id = 'bookmark-btn';
  bookmarkBtn.innerHTML = '🔖 Bookmark';
  bookmarkBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 10px 20px;
    background: var(--secondary-color, #3498db);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: var(--font-secondary, Arial, sans-serif);
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    transition: background 0.3s ease;
  `;
  
  bookmarkBtn.addEventListener('mouseenter', function() {
    this.style.background = 'var(--button-hover, #2980b9)';
  });
  
  bookmarkBtn.addEventListener('mouseleave', function() {
    this.style.background = 'var(--secondary-color, #3498db)';
  });
  
  bookmarkBtn.addEventListener('click', function() {
    saveBookmark();
    showBookmarkConfirmation();
  });
  
  document.body.appendChild(bookmarkBtn);
  
  // Check if there's an existing bookmark
  checkExistingBookmark();
}

/**
 * Save bookmark to localStorage
 */
function saveBookmark() {
  const currentPage = getCurrentPageKey();
  if (!currentPage) return;
  
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  const bookmark = {
    page: currentPage,
    position: scrollPosition,
    timestamp: Date.now(),
    url: window.location.href
  };
  
  try {
    localStorage.setItem('novel_bookmark', JSON.stringify(bookmark));
  } catch (e) {
    console.warn('Unable to save bookmark:', e);
  }
}

/**
 * Check for existing bookmark
 */
function checkExistingBookmark() {
  try {
    const bookmark = localStorage.getItem('novel_bookmark');
    if (bookmark) {
      const data = JSON.parse(bookmark);
      const currentPage = getCurrentPageKey();
      
      // If bookmark is for current page, show restore option
      if (data.page === currentPage && data.position > 100) {
        setTimeout(() => {
          showBookmarkRestorePrompt(data.position);
        }, 1000);
      }
    }
  } catch (e) {
    console.warn('Unable to check bookmark:', e);
  }
}

/**
 * Show bookmark restore prompt
 */
function showBookmarkRestorePrompt(position) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary-color, #2c3e50);
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    font-family: var(--font-secondary, Arial, sans-serif);
    font-size: 14px;
  `;
  
  notification.innerHTML = `
    <p style="margin: 0 0 10px 0;">📖 Jump to your bookmark?</p>
    <button id="bookmark-restore-yes" style="margin-right: 10px; padding: 5px 15px; cursor: pointer;">Yes</button>
    <button id="bookmark-restore-no" style="padding: 5px 15px; cursor: pointer;">No</button>
  `;
  
  document.body.appendChild(notification);
  
  document.getElementById('bookmark-restore-yes').addEventListener('click', function() {
    window.scrollTo({ top: position, behavior: 'smooth' });
    notification.remove();
  });
  
  document.getElementById('bookmark-restore-no').addEventListener('click', function() {
    notification.remove();
  });
  
  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 8000);
}

/**
 * Show bookmark confirmation
 */
function showBookmarkConfirmation() {
  const confirmation = document.createElement('div');
  confirmation.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #27ae60;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1001;
    font-family: var(--font-secondary, Arial, sans-serif);
    font-size: 14px;
  `;
  
  confirmation.textContent = '✓ Bookmark saved!';
  document.body.appendChild(confirmation);
  
  setTimeout(() => {
    confirmation.remove();
  }, 2000);
}

/**
 * Get current page key for localStorage
 */
function getCurrentPageKey() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  return filename.replace('.html', '');
}
