document.addEventListener('DOMContentLoaded', () => {
    const imagePicker = document.getElementById('image-picker');
    const originalImage = document.getElementById('original-image');
    const whatInput = document.getElementById('what-input');
    const whenInput = document.getElementById('when-input');
    const whereInput = document.getElementById('where-input');
    const generateBtn = document.getElementById('generate-btn');
    const downloadLink = document.getElementById('download-link');
    const canvas = document.getElementById('polaroid-canvas');
    const ctx = canvas.getContext('2d');

    // Text layout controls
    const fontSizeSlider = document.getElementById('font-size-slider');
    const lineSpacingSlider = document.getElementById('line-spacing-slider');
    const topOffsetSlider = document.getElementById('top-offset-slider');
    const whatWidthSlider = document.getElementById('what-width-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    const lineSpacingValue = document.getElementById('line-spacing-value');
    const topOffsetValue = document.getElementById('top-offset-value');
    const whatWidthValue = document.getElementById('what-width-value');

    let selectedImage = null;
    let currentCropped = null;
    let rotationDeg = 0;
    const metadataStatus = document.getElementById('metadata-status');
    const rotateLeftBtn = document.getElementById('rotate-left-btn');
    const rotateRightBtn = document.getElementById('rotate-right-btn');

    // The status line reports two independent async jobs (HEIC conversion
    // and EXIF metadata lookup), so their messages are tracked separately
    // and combined rather than one overwriting the other mid-flight.
    let heicStatusText = '';
    let metaStatusText = '';
    function renderCombinedStatus() {
        if (!metadataStatus) return;
        metadataStatus.textContent = [heicStatusText, metaStatusText].filter(Boolean).join(' ');
    }

    // Browsers (other than Safari) can't decode HEIC/HEIF in <img> or canvas,
    // so iPhone photos need converting to JPEG client-side before use.
    async function isHeicFile(file) {
        if (typeof HeicTo !== 'undefined') {
            try {
                return await HeicTo.isHeic(file);
            } catch (err) {
                // fall through to extension check
            }
        }
        return /\.hei[cf]$/i.test(file.name);
    }

    function convertHeicToJpeg(file) {
        return HeicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
    }

    imagePicker.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        rotationDeg = 0;
        autofillFromPhotoMetadata(file);

        let displayFile = file;
        if (await isHeicFile(file)) {
            heicStatusText = 'Converting HEIC photo…';
            renderCombinedStatus();
            try {
                displayFile = await convertHeicToJpeg(file);
            } catch (err) {
                heicStatusText = 'Could not convert this HEIC photo — try exporting it as JPEG first.';
                if (metadataStatus) metadataStatus.classList.add('error');
                renderCombinedStatus();
                return;
            }
            heicStatusText = '';
            renderCombinedStatus();
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            selectedImage = new Image();
            selectedImage.onload = () => {
                updateOriginalPreview();
            };
            selectedImage.src = event.target.result;
        };
        reader.readAsDataURL(displayFile);
    });

    // Rotates an image/canvas by a multiple of 90deg onto an offscreen
    // canvas, swapping width/height for 90/270deg turns. Returns a canvas,
    // which (like an Image) can be used directly as a drawImage source.
    function rotateImage(img, degrees) {
        const rad = degrees * Math.PI / 180;
        const swap = degrees % 180 !== 0;
        const w = img.width;
        const h = img.height;
        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = swap ? h : w;
        rotatedCanvas.height = swap ? w : h;
        const rCtx = rotatedCanvas.getContext('2d');
        rCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
        rCtx.rotate(rad);
        rCtx.drawImage(img, -w / 2, -h / 2);
        return rotatedCanvas;
    }

    function getRotatedSource() {
        if (!selectedImage) return null;
        return rotationDeg === 0 ? selectedImage : rotateImage(selectedImage, rotationDeg);
    }

    function updateOriginalPreview() {
        if (!selectedImage) return;
        originalImage.src = rotationDeg === 0 ? selectedImage.src : getRotatedSource().toDataURL();
    }

    function rotateBy(delta) {
        if (!selectedImage) return;
        rotationDeg = ((rotationDeg + delta) % 360 + 360) % 360;
        updateOriginalPreview();
        if (currentCropped) runGenerate();
    }

    if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => rotateBy(-90));
    if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => rotateBy(90));

    function formatExifDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
    }

    // Reverse-geocodes GPS coordinates into a short place label via the
    // Nominatim (OpenStreetMap) public API, since EXIF only stores lat/lon.
    async function reverseGeocode(latitude, longitude) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=1`;
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`Nominatim request failed: ${response.status}`);
        const data = await response.json();
        const addr = data.address || {};
        const specific = addr.attraction || addr.leisure || addr.amenity || addr.building
            || addr.tourism || addr.shop || addr.road;
        const place = addr.city || addr.town || addr.village || addr.suburb || addr.county;
        if (specific && place) return `${specific}, ${place}`;
        if (specific) return specific;
        if (place) return place;
        return data.display_name ? data.display_name.split(',')[0] : null;
    }

    async function autofillFromPhotoMetadata(file) {
        if (typeof exifr === 'undefined') return;
        metaStatusText = 'Reading photo metadata…';
        if (metadataStatus) metadataStatus.classList.remove('error');
        renderCombinedStatus();
        try {
            const exif = await exifr.parse(file, { gps: true, tiff: true, exif: true });
            const foundParts = [];

            if (exif) {
                const dateTaken = exif.DateTimeOriginal || exif.CreateDate;
                if (dateTaken instanceof Date && !isNaN(dateTaken) && !whenInput.value) {
                    whenInput.value = formatExifDate(dateTaken);
                    foundParts.push('date');
                }

                if (typeof exif.latitude === 'number' && typeof exif.longitude === 'number' && !whereInput.value) {
                    try {
                        const place = await reverseGeocode(exif.latitude, exif.longitude);
                        if (place) {
                            whereInput.value = place;
                            foundParts.push('location');
                        }
                    } catch (geoErr) {
                        // Reverse geocoding is best-effort; fall back to raw coordinates.
                        whereInput.value = `${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)}`;
                        foundParts.push('location (coordinates only)');
                    }
                }
            }

            metaStatusText = foundParts.length
                ? `Auto-filled from photo: ${foundParts.join(', ')}.`
                : 'No date/location metadata found in this photo.';
            renderCombinedStatus();
            maybeRerender();
        } catch (err) {
            metaStatusText = 'Could not read photo metadata.';
            if (metadataStatus) metadataStatus.classList.add('error');
            renderCombinedStatus();
        }
    }

    function cropToAspect(img, aspect_ratio = [3, 4]) {
        const w = img.width;
        const h = img.height;
        let target_w = w;
        let target_h = Math.floor(w * aspect_ratio[1] / aspect_ratio[0]);
        if (target_h > h) {
            target_h = h;
            target_w = Math.floor(h * aspect_ratio[0] / aspect_ratio[1]);
        }
        const left = (w - target_w) / 2;
        const top = (h - target_h) / 2;
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = target_w;
        tempCanvas.height = target_h;
        tempCtx.drawImage(img, left, top, target_w, target_h, 0, 0, target_w, target_h);
        
        const croppedImage = new Image();
        croppedImage.src = tempCanvas.toDataURL();
        return croppedImage;
    }

    function runGenerate() {
        const cropped = cropToAspect(getRotatedSource(), [3, 4]);
        cropped.onload = () => {
            currentCropped = cropped;
            createPolaroid(currentCropped, whatInput.value, whenInput.value, whereInput.value);
        }
    }

    generateBtn.addEventListener('click', () => {
        if (!selectedImage) {
            alert('Please select an image first.');
            return;
        }
        runGenerate();
    });

    function getControls() {
        const fontSizePx = Math.max(10, Number(fontSizeSlider?.value || 240));
        const lineSpacingMultiplier = Math.max(0.5, Number(lineSpacingSlider?.value || 1.25));
        const topOffsetPx = Math.max(0, Number(topOffsetSlider?.value || 40));
        const whatWidthPercent = Math.min(95, Math.max(5, Number(whatWidthSlider?.value || 60)));
        return { fontSizePx, lineSpacingMultiplier, topOffsetPx, whatWidthPercent };
    }

    function createPolaroid(img, what, when, where) {
        const polaroid_h_target = 6000;
        const img_h = polaroid_h_target / 1.3;
        const img_w = img_h * (img.width / img.height);
        
        const border_top = 0.05 * img_h;
        const border_side = 0.05 * img_w;
        const border_bottom = 0.25 * img_h;
        
        const polaroid_w = img_w + 2 * border_side;
        const polaroid_h = img_h + border_top + border_bottom;

        canvas.width = polaroid_w;
        canvas.height = polaroid_h;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, polaroid_w, polaroid_h);
        ctx.drawImage(img, border_side, border_top, img_w, img_h);

        const { fontSizePx, lineSpacingMultiplier, topOffsetPx, whatWidthPercent } = getControls();
        const font_size = fontSizePx;
        ctx.font = `bold ${font_size}px 'Lexend Deca', sans-serif`;
        ctx.fillStyle = 'black';

        function wrapText(context, text, x, y, maxWidth, lineHeight, align = 'left') {
            const words = text.split(' ');
            let line = '';
            let current_y = y;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    drawAlignedText(context, line, x, current_y, maxWidth, align);
                    line = words[n] + ' ';
                    current_y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            drawAlignedText(context, line, x, current_y, maxWidth, align);
            return current_y - y + lineHeight; 
        }
        
        function drawAlignedText(context, text, x, y, maxWidth, align) {
            const textTrimmed = (text || '').trimEnd();
            let drawX = x;
            if (align === 'right') {
                const textWidth = context.measureText(textTrimmed).width;
                drawX = x + maxWidth - textWidth;
            } else if (align === 'center') {
                const textWidth = context.measureText(textTrimmed).width;
                drawX = x + (maxWidth - textWidth) / 2;
            }
            context.fillText(textTrimmed, drawX, y);
        }

        const x_what = border_side;
        const y_what = img_h + border_top + topOffsetPx + font_size;
        const leftBoxWidth = polaroid_w * (whatWidthPercent / 100) - border_side;
        const max_width_what = Math.max(50, leftBoxWidth);
        const what_height = wrapText(ctx, what, x_what, y_what, max_width_what, Math.max(1, font_size * lineSpacingMultiplier));

        const x_where = border_side + max_width_what;
        const y_where = y_what;
        const rightBoxWidth = polaroid_w - border_side - x_where;
        const max_width_where = Math.max(50, rightBoxWidth);
        wrapText(ctx, where, x_where, y_where, max_width_where, Math.max(1, font_size * lineSpacingMultiplier), 'right');
        
        const x_when = border_side;
        const y_when = y_what + what_height + 8;
        ctx.fillText(when, x_when, y_when);

        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = (what.toLowerCase().replace(/[^a-z0-9]/g, '') || 'polaroid') + '_polaroid.png';
        downloadLink.style.display = 'block';
    }

    // Live update helpers
    function updateValueLabels() {
        if (fontSizeValue && fontSizeSlider) fontSizeValue.textContent = `${fontSizeSlider.value} px`;
        if (lineSpacingValue && lineSpacingSlider) lineSpacingValue.textContent = `${lineSpacingSlider.value}×`;
        if (topOffsetValue && topOffsetSlider) topOffsetValue.textContent = `${topOffsetSlider.value} px`;
        if (whatWidthValue && whatWidthSlider) whatWidthValue.textContent = `${whatWidthSlider.value}%`;
    }

    function maybeRerender() {
        if (!currentCropped) return;
        createPolaroid(currentCropped, whatInput.value, whenInput.value, whereInput.value);
    }

    // Slider value readouts update live, but the canvas itself only
    // re-renders when the Generate Polaroid button is pressed.
    [fontSizeSlider, lineSpacingSlider, topOffsetSlider, whatWidthSlider]
        .filter(Boolean)
        .forEach((el) => {
            el.addEventListener('input', updateValueLabels);
        });

    updateValueLabels();
    // Tabs & Batch 2x2 Export Logic
    const tabBtnSingle = document.getElementById('tab-btn-single');
    const tabBtnBatch = document.getElementById('tab-btn-batch');
    const tabSingle = document.getElementById('tab-single');
    const tabBatch = document.getElementById('tab-batch');

    function activateTab(target) {
        if (!tabBtnSingle || !tabBtnBatch || !tabSingle || !tabBatch) return;
        if (target === 'single') {
            tabBtnSingle.classList.add('active');
            tabBtnBatch.classList.remove('active');
            tabSingle.classList.add('active');
            tabBatch.classList.remove('active');
        } else {
            tabBtnBatch.classList.add('active');
            tabBtnSingle.classList.remove('active');
            tabBatch.classList.add('active');
            tabSingle.classList.remove('active');
        }
    }

    if (tabBtnSingle && tabBtnBatch) {
        tabBtnSingle.addEventListener('click', () => activateTab('single'));
        tabBtnBatch.addEventListener('click', () => activateTab('batch'));
    }

    // Batch UI elements
    const batchPicker = document.getElementById('batch-image-picker');
    const batchListEl = document.getElementById('batch-list');
    const batchSummaryEl = document.getElementById('batch-summary');
    const exportBatchBtn = document.getElementById('export-batch-btn');
    const batchPreviewCanvas = null;
    const batchPreviewCtx = null;

    let batchItems = [];
    let nextItemId = 1;

    function clearBatchList() {
        if (!batchListEl) return;
        while (batchListEl.firstChild) batchListEl.removeChild(batchListEl.firstChild);
    }

    function updateBatchSummary() {
        if (!batchSummaryEl) return;
        const total = batchItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        const pad = (4 - (total % 4 || 0)) % 4;
        const pages = (total + pad) / 4;
        batchSummaryEl.textContent = `Total images: ${total} • Pages: ${pages} • Padding: ${pad}`;
    }

    function renderBatchList() {
        if (!batchListEl) return;
        clearBatchList();
        batchItems.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'batch-item';

            const thumb = document.createElement('img');
            thumb.src = item.url;
            thumb.alt = item.file.name;

            const label = document.createElement('div');
            label.textContent = item.file.name;
            label.style.flex = '1';
            label.style.textAlign = 'left';

            const qty = document.createElement('input');
            qty.type = 'number';
            qty.min = '0';
            qty.value = String(item.quantity);
            qty.className = 'qty-input';
            qty.addEventListener('change', () => {
                const v = Math.max(0, Math.floor(Number(qty.value) || 0));
                item.quantity = v;
                qty.value = String(v);
                updateBatchSummary();
            });

            row.appendChild(thumb);
            row.appendChild(label);
            row.appendChild(qty);
            batchListEl.appendChild(row);
        });
        updateBatchSummary();
    }

    function loadImageFromURL(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    if (batchPicker) {
        batchPicker.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            batchItems = [];
            for (const file of files) {
                let displayFile = file;
                if (await isHeicFile(file)) {
                    try {
                        displayFile = await convertHeicToJpeg(file);
                    } catch (err) {
                        continue;
                    }
                }
                const url = URL.createObjectURL(displayFile);
                const img = await loadImageFromURL(url).catch(() => null);
                if (!img) continue;
                batchItems.push({ id: nextItemId++, file, url, img, quantity: 1 });
            }
            renderBatchList();
        });
    }

    function drawContain(ctx, img, x, y, w, h) {
        const imgRatio = img.width / img.height;
        const cellRatio = w / h;
        let drawW = w;
        let drawH = h;
        if (imgRatio > cellRatio) {
            drawW = w;
            drawH = w / imgRatio;
        } else {
            drawH = h;
            drawW = h * imgRatio;
        }
        const dx = x + (w - drawW) / 2;
        const dy = y + (h - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
    }

    function draw2x2Page(imagesForPage, targetW = 4000, targetH = 6000) {
        const off = document.createElement('canvas');
        off.width = targetW;
        off.height = targetH;
        const c = off.getContext('2d');
        c.fillStyle = 'white';
        c.fillRect(0, 0, targetW, targetH);

        const outer = Math.floor(targetW * 0.04);
        const gap = Math.floor(targetW * 0.02);
        const cellW = Math.floor((targetW - outer * 2 - gap) / 2);
        const cellH = Math.floor((targetH - outer * 2 - gap) / 2);

        const positions = [
            { x: outer, y: outer },
            { x: outer + cellW + gap, y: outer },
            { x: outer, y: outer + cellH + gap },
            { x: outer + cellW + gap, y: outer + cellH + gap }
        ];

        for (let i = 0; i < 4; i++) {
            const slot = imagesForPage[i] || null;
            const { x, y } = positions[i];
            c.fillStyle = '#ffffff';
            c.fillRect(x, y, cellW, cellH);
            if (slot) {
                drawContain(c, slot, x, y, cellW, cellH);
            }
        }

        return off;
    }

    async function exportBatch() {
        const expanded = [];
        batchItems.forEach((item) => {
            const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
            for (let i = 0; i < qty; i++) expanded.push(item.img);
        });
        if (expanded.length === 0) {
            alert('Please add at least one image with quantity > 0.');
            return;
        }
        const pad = (4 - (expanded.length % 4 || 0)) % 4;
        for (let i = 0; i < pad; i++) expanded.push(null);
        const pages = expanded.length / 4;

        for (let p = 0; p < pages; p++) {
            const pageImgs = expanded.slice(p * 4, p * 4 + 4);
            const pageCanvas = draw2x2Page(pageImgs);
            await new Promise((resolve) => setTimeout(resolve, 50));
            const link = document.createElement('a');
            link.href = pageCanvas.toDataURL('image/png');
            const idx = String(p + 1).padStart(2, '0');
            const now = new Date();
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const mon = months[now.getMonth()];
            const day = String(now.getDate());
            const year = now.getFullYear();
            link.download = `${mon}${day}${year}_polaroidexport_${idx}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    if (exportBatchBtn) {
        exportBatchBtn.addEventListener('click', exportBatch);
    }
});