// LinkedIn Job Filter - content script

(function () {
  const HIDDEN_CLASS = 'ljf-hidden';

  let excludeKeywords = [];
  let filterEnabled   = true;

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

    try {
      chrome.storage.local.set({ ljfHiddenCount: hidden, ljfTotalCount: cards.length });
    } catch (_) {}
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

  loadSettings(() => {
    filterJobs();
    new MutationObserver(debouncedFilter).observe(document.body, { childList: true, subtree: true });
    setInterval(filterJobs, 2000);
  });
})();
