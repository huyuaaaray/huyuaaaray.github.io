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
7. Effect switches (cursor tail, spotlight, ripple, hover glow, theme toggle, intro,
   letter-by-letter titles, local time and weather, name decode, network pulses, About
   highlight, photo flip, marquee, 3D globe, card-to-globe link, constellation, CV
   timeline, copy citation, 404 game) and the easter egg

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
| Home background network and its click pulses | `assets/js/network.js` (delete `network: true` in `index.html` to turn it off) |
| Travel starfield and constellation | `assets/js/starfield.js` (delete `theme: night` in `travel/index.html` to go back to the normal colors) |
| Typewriter text, scroll reveal, tilt, parallax, magnetic icons, card spotlight, progress bar, easter egg | `assets/js/site.js` |
| Cursor tail, cursor spotlight, click ripple | `assets/js/cursor-fx.js` (switch each on/off in `_config.yml` → `effects`) |
| First-visit intro, letter-by-letter titles, footer time and weather, CV timeline, copy citation | `assets/js/extras.js` (the intro's drawing is in `_includes/intro.html`; add `?intro` to any address to replay it) |
| 404 game | `assets/js/gator-run.js` |
| Hover glow | `assets/css/site.css` (search for "Hover glow"; switch in `_config.yml` → `effects`) |
| 3D globe (or the flat map when `globe: false`), routes, visited countries, photo viewer | `assets/js/travel.js` |
| Old links (e.g. `/CV.pdf`) | the `moved` list at the top of `404.html` |

Easter egg: click the big "Yu Hu" on the home page, or type `gogators` on
any page. The word, the message, and an on/off switch are in
`_config.yml` (section 7, `easter_egg`).

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
