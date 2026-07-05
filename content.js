// LinkedIn Job Filter - content script

(function () {
  const HIDDEN_CLASS = 'ljf-hidden';

  let excludeKeywords = [];
  let filterEnabled   = true;
  let currentHidden   = 0;
  let currentTotal    = 0;

  function loadSettings(callback) {
    try {
      chrome.storage.sync.get({ excludeKeywords: [], ljfEnabled: true }, (data) => {
        if (chrome.runtime.lastError) return;
        excludeKeywords = (data.excludeKeywords || [])
          .map((k) => String(k).toLowerCase().trim())
          .filter(Boolean);
        filterEnabled = (data.ljfEnabled !== false);
        if (callback) callback();
      });
    } catch (_) { /* extension context invalidated */ }
  }

  function getHideTarget(card) {
    const ck = card.getAttribute('componentkey');
    if (!ck) return card;
    let el = card;
    for (let i = 0; i < 5 && el.parentElement; i++) {
      if (el.parentElement.getAttribute('componentkey') === ck) {
        el = el.parentElement;
      } else {
        break;
      }
    }
    return el;
  }

  function getJobCards() {
    const results = [];
    const seen    = new WeakSet();

    document.querySelectorAll('div[role="listitem"][componentkey]').forEach((node) => {
      if (seen.has(node)) return;
      seen.add(node);
      results.push(node);
    });

    const FALLBACK = [
      'li.jobs-search-results__list-item',
      'li.scaffold-layout__list-item',
      'div.job-card-container',
      'li[data-occludable-job-id]',
      'li.reusable-search__result-container',
      'div[data-chameleon-result-urn]',
      'div.entity-result__item',
      'div.feed-shared-update-v2',
      'div.occludable-update',
      'ul.reusable-search__entity-result-list > li',
      'div.scaffold-finite-scroll__content > ul > li',
    ];

    for (const sel of FALLBACK) {
      document.querySelectorAll(sel).forEach((node) => {
        if (seen.has(node)) return;
        if (results.some((c) => c.contains(node) || node.contains(c))) return;
        seen.add(node);
        results.push(node);
      });
    }

    return results;
  }

  function cardMatchesKeyword(card) {
    if (!excludeKeywords.length) return false;
    const text = (card.textContent || '').toLowerCase();
    return excludeKeywords.some((kw) => kw && text.includes(kw));
  }

  function filterJobs() {
    const cards  = getJobCards();
    let   hidden = 0;

    cards.forEach((card) => {
      const target  = getHideTarget(card);
      const matches = filterEnabled && cardMatchesKeyword(card);
      target.classList.toggle(HIDDEN_CLASS, matches);
      if (matches) hidden++;
    });

    // Store in module-level vars; popup reads these via message passing
    // (not chrome.storage.local) so the count is always per-tab and live.
    currentHidden = hidden;
    currentTotal  = cards.length;
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  const debouncedFilter = debounce(filterJobs, 300);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.excludeKeywords || changes.ljfEnabled) {
      loadSettings(filterJobs);
    }
  });

  // Popup requests a live count from this tab's content script directly.
  // This avoids the global chrome.storage.local counter being overwritten
  // by other tabs or stale between SPA navigations.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'getCount') {
      filterJobs(); // run a fresh pass so count is accurate right now
      sendResponse({ hidden: currentHidden, total: currentTotal });
    }
    return true; // keep channel open for async sendResponse
  });

  loadSettings(() => {
    filterJobs();
    new MutationObserver(debouncedFilter).observe(document.body, { childList: true, subtree: true });
    setInterval(filterJobs, 2000);

    // ── SPA navigation detection ───────────────────────────────────────────
    // LinkedIn is a React SPA — page transitions use the History API instead
    // of full page loads, so the content script stays alive across navigations.
    // We patch pushState/replaceState and listen to popstate so we can:
    //   1. Reset counters to 0 immediately (popup won't show the old page's count)
    //   2. Re-run filterJobs after a short delay so React has time to render
    //      the new page's cards before we scan them.
    let lastUrl = location.href;

    function onNavigate() {
      if (location.href === lastUrl) return; // same URL, ignore (e.g. hash-only change)
      lastUrl = location.href;
      currentHidden = 0;    // reset immediately so popup shows 0 while new page loads
      currentTotal  = 0;
      setTimeout(filterJobs, 600); // re-scan after React renders new content
    }

    const origPush    = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState    = (...args) => { origPush(...args);    onNavigate(); };
    history.replaceState = (...args) => { origReplace(...args); onNavigate(); };

    window.addEventListener('popstate', onNavigate);
  });
})();

