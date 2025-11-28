function scrollToSection(section){
  document.querySelector(section).scrollIntoView({behavior:'smooth'});
}
// Load reusable header (works without backend yet)
fetch("./components/header.html")
  .then(res => res.text())
  .then(data => {
    document.querySelector("#header-import").innerHTML = data;

    // attach click to guest button (works whether we used id or .labo-user)
    const guestBtn = document.querySelector('#header-import #guestBtn') || document.querySelector('#header-import .labo-user');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        // call openGuest defined below
        openGuest();
      });
    }

    // show .labo-row-2 only on the site home (index)
    const headerRow2 = document.querySelector('#header-import .labo-row-2');
    if (headerRow2) {
      const p = (location.pathname || '').toLowerCase();
      const href = (location.href || '').toLowerCase();
      const isHome = p.endsWith('/') || p.endsWith('/index.html') || href.includes('index.html');
      headerRow2.style.display = isHome ? '' : 'none';
    }
  });

// Load auth modal HTML and ensure inline scripts run, then open it
function openGuest() {
  // if modal already present just open it
  if (document.getElementById('authModal')) {
    if (typeof openAuthModal === 'function') {
      openAuthModal();
    } else {
      document.getElementById('authModal').classList.add('open');
    }
    return;
  }

  fetch('./components/signup.html')
    .then(r => r.text())
    .then(html => {
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();

      // Move non-script nodes to body, collect script nodes to evaluate
      const scripts = [];
      while (temp.firstChild) {
        const node = temp.firstChild;
        temp.removeChild(node);
        if (node.tagName && node.tagName.toLowerCase() === 'script') {
          scripts.push(node);
        } else {
          document.body.appendChild(node);
        }
      }

      // Evaluate/append scripts so functions in signup.html become available
      scripts.forEach(s => {
        const newScript = document.createElement('script');
        if (s.src) {
          newScript.src = s.src; // external script
          newScript.async = false;
        } else {
          newScript.textContent = s.textContent; // inline script
        }
        document.body.appendChild(newScript);
      });

      // open modal if function provided, otherwise toggle class
      setTimeout(() => {
        if (typeof openAuthModal === 'function') {
          openAuthModal();
        } else {
          const m = document.getElementById('authModal');
          if (m) m.classList.add('open');
        }
      }, 30);
    })
    .catch(err => {
      console.error('Failed to load auth modal:', err);
    });
}


function closeGuest() {
  document.getElementById("guestModal").style.display = "none";
}

// small header compacting behavior when user scrolls down
(function headerCompactOnScroll(){
  const header = document.querySelector('#header-import .labo-header');
  if (!header) return;
  let lastScroll = window.scrollY || 0;
  const threshold = 90; // px scroll before compacting
  function onScroll(){
    const y = window.scrollY || 0;
    if (y > threshold && !header.classList.contains('compact')) {
      header.classList.add('compact');
    } else if (y <= threshold && header.classList.contains('compact')) {
      header.classList.remove('compact');
    }
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  // run once (in case page loads scrolled)
  onScroll();
})();

// pin labo-row-2 to top after scrolling past it (adds/removes .fixed and a placeholder to avoid layout jump)
(function pinSecondHeaderRow(){
  function init() {
    const headerContainer = document.getElementById('header-import');
    if (!headerContainer) return;
    const header = headerContainer.querySelector('.labo-header');
    const row2 = header ? header.querySelector('.labo-row-2') : null;
    if (!row2) return;

    let placeholder = null;
    let row2Top = 0;

    function calc() {
      const rect = row2.getBoundingClientRect();
      row2Top = rect.top + window.pageYOffset;
      // remove placeholder if present when recalculating
      if (placeholder && !row2.classList.contains('fixed')) {
        placeholder.remove();
        placeholder = null;
      }
    }

    function onScroll() {
      const y = window.pageYOffset || document.documentElement.scrollTop;
      if (y >= row2Top && !row2.classList.contains('fixed')) {
        // create placeholder to preserve flow
        placeholder = document.createElement('div');
        placeholder.className = 'labo-row2-placeholder';
        placeholder.style.height = `${row2.offsetHeight}px`;
        // insert placeholder directly after header so layout stays consistent
        header.parentNode.insertBefore(placeholder, header.nextSibling);
        row2.classList.add('fixed');
        // if you added an inner wrapper for centering, create it here (optional)
        if (!row2.querySelector('.labo-row-inner')) {
          const inner = document.createElement('div');
          inner.className = 'labo-row-inner';
          // move current children into inner
          while (row2.firstChild) inner.appendChild(row2.firstChild);
          row2.appendChild(inner);
        }
      } else if (y < row2Top && row2.classList.contains('fixed')) {
        row2.classList.remove('fixed');
        // remove placeholder
        if (placeholder) { placeholder.remove(); placeholder = null; }
        // unwrap inner if it was added
        const inner = row2.querySelector('.labo-row-inner');
        if (inner) {
          while (inner.firstChild) row2.appendChild(inner.firstChild);
          inner.remove();
        }
      }
    }

    // initial measurements
    calc();
    // events
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { calc(); onScroll(); }, { passive: true });
    // recalc after header HTML loads or dynamic changes
    const observer = new MutationObserver(() => { calc(); onScroll(); });
    observer.observe(header, { childList: true, subtree: true });
  }

  // run after DOM ready and after header import finishes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();