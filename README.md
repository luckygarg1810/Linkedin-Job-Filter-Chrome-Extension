# LinkedIn Job Filter - Exclude Keywords

A small Chrome extension that hides LinkedIn job postings containing keywords
you choose (e.g. "urgent", "atos", or any term commonly used in spammy /
fraudulent listings you've noticed).

## How it works

- A content script scans job/post cards on `linkedin.com/jobs/*` pages **and**
  `linkedin.com/search/results/*` pages (this covers the "Posts" search tab,
  where a lot of hiring posts show up, in addition to the dedicated Jobs
  search).
- If a card's visible text contains any of your excluded keywords
  (case-insensitive), the card is hidden with `display: none`.
- It re-scans automatically as you scroll (infinite scroll) and as LinkedIn
  loads new results, using a MutationObserver plus a periodic re-check.
- Keywords are stored with `chrome.storage.sync`, so they carry over between
  your Chrome sessions (and across devices if you're signed into Chrome sync).

## Installing it (it's unpacked, not on the Chrome Web Store)

1. Download and unzip this folder somewhere on your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `linkedin-job-filter` folder.
5. The extension icon will appear in your toolbar.

## Using it

1. Click the extension icon.
2. Type a keyword (e.g. `urgent`) and click **Add**, or press Enter.
3. Go to `linkedin.com/jobs/search` and search as usual — matching posts will
   disappear from the list.
4. Click the extension icon again any time to see how many jobs were hidden
   on the current page, or to remove a keyword.

## Notes and limitations

- **LinkedIn changes its page structure periodically.** This extension looks
  for job cards using several known selectors as fallbacks
  (`content.js` → `CARD_SELECTORS`). If a LinkedIn redesign breaks filtering,
  the selectors may need updating — inspect a job card element in DevTools
  and add its class/attribute to that list.
- Matching is a simple case-insensitive substring match against the full
  visible text of each job card (title, company, location, snippet). It's
  intentionally simple and transparent — you can see exactly why a post was
  hidden by checking whether it contains your keyword anywhere in that text.
- Hidden posts are not deleted or reported anywhere — they're just hidden in
  your browser, and only while this extension is enabled.
- This only runs on `linkedin.com/jobs/*` pages and only reads page content
  locally; it doesn't send any data anywhere.
