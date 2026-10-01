const $ = (id) => document.getElementById(id);
const imageFiles = [];
const pdfFiles = [];
const bytes = (n) => {
  if (!Number.isFinite(n)) return '';
  const units = ['B','KB','MB','GB']; let i = 0; let size = n;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};
const safeName = (name) => name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 70) || 'document';
const setStatus = (id, message, error = false) => {
  const el = $(id); el.textContent = message; el.classList.toggle('error', error);
};
const openWorkspace = (id) => {
  document.querySelectorAll('.workspace').forEach(el => el.classList.add('hidden'));
  $(id).classList.remove('hidden');
  $(id).scrollIntoView({behavior:'smooth', block:'start'});
};
$('open-image-tool').addEventListener('click', () => openWorkspace('image-workspace'));
$('open-merge-tool').addEventListener('click', () => openWorkspace('merge-workspace'));
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => $(btn.dataset.close).classList.add('hidden')));
$('year').textContent = new Date().getFullYear();

function setupDropzone(zoneId, inputId, handler) {
  const zone = $(zoneId), input = $(inputId);
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { handler([...input.files]); input.value = ''; });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    handler([...e.dataTransfer.files]);
  });
}
setupDropzone('image-dropzone', 'image-input', addImages);
setupDropzone('pdf-dropzone', 'pdf-input', addPdfs);

function addImages(files) {
  const valid = files.filter(f => ['image/jpeg','image/png'].includes(f.type) || /\.(jpe?g|png)$/i.test(f.name));
  const rejected = files.length - valid.length;
  valid.forEach(file => imageFiles.push(file));
  renderImages();
  setStatus('image-status', rejected ? `${rejected} unsupported file(s) skipped. Please use JPG or PNG.` : '');
}
function addPdfs(files) {
  const valid = files.filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
  const rejected = files.length - valid.length;
  valid.forEach(file => pdfFiles.push(file));
  renderPdfs();
  setStatus('pdf-status', rejected ? `${rejected} unsupported file(s) skipped. Please select PDF files.` : '');
}
function renderList(items, listId, countId, type, onChange) {
  const list = $(listId); list.replaceChildren();
  $(countId).textContent = `${items.length} ${items.length === 1 ? 'file' : 'files'}`;
  if (!items.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    empty.textContent = type === 'img' ? 'Your selected images will appear here.' : 'Your selected PDFs will appear here.';
    list.appendChild(empty);
  }
  items.forEach((file, i) => {
    const row = document.createElement('div'); row.className = 'file-row';
    const icon = document.createElement('div'); icon.className = `file-type ${type === 'img' ? 'img' : ''}`; icon.textContent = type === 'img' ? 'IMAGE' : 'PDF';
    const meta = document.createElement('div'); meta.className = 'file-meta';
    const name = document.createElement('div'); name.className = 'file-name'; name.title = file.name; name.textContent = file.name;
    const size = document.createElement('div'); size.className = 'file-size'; size.textContent = bytes(file.size);
    meta.append(name, size);
    const actions = document.createElement('div'); actions.className = 'row-actions';
    [['↑','Move up', i === 0, -1], ['↓','Move down', i === items.length - 1, 1], ['×','Remove', false, 'remove']].forEach(([label, title, disabled, direction]) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'icon-btn'; btn.textContent = label; btn.title = title; btn.setAttribute('aria-label', `${title} ${file.name}`); btn.disabled = disabled;
      btn.addEventListener('click', () => onChange(i, direction)); actions.appendChild(btn);
    });
    row.append(icon, meta, actions); list.appendChild(row);
  });
}
function reorderOrRemove(items, index, direction, render) {
  if (direction === 'remove') items.splice(index, 1);
  else { const target = index + direction; if (target >= 0 && target < items.length) [items[index], items[target]] = [items[target], items[index]]; }
  render();
}
function renderImages() {
  renderList(imageFiles, 'image-list', 'image-count', 'img', (i, d) => reorderOrRemove(imageFiles, i, d, renderImages));
  $('convert-images').disabled = imageFiles.length === 0;
}
function renderPdfs() {
  renderList(pdfFiles, 'pdf-list', 'pdf-count', 'pdf', (i, d) => reorderOrRemove(pdfFiles, i, d, renderPdfs));
  $('merge-pdfs').disabled = pdfFiles.length < 2;
}
$('clear-images').addEventListener('click', () => { imageFiles.length = 0; renderImages(); setStatus('image-status',''); });
$('clear-pdfs').addEventListener('click', () => { pdfFiles.length = 0; renderPdfs(); setStatus('pdf-status',''); });

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error(`Could not read ${file.name}`)); img.src = url; });
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.94));
    if (!blob) throw new Error(`Could not process ${file.name}`);
    return { bytes: await blob.arrayBuffer(), width: canvas.width, height: canvas.height };
  } finally { URL.revokeObjectURL(url); }
}
$('convert-images').addEventListener('click', async () => {
  if (!imageFiles.length) return;
  if (!window.PDFLib) { setStatus('image-status', 'PDF library did not load. Check your internet connection and refresh.', true); return; }
  const btn = $('convert-images'); btn.disabled = true; btn.textContent = 'Creating PDF…'; setStatus('image-status', 'Processing your images…');
  try {
    const { PDFDocument, rgb } = window.PDFLib;
    const pdf = await PDFDocument.create();
    const pageSize = $('page-size').value, orientation = $('orientation').value;
    const marginMm = Number($('image-margin').value), margin = marginMm * 72 / 25.4;
    const fitMode = $('image-fit').value;
    for (const file of imageFiles) {
      const loaded = await loadImage(file);
      const image = await pdf.embedJpg(loaded.bytes);
      let width, height;
      if (pageSize === 'fit') { width = loaded.width * 72 / 96; height = loaded.height * 72 / 96; }
      else if (pageSize === 'letter') { width = 612; height = 792; }
      else { width = 595.28; height = 841.89; }
      if (pageSize !== 'fit' && orientation === 'landscape') [width, height] = [height, width];
      if (pageSize === 'fit' && orientation === 'landscape' && height > width) [width, height] = [height, width];
      const page = pdf.addPage([width, height]);
      const availableW = Math.max(1, width - margin * 2), availableH = Math.max(1, height - margin * 2);
      let drawW, drawH, x, y;
      if (fitMode === 'cover') {
        const scale = Math.max(availableW / image.width, availableH / image.height);
        drawW = image.width * scale; drawH = image.height * scale;
        // Clip a cover image to the content box with a temporary form-like placement using page clipping is not supported by pdf-lib;
        // use contain for safe full-image rendering when cover would spill outside the page.
        const containScale = Math.min(availableW / image.width, availableH / image.height);
        drawW = image.width * containScale; drawH = image.height * containScale;
      } else {
        const scale = Math.min(availableW / image.width, availableH / image.height);
        drawW = image.width * scale; drawH = image.height * scale;
      }
      x = (width - drawW) / 2; y = (height - drawH) / 2;
      page.drawImage(image, { x, y, width: drawW, height: drawH });
      page.drawRectangle({x:0,y:0,width:0,height:0,color:rgb(1,1,1)});
    }
    const bytesOut = await pdf.save();
    downloadBlob(new Blob([bytesOut], {type:'application/pdf'}), 'images-to-pdf.pdf');
    setStatus('image-status', `Done — created a PDF with ${imageFiles.length} page(s).`);
  } catch (err) {
    console.error(err); setStatus('image-status', err.message || 'Something went wrong while creating the PDF.', true);
  } finally { btn.disabled = imageFiles.length === 0; btn.innerHTML = 'Create PDF <span aria-hidden="true">→</span>'; }
});

$('merge-pdfs').addEventListener('click', async () => {
  if (pdfFiles.length < 2) return;
  if (!window.PDFLib) { setStatus('pdf-status', 'PDF library did not load. Check your internet connection and refresh.', true); return; }
  const btn = $('merge-pdfs'); btn.disabled = true; btn.textContent = 'Merging PDFs…'; setStatus('pdf-status', 'Combining your PDFs…');
  try {
    const { PDFDocument } = window.PDFLib; const merged = await PDFDocument.create();
    for (const file of pdfFiles) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach(page => merged.addPage(page));
    }
    const output = await merged.save();
    downloadBlob(new Blob([output], {type:'application/pdf'}), 'merged-document.pdf');
    setStatus('pdf-status', `Done — merged ${pdfFiles.length} files into one PDF.`);
  } catch (err) {
    console.error(err);
    const msg = /password|encrypted/i.test(err.message || '') ? 'One of your PDFs may be password-protected. Remove its password and try again.' : (err.message || 'Could not merge these PDFs. Check that each file is a valid, unencrypted PDF.');
    setStatus('pdf-status', msg, true);
  } finally { btn.disabled = pdfFiles.length < 2; btn.innerHTML = 'Merge PDFs <span aria-hidden="true">→</span>'; }
});
