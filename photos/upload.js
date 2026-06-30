const CLOUD_NAME = 'dzqrv6c0o';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const CATEGORIES = ["Vik's Picks", "Best of Cityscapes", "Best of Aerials", "Best of People", "Best of Sports"];

let fileQueue = [];     // { file, id, meta, status }
let photoData = null;   // loaded from photo_data.json
let newEntries = {};    // category -> [entry, ...]

// ── Config ────────────────────────────────────────────────────────────────────

function loadPreset() {
    const saved = localStorage.getItem('cld_upload_preset') || '';
    document.getElementById('preset-input').value = saved;
    return saved;
}

function savePreset() {
    const val = document.getElementById('preset-input').value.trim();
    localStorage.setItem('cld_upload_preset', val);
    showToast('Preset saved', 'success');
}

function getPreset() {
    return document.getElementById('preset-input').value.trim();
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    addFiles([...e.dataTransfer.files]);
});
fileInput.addEventListener('change', () => addFiles([...fileInput.files]));

function addFiles(files) {
    const images = files.filter(f => f.type.startsWith('image/'));
    images.forEach(file => {
        const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        fileQueue.push({ file, id, meta: { what: '', where: '', when: '', categories: [] }, status: 'pending' });
        renderCard(fileQueue[fileQueue.length - 1]);
    });
    fileInput.value = '';
    updateUploadActions();
}

function renderCard(item) {
    const queue = document.getElementById('file-queue');

    const card = document.createElement('div');
    card.className = 'file-card';
    card.id = item.id;

    // Thumbnail
    const thumb = document.createElement('img');
    thumb.className = 'file-thumb';
    thumb.alt = item.file.name;
    const url = URL.createObjectURL(item.file);
    thumb.src = url;
    thumb.onload = () => URL.revokeObjectURL(url);

    // Fields
    const fields = document.createElement('div');
    fields.className = 'file-fields';

    const nameEl = document.createElement('div');
    nameEl.className = 'file-name';
    nameEl.textContent = item.file.name;

    const whatInput = makeInput('What (description)', val => { item.meta.what = val; });
    const whereInput = makeInput('Where (location)', val => { item.meta.where = val; });
    const whenInput = makeInput('When (e.g. Jun 2025)', val => { item.meta.when = val; });

    const catLabel = document.createElement('div');
    catLabel.style.cssText = 'font-size:0.78rem;color:#666;margin-top:0.25rem;';
    catLabel.textContent = 'Add to categories:';

    const catBoxes = document.createElement('div');
    catBoxes.className = 'category-checkboxes';

    CATEGORIES.forEach(cat => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.addEventListener('change', () => {
            if (cb.checked) {
                if (!item.meta.categories.includes(cat)) item.meta.categories.push(cat);
            } else {
                item.meta.categories = item.meta.categories.filter(c => c !== cat);
            }
        });
        const span = document.createElement('span');
        span.textContent = cat;
        label.appendChild(cb);
        label.appendChild(span);
        catBoxes.appendChild(label);
    });

    fields.appendChild(nameEl);
    fields.appendChild(whatInput);
    fields.appendChild(whereInput);
    fields.appendChild(whenInput);
    fields.appendChild(catLabel);
    fields.appendChild(catBoxes);

    // Status
    const statusCol = document.createElement('div');
    statusCol.className = 'file-status';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-ghost';
    removeBtn.style.cssText = 'padding:0.3rem 0.6rem;font-size:0.8rem;';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.title = 'Remove';
    removeBtn.onclick = () => removeCard(item.id);

    const statusIcon = document.createElement('i');
    statusIcon.className = 'fas fa-circle status-icon pending';
    statusIcon.id = `${item.id}-icon`;

    const statusLabel = document.createElement('div');
    statusLabel.className = 'status-label';
    statusLabel.id = `${item.id}-label`;
    statusLabel.textContent = 'Pending';

    statusCol.appendChild(removeBtn);
    statusCol.appendChild(statusIcon);
    statusCol.appendChild(statusLabel);

    card.appendChild(thumb);
    card.appendChild(fields);
    card.appendChild(statusCol);
    queue.appendChild(card);
}

function makeInput(placeholder, onChange) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.addEventListener('input', () => onChange(input.value.trim()));
    return input;
}

function removeCard(id) {
    fileQueue = fileQueue.filter(i => i.id !== id);
    const el = document.getElementById(id);
    if (el) el.remove();
    updateUploadActions();
}

function clearQueue() {
    fileQueue = [];
    document.getElementById('file-queue').innerHTML = '';
    updateUploadActions();
}

function updateUploadActions() {
    const actionsEl = document.getElementById('upload-actions');
    actionsEl.style.display = fileQueue.length > 0 ? 'flex' : 'none';
    updateSummary();
}

function updateSummary() {
    const done = fileQueue.filter(i => i.status === 'success').length;
    const total = fileQueue.length;
    document.getElementById('upload-summary').textContent =
        total > 0 ? `${done} / ${total} uploaded` : '';
}

// ── Image resize (canvas) ──────────────────────────────────────────────────────

async function resizeIfNeeded(file) {
    const MAX_BYTES = 9 * 1024 * 1024;
    if (file.size <= MAX_BYTES) return file;

    return new Promise(resolve => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objUrl);
            const MAX_DIM = 2048;
            let { width, height } = img;
            if (width >= height && width > MAX_DIM) {
                height = Math.round(height * MAX_DIM / width);
                width = MAX_DIM;
            } else if (height > width && height > MAX_DIM) {
                width = Math.round(width * MAX_DIM / height);
                height = MAX_DIM;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            canvas.toBlob(blob => {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.82);
        };
        img.src = objUrl;
    });
}

// ── Upload ────────────────────────────────────────────────────────────────────

async function uploadAll() {
    const preset = getPreset();
    if (!preset) {
        showToast('Set an upload preset first', 'error');
        return;
    }

    document.getElementById('upload-all-btn').disabled = true;
    const pending = fileQueue.filter(i => i.status === 'pending' || i.status === 'error');

    // Reset errored items back to pending so they get retried
    pending.forEach(item => {
        if (item.status === 'error') {
            item.status = 'pending';
            const card = document.getElementById(item.id);
            if (card) card.classList.remove('error');
            setStatus(item, 'pending', 'fa-circle', 'Pending');
        }
    });

    for (const item of pending) {
        await uploadOne(item, preset);
    }

    document.getElementById('upload-all-btn').disabled = false;
    updateSummary();
    refreshMergedButton();
}

async function uploadOne(item, preset) {
    setStatus(item, 'uploading', 'fa-spinner', 'Uploading…');
    const card = document.getElementById(item.id);
    if (card) card.classList.add('uploading');

    try {
        const resized = await resizeIfNeeded(item.file);

        // Build public_id from filename (strip extension, replace spaces)
        const baseName = item.file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
        const publicId = `portfolio/photos/${baseName}`;

        const form = new FormData();
        form.append('file', resized);
        form.append('upload_preset', preset);
        form.append('public_id', publicId);

        const res = await fetch(UPLOAD_URL, { method: 'POST', body: form });
        const data = await res.json();

        if (data.error) throw new Error(data.error.message);

        item.status = 'success';
        item.publicId = data.public_id;
        setStatus(item, 'success', 'fa-check-circle', 'Done');
        if (card) { card.classList.remove('uploading'); card.classList.add('success'); }

        recordNewEntry(item);
        showToast(`Uploaded: ${item.file.name}`, 'success');
    } catch (err) {
        item.status = 'error';
        setStatus(item, 'error', 'fa-times-circle', 'Failed');
        if (card) { card.classList.remove('uploading'); card.classList.add('error'); }
        showToast(`Failed: ${item.file.name} — ${err.message}`, 'error');
    }
}

function setStatus(item, cls, icon, label) {
    const iconEl = document.getElementById(`${item.id}-icon`);
    const labelEl = document.getElementById(`${item.id}-label`);
    if (iconEl) { iconEl.className = `fas ${icon} status-icon ${cls}`; }
    if (labelEl) labelEl.textContent = label;
}

// ── New entries tracking ──────────────────────────────────────────────────────

function recordNewEntry(item) {
    const filename = item.file.name;
    const entry = { path: filename };
    if (item.meta.what)  entry.what  = item.meta.what;
    if (item.meta.where) entry.where = item.meta.where;
    if (item.meta.when)  entry.when  = item.meta.when;

    item.meta.categories.forEach(cat => {
        if (!newEntries[cat]) newEntries[cat] = [];
        newEntries[cat].push(entry);
    });

    renderNewEntriesBadges();
}

function renderNewEntriesBadges() {
    const el = document.getElementById('new-entries-list');
    const total = Object.values(newEntries).reduce((s, arr) => s + arr.length, 0);
    if (total === 0) { el.innerHTML = ''; return; }

    let html = '<div style="font-size:0.85rem;color:#555;margin-bottom:0.4rem;">New entries ready to merge:</div>';
    for (const [cat, entries] of Object.entries(newEntries)) {
        entries.forEach(e => {
            html += `<span class="new-entry-badge">${cat}: ${e.path}</span>`;
        });
    }
    el.innerHTML = html;
}

function refreshMergedButton() {
    const hasNew = Object.values(newEntries).some(a => a.length > 0);
    document.getElementById('download-merged-btn').style.display = hasNew ? 'inline-flex' : 'none';
}

// ── JSON manager ──────────────────────────────────────────────────────────────

async function ensurePhotoData() {
    if (photoData) return;
    try {
        const res = await fetch('https://api.jsonbin.io/v3/b/6a42a081da38895dfe112f88');
        photoData = (await res.json()).record;
    } catch {
        showToast('Could not load photo_data.json', 'error');
    }
}

async function fetchAndDownloadJSON() {
    await ensurePhotoData();
    if (!photoData) return;
    triggerDownload(JSON.stringify(photoData, null, 2), 'photo_data.json');
    showToast('Downloaded current photo_data.json', 'info');
}

async function toggleJSONPreview() {
    await ensurePhotoData();
    if (!photoData) return;
    const el = document.getElementById('json-preview');
    if (el.style.display === 'none' || !el.style.display) {
        el.style.display = 'block';
        el.textContent = JSON.stringify(photoData, null, 2);
    } else {
        el.style.display = 'none';
    }
}

async function downloadMergedJSON() {
    await ensurePhotoData();
    if (!photoData) return;

    // Deep clone
    const merged = JSON.parse(JSON.stringify(photoData));

    for (const [cat, entries] of Object.entries(newEntries)) {
        if (!merged[cat]) merged[cat] = [];
        entries.forEach(entry => {
            const alreadyExists = merged[cat].some(e => e.path === entry.path);
            if (!alreadyExists) merged[cat].push(entry);
        });
    }

    triggerDownload(JSON.stringify(merged, null, 2), 'photo_data.json');
    showToast('Downloaded merged photo_data.json', 'success');
}

function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────

loadPreset();
