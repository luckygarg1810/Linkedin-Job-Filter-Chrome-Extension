const input       = document.getElementById('keywordInput');
const addBtn      = document.getElementById('addBtn');
const list        = document.getElementById('keywordList');
const emptyMsg    = document.getElementById('emptyMsg');
const countEl     = document.getElementById('hiddenCount');
const toggle      = document.getElementById('enabledToggle');
const toggleLabel = document.getElementById('toggleLabel');
const mainContent = document.getElementById('mainContent');

// ── Toggle ────────────────────────────────────────────────────────────────────

function applyEnabledUI(enabled) {
  toggle.checked = enabled;
  toggleLabel.textContent = enabled ? 'ON' : 'OFF';
  mainContent.classList.toggle('disabled', !enabled);
}

function loadEnabled() {
  chrome.storage.sync.get({ ljfEnabled: true }, (data) => {
    const enabled = (data.ljfEnabled !== false);
    applyEnabledUI(enabled);
    // Always write back to ensure content script stays in sync
    chrome.storage.sync.set({ ljfEnabled: enabled });
  });
}

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  applyEnabledUI(enabled);
  chrome.storage.sync.set({ ljfEnabled: enabled });
});

// ── Keywords ──────────────────────────────────────────────────────────────────

function render(keywords) {
  list.innerHTML = '';
  emptyMsg.style.display = keywords.length ? 'none' : 'block';
  keywords.forEach((kw, i) => {
    const li   = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = kw;
    const del = document.createElement('button');
    del.textContent = '\u00D7';
    del.className = 'del-btn';
    del.title = 'Remove';
    del.onclick = () => {
      const updated = keywords.slice();
      updated.splice(i, 1);
      chrome.storage.sync.set({ excludeKeywords: updated }, () => render(updated));
    };
    li.appendChild(span);
    li.appendChild(del);
    list.appendChild(li);
  });
}

function loadKeywords() {
  chrome.storage.sync.get({ excludeKeywords: [] }, (data) => {
    render(data.excludeKeywords);
  });
}

function loadCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      countEl.textContent = 'Open a LinkedIn search or jobs page to see stats.';
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, { type: 'getCount' }, (resp) => {
      if (chrome.runtime.lastError || !resp) {
        // Content script not injected on this tab (e.g. not a LinkedIn search page)
        countEl.textContent = 'Open a LinkedIn search or jobs page to see stats.';
        return;
      }
      if (resp.total === 0) {
        countEl.textContent = 'No post cards detected on this page yet.';
      } else {
        countEl.textContent = `${resp.hidden} of ${resp.total} posts hidden on this page`;
      }
    });
  });
}

function addKeyword() {
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  chrome.storage.sync.get({ excludeKeywords: [] }, (data) => {
    const keywords = data.excludeKeywords;
    if (!keywords.includes(val)) {
      keywords.push(val);
      chrome.storage.sync.set({ excludeKeywords: keywords }, () => {
        input.value = '';
        render(keywords);
      });
    } else {
      input.value = '';
    }
  });
}

addBtn.addEventListener('click', addKeyword);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addKeyword();
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadEnabled();
loadKeywords();
loadCount();
