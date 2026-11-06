# huyuaaaray.github.io

Personal site of Yu Hu, built with Jekyll and published by GitHub Pages from
the `main` branch. Push a change and the live site updates in about a minute
(watch the Actions tab for the "pages build and deployment" run).

## Editing the words: everything is in `_config.yml`

Every piece of text on the site lives in `_config.yml`, grouped by page and
annotated (in Chinese) line by line:

1. Site settings: site name, address, Google Analytics ID
2. Personal info and menu: name, email, social accounts, top-right menu
3. Home: rotating roles, the line under them, research-interest banner, About, News
4. Travel: title, intro, map hint, and all the places
5. CV: headings, summary, and every section (experience, education, publications, projects, skills, honors)
6. 404 page

Text marked "(Markdown)" accepts `*italics*`, `**bold**` and
`[links](https://...)`. Indent with spaces, never tabs. If the site stops
updating after an edit, the Actions tab shows the YAML error.

## Files that aren't text

| To change | Replace |
| --- | --- |
| Downloadable CV | `resume.pdf` (keep the file name) |
| Profile photo | `images/profile.jpg` (4:5 portrait works best) |
| Travel photos | files in `images/travel/`, referenced from `_config.yml` |
| Header gator | `images/header-icon.png` |
| Browser-tab icon | `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` |
| Share card images | `images/og-card.png`, `images/og-travel.png` (1200 × 630) |

## Look and effects

| What | Where |
| --- | --- |
| Colors, fonts, layout, hover effects, dark mode, night-sky theme | `assets/css/site.css` |
| Icon hover colors | `--c-github`, `--c-linkedin`, `--c-scholar`, `--c-email` near the top of `assets/css/site.css` |
| Home background network | `assets/js/network.js` (delete `network: true` in `index.html` to turn it off) |
| Travel starfield | `assets/js/starfield.js` (delete `theme: night` in `travel/index.html` to go back to the normal colors) |
| Typewriter text, scroll reveal, tilt, parallax, magnetic icons, spotlight, progress bar, easter egg | `assets/js/site.js` |
| Map, flight routes, country shading, photo viewer | `assets/js/travel.js` |
| Old links (e.g. `/CV.pdf`) | the `moved` list at the top of `404.html` |

Easter egg: type `gogators` on any page, or tap the header gator five times
on the home page.

## Travel notes

- Write `country` in English (`China`, `Japan`, `USA`, `UK`, ...). Visited
  countries are shaded on the map. Very small places such as Singapore or
  Hong Kong are too small for the world map to shade.
- Mark one place `home: true`; the flight routes start there.
- Coordinates: right-click the spot in Google Maps and click the numbers at
  the top of the menu to copy them.
- Keep photos under about 1 MB each (resize to around 1600 px wide).
  Videos go on YouTube or Bilibili; paste the link.
- The map uses OpenFreeMap tiles: free, no API key, no account.
  Map data © OpenStreetMap contributors.

## Google Analytics

The measurement ID is in `_config.yml` (`google_analytics`). Analytics only
loads on the live site, so local previews don't count as visits.

## Preview locally (optional)

Needs Ruby. Not required, since GitHub builds the live site by itself.

```bash
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000. Note that `jekyll serve` doesn't reload
`_config.yml`; restart it after editing that file.
