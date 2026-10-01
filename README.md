# PDFNest — first version

A responsive, browser-based PDF toolkit starter with:
- JPG/JPEG/PNG to PDF
- Merge PDF files
- Reordering and removing selected files
- A4 / US Letter / fit-to-image page sizes
- Portrait / landscape orientation
- No-margin / 10 mm / 20 mm margins
- Local browser processing for these tools

## Run locally
1. Extract this ZIP.
2. Open `index.html` in a modern browser with an internet connection.
3. Try JPG to PDF or Merge PDF.

The PDF library (`pdf-lib`) is loaded from jsDelivr CDN, so an internet connection is needed for PDF processing.

## Publish with GitHub Pages
1. Create a **public** GitHub repository.
2. Upload `index.html`, `style.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Choose `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish the site. Your URL will be similar to `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

## Before public launch
- Replace the placeholder brand `PDFNest` if desired.
- Replace `hello@example.com` with a real contact email.
- Add real Privacy Policy, Terms, About, and Contact pages. The footer links are placeholders in this starter.
- Add an ad network only after checking its current site approval and policy requirements. The dashed ad area is a placeholder, not a live ad.
- Test with ordinary, scanned, and larger PDFs on desktop and mobile.

## Notes and limitations
- The current version does **not** convert DOC/DOCX to PDF.
- The current version does **not** adjust margins of an existing PDF. The margin setting applies to images when creating a new PDF.
- “Fill page (crop)” currently uses a safe fit-to-page behavior because cropping is not implemented in this first version.
- This is a starter project, not a guarantee of ad approval or income.
