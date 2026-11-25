# Tap Kuol — Personal Website

A fast, static personal site (no build step) for GitHub Pages. It has light/dark mode, a mobile menu, scroll animations, a tours map, filters, a contact form, a printable CV and a Notes blog.

## Pages

| File | What it shows |
| --- | --- |
| `index.html` | Hero, logo strip, what I do, featured projects, education/experience, tours, testimonials, contact form |
| `about.html` | Story, optional intro video, experience timeline, skills |
| `education.html` | Degrees, certifications, achievements |
| `projects.html` | Filterable project cards with expandable case studies |
| `tours.html` | Filterable tour cards, one photo per trip (linked from Home, About and the footer) |
| `notes.html` | Blog / notes list |
| `notes-welcome.html` | Template for a single note (copy it for each new post) |
| `cv.html` | One-page CV in the site's style, with a **Save as PDF** button |
| `404.html` | Custom "page not found" page |

Shared styles are in `css/style.css`. Behaviour and settings are in `js/main.js`.

## Make it yours — checklist

### 1. Replace the placeholders
Search all files for these placeholders and replace them:
- `https://tap-kuol.github.io` → your real site address (it appears in the meta tags, `sitemap.xml`, `robots.txt` and the JSON-LD in `index.html`)
- `tapkuol34@gmail.com`, `yourusername` (GitHub / LinkedIn)
- `University Name`, `School Name`, `Company Name`, `Conference Name`, `20XX`, `Full Name`
- `Project One…Four`, `Destination One…Six`, `Country A…E`, `Certification Name`

### 2. Photos (biggest impact)
- **Portrait:** replace `images/portrait-executive.jpg` (4:5 shape, used on Home and About).
- **Projects and tours:** put `<img src="images/….webp" alt="…" loading="lazy">` as the first child of `.project-media` or `.tour-media`.
- **Robotic car photo and video:** the card currently shows an animated illustration, `images/robotic-car.svg`. To use a real photo, save it as `images/robotic-car.jpg` and change `data-photo` to that file in `index.html` and `projects.html`. For a video, save `images/robotic-car.mp4`. The photo fills the card, and a **Watch video** button appears for the video. Both open full-screen when clicked. To use YouTube instead, put the YouTube link in the card's `data-video` (in `index.html` and `projects.html`). Any other project card can use the same `data-photo` / `data-video` attributes.
- **Screen recordings (CardoO work):** save a short, muted clip as `images/projects/cardoo-demo.mp4` (blur any customer data and ask your manager first). A **Watch video** button appears on that card automatically.
- **Logos:** in the logo strip, use `<li><img src="images/logos/name.svg" alt="Name"></li>`.
- **Testimonials:** put an `<img>` inside `.avatar`.
- **Keep it fast:** convert photos to WebP at about 1600px wide, under 200 KB each. https://squoosh.app does this for free.

### 3. Tours map
Each tour card has `data-lat` / `data-lng`, which place its pin on the map. To get the numbers, right-click a place in Google Maps and copy the coordinates. `data-category`, `data-country` and `data-year` drive the filters and the stats row.

### 4. Contact form
1. Create a free form at https://formspree.io.
2. In `index.html`, replace `YOUR_FORM_ID` in the form's `action`.

Until then, the form opens the visitor's email app with their message already filled in.

### 5. Intro video (optional)
In `about.html`, set `data-video-src` to a YouTube link or a file such as `images/intro.mp4`. The section stays hidden while it's empty.

### 6. Analytics (optional, privacy-friendly)
1. Sign up at https://www.goatcounter.com.
2. At the top of `js/main.js`, set `goatcounter: 'yourcode'`.

### 7. CV
Edit `cv.html`, open it in a browser and click **Save as PDF**. In the print dialog, choose "Save as PDF" and turn off headers and footers.

### 8. Notes
1. Copy `notes-welcome.html` to a new file name and edit it.
2. Add a card for it in `notes.html`.
3. Add a `<url>` line for it in `sitemap.xml`.

### 9. Social share image
`images/og-image.png` (1200×630) is shown when the site is shared on LinkedIn, WhatsApp, X and similar. Replace it with your own if you like, for example one that includes your photo.

## Publish on GitHub Pages

1. Push this folder to a repository named `Tap-Kuol.github.io` (under your Tap-Kuol account). Leave out the `.claude/` folder; it's only used for local preview.
2. Go to **Settings → Pages** → Source: **Deploy from a branch** → branch **main**, folder **/ (root)**.
3. Your site will be live at `https://tap-kuol.github.io`.

### Custom domain (recommended)
1. Buy a domain such as `tapkuol.com` from a registrar (Namecheap, Cloudflare, Porkbun, …).
2. Go to **Settings → Pages → Custom domain**, enter the domain and save. GitHub adds a `CNAME` file for you.
3. At your registrar, add DNS records:
   - `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`
   - a `CNAME` record for `www` pointing to `tap-kuol.github.io`
4. Tick **Enforce HTTPS** once it's available.
5. Replace `https://tap-kuol.github.io` with `https://tapkuol.com` across the site.
6. Optional: set up a matching email address (for example with Zoho Mail, Google Workspace, or Cloudflare Email Routing for forwarding).

### Get found on Google
1. Add your site at https://search.google.com/search-console.
2. Submit `sitemap.xml`.
3. Use the same photo, headline and bio on LinkedIn, GitHub and the site.
