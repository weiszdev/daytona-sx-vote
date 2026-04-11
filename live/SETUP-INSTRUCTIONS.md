# RevMX LIVE Page — WordPress Setup Instructions

## What This Does
The LIVE page at revmx.com/live automatically pulls content from GitHub. When we push updates to GitHub, the website updates automatically. No WordPress editing needed after this one-time setup.

## Steps (5 minutes)

1. **Log into WordPress** — go to revmx.com/wp-admin

2. **Create a new page**
   - Go to **Pages > Add New**
   - Title: `LIVE`
   - In the URL/permalink settings, make sure the slug is `live` (so the URL is revmx.com/live)

3. **Add a Custom HTML block**
   - Click the **+** button to add a block
   - Search for **"Custom HTML"** (NOT paragraph, NOT shortcode)
   - Select Custom HTML

4. **Paste this code** into the Custom HTML block:

```html
<div id="revmx-live" style="background:#0a0a0a; padding:24px 16px; border-radius:12px; min-height:400px;">
  <p style="text-align:center; color:#666; font-family:monospace;">Loading REVMX Live...</p>
</div>
<script>
fetch('https://cdn.jsdelivr.net/gh/weiszdev/daytona-sx-vote@main/live/feed.html?' + Date.now())
  .then(function(r){ return r.text(); })
  .then(function(html){ document.getElementById('revmx-live').innerHTML = html; })
  .catch(function(){ document.getElementById('revmx-live').innerHTML = '<p style="color:#ff4400; text-align:center;">Check back soon</p>'; });
</script>
```

5. **Page settings** (right sidebar)
   - Template: Full Width (if available in theme) — no sidebar looks best
   - If theme has a "blank" or "no header" template, even better for the dark design

6. **Publish** the page

7. **Verify** — go to revmx.com/live in a browser. You should see the Nashville SX countdown and stories with the red/dark REVMX design.

## Troubleshooting

- **Blank page / "Loading..." stays**: WordPress might be stripping the `<script>` tag. Install the plugin **"WPCode"** (free), create a new snippet with the code above, and use the shortcode it generates on the page instead.
- **Styling looks wrong**: Make sure you used "Custom HTML" block, not a regular paragraph block.
- **Content is old after an update**: Add `?v=2` to the end of the fetch URL to bust the CDN cache, or just wait 60 seconds.

## Important
- Do NOT edit this page again after setup — all content updates happen through GitHub
- If you see this page and it works, you're done forever
