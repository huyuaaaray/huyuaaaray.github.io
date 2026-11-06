# huyuaaaray.github.io

Personal site of Yu Hu, built with Jekyll and published by GitHub Pages from
the `main` branch. Push a change and the live site updates in about a minute
(watch the Actions tab for the "pages build and deployment" run).

## Where things are

All the words on the site live in three files. You rarely need to touch HTML.

| To change | Edit |
| --- | --- |
| Name, title, email, social links, Google Analytics ID | `_config.yml` |
| About text and the rotating roles under your name | `_config.yml` (`bio:` and `roles:`) |
| News on the home page | `_data/news.yml` |
| Everything on the CV page | `_data/cv.yml` |
| Places on the Travel page | `_data/travel.yml` (photos go in `images/travel/`) |
| Downloadable CV | replace `resume.pdf` (keep the file name) |
| Profile photo | replace `images/profile.jpg` (4:5 portrait works best) |
| Header gator icon | `images/header-icon.png` |
| Share card images | `images/og-card.png`, `images/og-travel.png` (1200 × 630) |
| Colors, fonts, layout, hover effects, dark mode | `assets/css/site.css` |
| Icon hover colors (GitHub, LinkedIn, Scholar, email) | `--c-github`, `--c-linkedin`, `--c-scholar`, `--c-email` at the top of `assets/css/site.css` |
| Background network on the home page | `assets/js/network.js`; delete `network: true` in `index.html` to turn it off |
| Effects (scroll reveal, tilt, parallax, roles, magnetic icons, spotlight, progress bar, easter egg) | `assets/js/site.js` |
| Map, flight routes, country shading, photo viewer | `assets/js/travel.js` |
| Old links (e.g. `/CV.pdf`) | the `moved` list at the top of `404.html` |

Easter egg: type `gogators` on any page, or tap the header gator five times
on the home page.

## Editing the CV

Open `_data/cv.yml`. Each section is a list; copy an entry and change it.
Bullets can use `*italics*`, `**bold**` and `[links](https://...)`. In
publications your name is bolded automatically.

## Adding a news item

Copy one block in `_data/news.yml` to the top and edit it. Keep newest first.

```yaml
- date: Nov 2026
  datetime: 2026-11
  text: What happened, in one sentence. *Italics* and [links](https://example.com) work.
```

## Adding a place

Copy one block in `_data/travel.yml` and edit it. Put photos in
`images/travel/`. Videos go on YouTube or Bilibili; paste the link.

```yaml
- name: Kyoto
  region: Kyoto, Japan
  country: Japan
  lat: 35.0116
  lng: 135.7681
  date: Apr 2026
  summary: One or two sentences about the trip.
  cover: /images/travel/kyoto-1.jpg
  photos:
    - src: /images/travel/kyoto-1.jpg
      caption: Fushimi Inari at sunrise
    - src: /images/travel/kyoto-2.jpg
  videos:
    - youtube: https://www.youtube.com/watch?v=VIDEO_ID
    - bilibili: https://www.bilibili.com/video/BVxxxxxxxxxx
```

Write `country` in English (for example `China`, `Japan`, `USA`, `UK`);
visited countries are shaded on the map. Very small places such as
Singapore or Hong Kong are too small for the world map to shade.

Mark your home base with `home: true` (Gainesville in the examples); the
flight routes on the map start there.

To get coordinates, right-click the spot in Google Maps and click the numbers
at the top of the menu to copy them. Keep photos under about 1 MB each
(resize to around 1600 px wide); GitHub limits single files to 100 MB.

YAML is picky about indentation: use spaces (not tabs) and line things up
like the examples. If the site stops updating after an edit, the Actions tab
shows the error.

## Map

The Travel map uses OpenFreeMap tiles, which are free and need no API key or
account. Map data © OpenStreetMap contributors.

## Google Analytics

1. At analytics.google.com, create a GA4 property and a Web data stream for
   `https://huyuaaaray.github.io`.
2. Copy the Measurement ID (starts with `G-`).
3. Paste it into `google_analytics:` in `_config.yml` and push.

Analytics only loads on the live site, so local previews don't count as visits.

## Preview locally (optional)

Needs Ruby. Not required, since GitHub builds the live site by itself.

```bash
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.
