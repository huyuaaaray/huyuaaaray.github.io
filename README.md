# huyuaaaray.github.io

Personal site of Yu Hu, served by GitHub Pages from the `main` branch.
Plain HTML and CSS with no build step and no external data source, so it keeps
working as is.

## Where things are

| To change | Edit |
| --- | --- |
| Bio, news, contact | `index.html` |
| CV page | `cv/index.html` |
| Downloadable CV | replace `resume.pdf` (keep the file name) |
| Profile photo | add `images/profile.jpg` (square works best); the initials show until then |
| Colors, fonts, layout, dark mode | `assets/site.css` |
| Share card image | `images/og-card.png` (1200 × 630) |
| Header icon | `images/header-icon.png` |
| Old links (e.g. `/CV.pdf`) | the `moved` list at the top of `404.html` |

## Adding a news item

In `index.html`, find the `<ol class="news">` list and copy one `<li>` block to
the top. Keep newest first:

```html
<li>
  <time datetime="2026-11">Nov 2026</time>
  <p>What happened, in one sentence.</p>
</li>
```

## Visitor stats

Uses GoatCounter (free for personal sites, no cookies). Sign up at
https://www.goatcounter.com with the code `huyuaaaray`; stats then appear at
https://huyuaaaray.goatcounter.com. If you pick a different code, update the
`data-goatcounter` URL in `index.html` and `cv/index.html`.

## Preview locally (optional)

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
