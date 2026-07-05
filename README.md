# LinkedIn Job Filter — Exclude Keywords

A Chrome extension that hides LinkedIn posts and job listings containing
keywords you choose (e.g. "urgent", "atos", or any term commonly used in
spammy / fraudulent listings you've noticed).

## Where it works

| Page | URL pattern | What gets filtered |
|---|---|---|
| **Jobs search** | `linkedin.com/jobs/*` | Job listing cards |
| **Posts / Content search** | `linkedin.com/search/results/content/*` | Feed posts in search results |
| **General search** | `linkedin.com/search/results/*` | Any search result cards |

> This is especially useful on the **Posts** search tab (use the search bar
> and click the *Posts* filter), where a large volume of spammy hiring posts
> appear from recruiters and third-party agencies.

## How it works

- A content script scans post/job cards on every supported page.
- If a card's text contains any of your excluded keywords (case-insensitive),
  the card is hidden with `display: none`.
- Filtering runs automatically as you scroll (infinite scroll) and whenever
  LinkedIn loads new results — via a MutationObserver and a periodic re-check.
- Keywords are stored with `chrome.storage.sync`, so they carry over between
  Chrome sessions (and across devices if you use Chrome Sync).
- The **enable / disable toggle** in the popup lets you pause filtering
  instantly without removing your keyword list.

## Installation (unpacked — not on the Chrome Web Store)

1. Download or clone this repository and note the folder path.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `linkedin-job-filter` folder.
5. The extension icon will appear in your toolbar.

## Usage

1. Click the extension icon to open the popup.
2. Type a keyword (e.g. `atos`) and click **Add**, or press **Enter**.
3. Navigate to a LinkedIn search page — matching posts disappear immediately.
4. Add as many keywords as you like; each can be removed individually with **×**.
5. Use the **ON / OFF toggle** (top-right of the popup) to pause or resume
   filtering without deleting your keywords.
6. The stats bar at the bottom shows how many posts are hidden on the current
   page.

## Notes and limitations

- **LinkedIn changes its page structure periodically.** The extension uses the
  stable `componentkey` attribute (present on all React component roots) and
  `role="listitem"` to identify post cards, which is more resilient than
  class-name selectors. If a future LinkedIn redesign breaks filtering, open
  DevTools on the page, inspect a post card, and file an issue with the
  element's HTML.
- Matching is a simple **case-insensitive substring match** against the full
  text content of each card (name, headline, post body, etc.). It's
  intentionally simple — you can verify why a post is hidden by checking
  whether it contains your keyword anywhere in its text.
- Hidden posts are not deleted or reported anywhere — they are only hidden
  locally in your browser, and only while the extension is enabled.
- The extension only runs on `linkedin.com` pages and reads page content
  locally; **no data is sent anywhere**.
