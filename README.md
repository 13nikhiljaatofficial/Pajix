# PAJIX — GitHub Pages

Pajix is a browser-first file utility website. This version includes:

- JPG / PNG / WEBP → PDF
- PDF merge with manual ordering
- A4, Letter and image-fit page modes
- Portrait, landscape and auto orientation
- Adjustable margins
- Contain / cover image placement
- Client-side processing with PDF-Lib
- Responsive dark interface designed specifically for Pajix

## Publish on GitHub Pages

1. Upload all files in this folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Select the branch containing `index.html` and `/root`.
4. Save and wait for GitHub Pages to publish.

## Before publishing

Open `index.html` and replace:

`YOUR_EMAIL@example.com`

with the real Pajix support/contact email.

Also review `SITE-CHECKLIST.md` for branding, privacy, legal, analytics and monetization details.

## Important technical note

PDF-Lib is loaded from cdnjs. Therefore the conversion engine needs an internet connection when the page first loads. The selected files themselves are processed in the browser by this site version.
