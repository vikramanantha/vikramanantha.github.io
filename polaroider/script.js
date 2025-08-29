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

    let selectedImage = null;

    imagePicker.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                originalImage.src = event.target.result;
                selectedImage = new Image();
                selectedImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

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

    generateBtn.addEventListener('click', () => {
        if (!selectedImage) {
            alert('Please select an image first.');
            return;
        }
        selectedImage.onload = () => {
            const cropped = cropToAspect(selectedImage, [3, 4]);
            cropped.onload = () => {
                createPolaroid(cropped, whatInput.value, whenInput.value, whereInput.value);
            }
        };
        if (selectedImage.complete) {
            const cropped = cropToAspect(selectedImage, [3, 4]);
            cropped.onload = () => {
                createPolaroid(cropped, whatInput.value, whenInput.value, whereInput.value);
            }
        }
    });

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

        const font_size = border_bottom * 0.18;
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
            let drawX = x;
            if (align === 'right') {
                const textWidth = context.measureText(text).width;
                drawX = x + maxWidth - textWidth;
            } else if (align === 'center') {
                const textWidth = context.measureText(text).width;
                drawX = x + (maxWidth - textWidth) / 2;
            }
            context.fillText(text, drawX, y);
        }

        const x_what = border_side;
        const y_what = img_h + border_top + 0.05 * border_bottom + font_size;
        const max_width_what = polaroid_w * 0.6 - border_side;
        const what_height = wrapText(ctx, what, x_what, y_what, max_width_what, font_size + 2);

        const x_where = polaroid_w * 0.6;
        const y_where = y_what;
        const max_width_where = polaroid_w * 0.4 - border_side;
        wrapText(ctx, where, x_where, y_where, max_width_where, font_size + 2, 'right');
        
        const x_when = border_side;
        const y_when = y_what + what_height + 8;
        ctx.fillText(when, x_when, y_when);

        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = (what.toLowerCase().replace(/[^a-z0-9]/g, '') || 'polaroid') + '_polaroid.png';
        downloadLink.style.display = 'block';
    }
}); 