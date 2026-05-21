let textItems = [];
let editingIndex = -1;
let selectedPosition = 'center';
let selectedAlign = 'left';
let videoDuration = 0;
let videoInputPath = null;
let videoOutputPath = null;
let videoElement = null;
let isProcessing = false;
let isPlaying = false;
let useGPU = false;
let currentLanguage = 'hr';
let i18n = null;
let currentFont = 'Arial'; // Selected font
let videoWidth = 1920;  // Actual video width
let videoHeight = 1080; // Actual video height

// Load language
async function loadLanguage(lang) {
    const response = await fetch(`locales/${lang}.json`);
    i18n = await response.json();
    updateUILanguage();
}

// Update all UI text with current language
function updateUILanguage() {
    if (!i18n) return;
    
    // Update text labels
    document.querySelector('label[for="textContent"]').textContent = i18n.ui.text;
    document.querySelector('label[for="startTime"]').textContent = i18n.ui.start;
    document.querySelector('label[for="endTime"]').textContent = i18n.ui.end;
    document.querySelector('label[for="fontSize"]').textContent = i18n.ui.size;
    document.querySelector('label[for="textAlign"]').textContent = i18n.ui.alignment;
    document.querySelector('label[for="textColor"]').textContent = i18n.ui.textColor;
    document.querySelector('label[for="bgColor"]').textContent = i18n.ui.bgColor;
    document.querySelector('label[for="bgOpacity"]').textContent = i18n.ui.opacity;
    
    // Update alignment options
    const alignSelect = document.getElementById('textAlign');
    alignSelect.options[0].text = i18n.ui.alignLeft;
    alignSelect.options[1].text = i18n.ui.alignCenter;
    alignSelect.options[2].text = i18n.ui.alignRight;
    
    // Update position labels
    document.querySelector('.section-title').textContent = `✏️ ${i18n.ui.textEditor}`;
    document.querySelectorAll('.section-title')[1].textContent = `🎬 ${i18n.ui.timeline}`;
    
    // Update buttons
    if (editingIndex >= 0) {
        addTextBtn.textContent = `💾 ${i18n.ui.saveChanges}`;
    } else {
        addTextBtn.textContent = `➕ ${i18n.ui.addText}`;
    }
    processBtn.textContent = `🎬 ${i18n.ui.processVideo}`;
    stopBtn.textContent = `⏹ ${i18n.ui.stop}`;
    
    // Update placeholders
    textContent.placeholder = i18n.ui.textPlaceholder;
    
    // Update empty states
    const previewEmpty = document.querySelector('.preview-empty');
    if (previewEmpty) {
        previewEmpty.querySelector('p').textContent = i18n.ui.videoInfoEmpty;
        previewEmpty.querySelector('.help-text').textContent = i18n.ui.videoInfoHelp;
    }
    
    // Update output path
    if (!videoOutputPath) {
        outputPathDisplay.querySelector('.label').textContent = i18n.ui.saveLabel;
        outputPathDisplay.querySelector('.path').textContent = i18n.ui.saveDefault;
    }
    
    // Re-render timeline if needed
    if (textItems.length === 0) {
        renderTimeline();
    }
}

// Initialize language
loadLanguage(currentLanguage);

// Elements
const videoInfoBar = document.getElementById('videoInfoBar');
const videoNameDisplay = document.getElementById('videoNameDisplay');
const videoDurationDisplay = document.getElementById('videoDurationDisplay');
const videoResolution = document.getElementById('videoResolution');
const previewEmpty = document.getElementById('previewEmpty');
const previewCanvas = document.getElementById('previewCanvas');
const videoControls = document.getElementById('videoControls');
const playBtn = document.getElementById('playBtn');
const timelineSlider = document.getElementById('timelineSlider');
const timeDisplay = document.getElementById('timeDisplay');
const textContent = document.getElementById('textContent');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const fontSize = document.getElementById('fontSize');
const textAlign = document.getElementById('textAlign');
const fontFamily = document.getElementById('fontFamily');
const textColor = document.getElementById('textColor');
const bgColor = document.getElementById('bgColor');
const bgOpacity = document.getElementById('bgOpacity');
const addTextBtn = document.getElementById('addTextBtn');

// Load system fonts on startup
(async function loadSystemFonts() {
    try {
        const fonts = await window.electronAPI.getSystemFonts();
        fontFamily.innerHTML = '';
        
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.name;
            option.textContent = font.name;
            if (font.name === 'Arial') {
                option.selected = true;
            }
            fontFamily.appendChild(option);
        });
        
        const helpText = fontFamily.parentElement.querySelector('.help-text');
        if (helpText) {
            helpText.textContent = `${fonts.length} fontova dostupno`;
        }
        
        console.log('Loaded', fonts.length, 'fonts');
    } catch (error) {
        console.error('Failed to load fonts:', error);
    }
})();

const clearAllBtn = document.getElementById('clearAllBtn');
const timeline = document.getElementById('timeline');
const outputPathDisplay = document.getElementById('outputPathDisplay');
const processBtn = document.getElementById('processBtn');
const stopBtn = document.getElementById('stopBtn');
const progressOverlay = document.getElementById('progressOverlay');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const logOutput = document.getElementById('logOutput');

// Detect GPU on startup
(async () => {
    try {
        const gpuType = await window.electronAPI.detectGPU();
        console.log('GPU detected:', gpuType);
        
        // Show GPU info to user
        if (gpuType && gpuType !== 'CPU') {
            console.log(`✅ GPU dostupan: ${gpuType}`);
        } else {
            console.log('ℹ️ GPU nije pronađen, koristit će se CPU');
        }
    } catch (error) {
        console.error('GPU detection failed:', error);
    }
})();

// Listen for language changes
window.electronAPI.onLanguageChanged((lang) => {
    currentLanguage = lang;
    loadLanguage(lang);
});

// Font changed listener
window.electronAPI.onFontChanged((font) => {
    currentFont = font;
    console.log('Font changed to:', font);
    renderPreview(); // Re-render preview with new font
});

// Menu event listeners
window.electronAPI.onMenuOpenVideo(async () => {
    const filePath = await window.electronAPI.selectVideoFile();
    if (filePath) {
        // Clear all existing texts when loading new video
        textItems = [];
        editingIndex = -1;
        videoOutputPath = null;
        
        // Update UI
        renderTimeline();
        updateProcessButton();
        outputPathDisplay.querySelector('.label').textContent = i18n ? i18n.ui.saveLabel : 'Spremanje:';
        outputPathDisplay.querySelector('.path').textContent = i18n ? i18n.ui.saveDefault : 'Odaberite lokaciju (Datoteka → Odaberi Lokaciju)';
        
        loadVideo(filePath);
    }
});

window.electronAPI.onMenuSaveLocation(async () => {
    const fileName = videoInputPath ? 
        videoInputPath.split(/[\\/]/).pop().replace(/\.[^/.]+$/, '_uredjen.mp4') : 
        'output_video.mp4';
    
    const filePath = await window.electronAPI.selectOutputFile(fileName);
    if (filePath) {
        videoOutputPath = filePath;
        outputPathDisplay.querySelector('.path').textContent = filePath;
        updateProcessButton();
    }
});

window.electronAPI.onMenuToggleGPU((checked) => {
    useGPU = checked;
    console.log('GPU acceleration:', useGPU ? 'enabled' : 'disabled');
});

// Save project
window.electronAPI.onMenuSaveProject(async () => {
    if (!videoInputPath) {
        showNotification('Prvo učitajte video prije spremanja projekta!', 'error');
        return;
    }
    
    const projectData = {
        version: '0.9.0',
        videoPath: videoInputPath,
        videoWidth: videoWidth,
        videoHeight: videoHeight,
        videoDuration: videoDuration,
        outputPath: videoOutputPath || null,
        textItems: textItems,
        timestamp: new Date().toISOString()
    };
    
    const result = await window.electronAPI.saveProject(projectData);
    
    if (result.success) {
        showNotification('Projekt spremljen!', 'success');
    } else if (!result.cancelled) {
        showNotification('Greška pri spremanju projekta: ' + result.error, 'error');
    }
});

// Open project
window.electronAPI.onMenuOpenProject(async () => {
    const result = await window.electronAPI.openProject();
    
    if (result.success) {
        const project = result.data;
        
        // Load video
        videoInputPath = project.videoPath;
        videoWidth = project.videoWidth || 1920;  // Fallback
        videoHeight = project.videoHeight || 1080;
        videoDuration = project.videoDuration;
        videoOutputPath = project.outputPath;
        
        console.log('Project loaded - videoWidth:', videoWidth);
        
        // Load texts
        textItems = project.textItems || [];
        
        // Update UI
        const fileName = videoInputPath.split(/[\\/]/).pop();
        videoNameDisplay.textContent = fileName;
        
        const minutes = Math.floor(videoDuration / 60);
        const seconds = Math.floor(videoDuration % 60);
        videoDurationDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        videoResolution.textContent = `${videoWidth}x${videoHeight}`;
        
        videoInfoBar.style.display = 'flex';
        
        if (videoOutputPath) {
            outputPathDisplay.querySelector('.path').textContent = videoOutputPath;
        }
        
        renderTimeline();
        updateProcessButton();
        
        // Load video for preview
        loadVideo(videoInputPath);
        
        showNotification(`Projekt učitan! Video: ${fileName}, Tekstova: ${textItems.length}`, 'success');
    } else if (!result.cancelled) {
        showNotification('Greška pri učitavanju projekta: ' + result.error, 'error');
    }
});

// Load video
async function loadVideo(filePath) {
    videoInputPath = filePath;
    const fileName = filePath.split(/[\\/]/).pop();
    videoNameDisplay.textContent = fileName;
    
    // Create hidden video element
    if (videoElement) {
        URL.revokeObjectURL(videoElement.src);
    }
    
    videoElement = document.createElement('video');
    videoElement.src = 'file://' + filePath;
    videoElement.preload = 'metadata';
    
    videoElement.addEventListener('loadedmetadata', () => {
        setupPreview();
    });
    
    videoElement.addEventListener('timeupdate', () => {
        if (isPlaying) {
            const progress = (videoElement.currentTime / videoDuration) * 100;
            timelineSlider.value = progress;
            updateTimeDisplay();
            renderPreview();
            
            // Update start/end time inputs if not editing
            if (editingIndex < 0) {
                const currentTime = videoElement.currentTime;
                startTime.value = currentTime.toFixed(1);
                endTime.value = Math.min(currentTime + 15, videoDuration).toFixed(1);
            }
        }
    });
    
    videoElement.addEventListener('ended', () => {
        isPlaying = false;
        playBtn.textContent = '▶';
    });
    
    // Get metadata
    try {
        const metadata = await window.electronAPI.getVideoMetadata(filePath);
        videoDuration = metadata.duration;
        videoWidth = metadata.width;
        videoHeight = metadata.height;
        
        const minutes = Math.floor(videoDuration / 60);
        const seconds = Math.floor(videoDuration % 60);
        videoDurationDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        videoResolution.textContent = `${metadata.width}x${metadata.height}`;
        
        videoInfoBar.style.display = 'flex';
        
        if (parseFloat(endTime.value) === 5) {
            endTime.value = Math.min(15, videoDuration);
        }
        
        updateProcessButton();
    } catch (error) {
        console.error('Error loading video metadata:', error);
    }
}

// Setup preview
function setupPreview() {
    if (!videoElement || !videoElement.videoWidth) return;
    
    previewEmpty.style.display = 'none';
    previewCanvas.style.display = 'block';
    videoControls.style.display = 'flex';
    
    const ctx = previewCanvas.getContext('2d');
    
    // CRITICAL: Set canvas to ACTUAL video dimensions for true WYSIWYG
    previewCanvas.width = videoElement.videoWidth;
    previewCanvas.height = videoElement.videoHeight;
    
    // Store actual dimensions
    videoWidth = videoElement.videoWidth;
    videoHeight = videoElement.videoHeight;
    
    console.log(`Canvas set to actual video size: ${videoWidth}x${videoHeight}`);
    
    timelineSlider.max = 100;
    timelineSlider.value = 0;
    
    renderPreview();
    updateTimeDisplay();
}

// Play/Pause
playBtn.addEventListener('click', () => {
    if (!videoElement) return;
    
    if (isPlaying) {
        videoElement.pause();
        isPlaying = false;
        playBtn.textContent = '▶';
    } else {
        videoElement.play();
        isPlaying = true;
        playBtn.textContent = '⏸';
    }
});

// Timeline slider
timelineSlider.addEventListener('input', (e) => {
    if (!videoElement) return;
    
    const percentage = parseFloat(e.target.value);
    const time = (percentage / 100) * videoDuration;
    videoElement.currentTime = time;
    
    // Update start/end time inputs if not editing
    if (editingIndex < 0) {
        startTime.value = time.toFixed(1);
        endTime.value = Math.min(time + 15, videoDuration).toFixed(1);
    }
    
    if (!isPlaying) {
        renderPreview();
        updateTimeDisplay();
    }
});

// Update time display
function updateTimeDisplay() {
    if (!videoElement) return;
    
    const current = videoElement.currentTime;
    const currentMins = Math.floor(current / 60);
    const currentSecs = Math.floor(current % 60);
    const totalMins = Math.floor(videoDuration / 60);
    const totalSecs = Math.floor(videoDuration % 60);
    
    timeDisplay.textContent = `${currentMins}:${currentSecs.toString().padStart(2, '0')} / ${totalMins}:${totalSecs.toString().padStart(2, '0')}`;
}

// Render preview
function renderPreview() {
    if (!videoElement || !previewCanvas) return;
    
    const ctx = previewCanvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw text overlays
    const currentTime = videoElement.currentTime;
    textItems.forEach(item => {
        if (currentTime >= item.startTime && currentTime <= item.endTime) {
            drawTextOnCanvas(ctx, item);
        }
    });
}

// Draw text on canvas with multi-line and alignment support
function drawTextOnCanvas(ctx, item) {
    ctx.save();
    
    ctx.font = `${item.fontSize}px ${item.fontFamily || "Arial"}`;
    ctx.fillStyle = item.textColor;
    
    // Word wrap function
    function wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth) {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    lines.push(word);
                }
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [text];
    }
    
    // Split by manual line breaks first, then apply word wrap
    const manualLines = item.text.split('\n').filter(line => line.trim());
    const maxWidth = previewCanvas.width * 0.8; // 80% of screen width
    
    let allLines = [];
    manualLines.forEach(line => {
        const wrapped = wrapText(line, maxWidth);
        allLines.push(...wrapped);
    });
    
    const lines = allLines;
    const lineHeight = Math.floor(item.fontSize * 1.2);
    
    let maxTextWidth = 0;
    lines.forEach(line => {
        const width = ctx.measureText(line).width;
        if (width > maxTextWidth) maxTextWidth = width;
    });
    const totalTextHeight = lines.length * lineHeight;
    
    // Calculate base Y position based on vertical position
    let baseY;
    if (item.position.includes('top')) {
        baseY = 50;
    } else if (item.position.includes('bottom')) {
        baseY = previewCanvas.height - totalTextHeight - 50;
    } else {
        baseY = (previewCanvas.height - totalTextHeight) / 2;
    }
    
    // Calculate X position based on horizontal alignment
    const padding = 10;
    let boxX;
    
    if (item.position.includes('left')) {
        boxX = 50;
    } else if (item.position.includes('right')) {
        boxX = previewCanvas.width - maxTextWidth - 50 - padding * 2;
    } else {
        // Center
        boxX = (previewCanvas.width - maxTextWidth) / 2 - padding;
    }
    
    // Draw background box
    const bgOpacityValue = item.bgOpacity / 100;
    const bgColorRgb = hexToRgb(item.bgColor);
    ctx.fillStyle = `rgba(${bgColorRgb.r}, ${bgColorRgb.g}, ${bgColorRgb.b}, ${bgOpacityValue})`;
    ctx.fillRect(boxX, baseY - padding, maxTextWidth + padding * 2, totalTextHeight + padding * 2);
    
    // Draw text lines with proper alignment
    ctx.fillStyle = item.textColor;
    lines.forEach((line, index) => {
        const lineWidth = ctx.measureText(line).width;
        let x;
        
        if (item.align === 'left') {
            x = boxX + padding;
        } else if (item.align === 'right') {
            x = boxX + padding + (maxTextWidth - lineWidth);
        } else {
            // Center align
            x = boxX + padding + (maxTextWidth - lineWidth) / 2;
        }
        
        const y = baseY + (index * lineHeight) + item.fontSize;
        ctx.fillText(line, x, y);
    });
    
    ctx.restore();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Position buttons
const positionButtons = document.querySelectorAll('.pos-btn-grid');
console.log('Found position buttons:', positionButtons.length);

positionButtons.forEach(btn => {
    console.log('Position button:', btn.dataset.position, btn.textContent);
    btn.addEventListener('click', () => {
        console.log('Position button clicked:', btn.dataset.position);
        document.querySelectorAll('.pos-btn-grid').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPosition = btn.dataset.position;
        console.log('Selected position is now:', selectedPosition);
        
        // If editing, update preview immediately
        if (editingIndex >= 0 && textItems[editingIndex]) {
            textItems[editingIndex].position = selectedPosition;
            renderPreview();
        }
    });
});

// Text align
textAlign.addEventListener('change', (e) => {
    selectedAlign = e.target.value;
    
    // If editing, update preview immediately
    if (editingIndex >= 0 && textItems[editingIndex]) {
        textItems[editingIndex].align = selectedAlign;
        renderPreview();
    }
});

// Live preview updates for all controls when editing
fontSize.addEventListener('input', () => {
    if (editingIndex >= 0 && textItems[editingIndex]) {
        textItems[editingIndex].fontSize = parseInt(fontSize.value);
        renderPreview();
    }
});

textColor.addEventListener('input', () => {
    if (editingIndex >= 0 && textItems[editingIndex]) {
        textItems[editingIndex].textColor = textColor.value;
        renderPreview();
    }
});

bgColor.addEventListener('input', () => {
    if (editingIndex >= 0 && textItems[editingIndex]) {
        textItems[editingIndex].bgColor = bgColor.value;
        renderPreview();
    }
});

bgOpacity.addEventListener('input', () => {
    if (editingIndex >= 0 && textItems[editingIndex]) {
        textItems[editingIndex].bgOpacity = parseInt(bgOpacity.value);
        renderPreview();
    }
});

textContent.addEventListener('input', () => {
    if (editingIndex >= 0 && textItems[editingIndex]) {
        textItems[editingIndex].text = textContent.value;
        renderPreview();
    }
});

// Add text
addTextBtn.addEventListener('click', () => {
    const text = textContent.value.trim();
    if (!text) {
        // Don't use alert() - it blocks focus. Use setTimeout to refocus after validation
        setTimeout(() => {
            textContent.focus();
            textContent.style.border = '2px solid #ef4444';
            setTimeout(() => {
                textContent.style.border = '';
            }, 2000);
        }, 0);
        return;
    }
    
    if (!videoInputPath) {
        showNotification(i18n ? i18n.messages.errorNoVideo : 'Prvo učitajte video!', 'error');
        return;
    }
    
    const start = parseFloat(startTime.value);
    const end = parseFloat(endTime.value);
    
    if (end <= start) {
        showNotification(i18n ? i18n.messages.errorEndTime : 'Kraj mora biti nakon početka!', 'error');
        return;
    }
    
    if (end > videoDuration) {
        const msg = i18n ? 
            i18n.messages.errorVideoDuration.replace('{duration}', videoDuration.toFixed(1)) :
            `Kraj ne može biti duži od trajanja videa (${videoDuration.toFixed(1)}s)!`;
        showNotification(msg, 'error');
        return;
    }
    
    console.log('=== ADDING TEXT ===');
    console.log('Position:', selectedPosition);
    console.log('Align:', selectedAlign);
    console.log('Font size:', fontSize.value);
    
    const textItem = {
        text: text,
        startTime: start,
        endTime: end,
        position: selectedPosition,
        align: selectedAlign,
        fontSize: parseInt(fontSize.value),
        fontFamily: fontFamily.value,
        textColor: textColor.value,
        bgColor: bgColor.value,
        bgOpacity: parseInt(bgOpacity.value)
    };
    
    console.log('Created textItem:', textItem);
    
    if (editingIndex >= 0) {
        textItems[editingIndex] = textItem;
        editingIndex = -1;
        addTextBtn.textContent = `➕ ${i18n ? i18n.ui.addText : 'Dodaj Tekst'}`;
    } else {
        textItems.push(textItem);
    }
    
    textItems.sort((a, b) => a.startTime - b.startTime);
    
    renderTimeline();
    updateProcessButton();
    resetForm();
    renderPreview();
});

// Simple notification function (non-blocking)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Clear all
clearAllBtn.addEventListener('click', () => {
    if (textItems.length === 0) return;
    const msg = i18n ? i18n.messages.confirmDeleteAll : 'Sigurno želite obrisati sve tekstove?';
    if (confirm(msg)) {
        textItems = [];
        renderTimeline();
        updateProcessButton();
        renderPreview();
    }
});

// Render timeline
function renderTimeline() {
    if (textItems.length === 0) {
        timeline.innerHTML = `
            <div class="timeline-empty">
                <p>${i18n ? i18n.ui.timelineEmpty : 'Nema tekstova'}</p>
                <p class="help-text">${i18n ? i18n.ui.timelineHelp : 'Dodajte tekstove gore'}</p>
            </div>
        `;
        document.getElementById('visualTimeline').style.display = 'none';
        return;
    }
    
    // Show visual timeline
    document.getElementById('visualTimeline').style.display = 'block';
    renderVisualTimeline();
    
    timeline.innerHTML = textItems.map((item, index) => `
        <div class="timeline-item ${editingIndex === index ? 'active' : ''}" data-index="${index}">
            <div class="timeline-content">
                <div class="timeline-time">${item.startTime}s - ${item.endTime}s</div>
                <div class="timeline-text">${item.text}</div>
                <div class="timeline-details">
                    ${item.fontSize}px • ${item.align} • ${item.position}
                </div>
            </div>
            <div class="timeline-actions">
                <button class="action-btn edit-btn" data-index="${index}">✏️</button>
                <button class="action-btn delete-btn" data-index="${index}">🗑️</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editText(parseInt(btn.dataset.index)));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteText(parseInt(btn.dataset.index)));
    });
}

// Render visual timeline bar
function renderVisualTimeline() {
    const track = document.getElementById('timelineTrack');
    const labels = document.getElementById('timelineTimeLabels');
    
    if (!videoDuration || textItems.length === 0) return;
    
    // Clear previous segments
    track.innerHTML = '';
    
    // Render text segments
    textItems.forEach((item, index) => {
        const startPercent = (item.startTime / videoDuration) * 100;
        const widthPercent = ((item.endTime - item.startTime) / videoDuration) * 100;
        
        const segment = document.createElement('div');
        segment.className = `timeline-segment ${editingIndex === index ? 'active' : ''}`;
        segment.style.left = startPercent + '%';
        segment.style.width = widthPercent + '%';
        segment.title = `${item.text} (${item.startTime}s - ${item.endTime}s)`;
        segment.dataset.index = index;
        
        const displayText = item.text.replace(/\n/g, ' ').substring(0, 30);
        segment.textContent = displayText + (item.text.length > 30 ? '...' : '');
        
        // Click to edit
        segment.addEventListener('click', (e) => {
            e.stopPropagation();
            editText(index);
        });
        
        track.appendChild(segment);
    });
    
    // Click on track to jump to time
    track.addEventListener('click', (e) => {
        if (e.target === track && videoElement) {
            const rect = track.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const time = percentage * videoDuration;
            
            videoElement.currentTime = time;
            timelineSlider.value = percentage * 100;
            renderPreview();
            updateTimeDisplay();
        }
    });
    
    // Render time labels
    const labelCount = Math.min(10, Math.ceil(videoDuration / 30));
    let labelsHTML = '';
    for (let i = 0; i <= labelCount; i++) {
        const time = (videoDuration / labelCount) * i;
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        labelsHTML += `<span>${mins}:${secs.toString().padStart(2, '0')}</span>`;
    }
    labels.innerHTML = labelsHTML;
}

function editText(index) {
    const item = textItems[index];
    textContent.value = item.text;
    startTime.value = item.startTime;
    endTime.value = item.endTime;
    fontSize.value = item.fontSize;
    textAlign.value = item.align;
    textColor.value = item.textColor;
    bgColor.value = item.bgColor;
    bgOpacity.value = item.bgOpacity;
    
    document.querySelectorAll('.pos-btn-grid').forEach(b => b.classList.remove('active'));
    const posBtn = document.querySelector(`.pos-btn-grid[data-position="${item.position}"]`);
    if (posBtn) {
        posBtn.classList.add('active');
    }
    selectedPosition = item.position;
    selectedAlign = item.align;
    
    editingIndex = index;
    addTextBtn.textContent = '💾 Spremi Promjene';
    
    document.querySelectorAll('.timeline-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-index="${index}"]`).classList.add('active');
    
    // Jump to text time
    if (videoElement) {
        const midTime = (item.startTime + item.endTime) / 2;
        videoElement.currentTime = midTime;
        timelineSlider.value = (midTime / videoDuration) * 100;
        renderPreview();
        updateTimeDisplay();
    }
}

function deleteText(index) {
    const msg = i18n ? i18n.messages.confirmDelete : 'Obrisati ovaj tekst?';
    if (confirm(msg)) {
        textItems.splice(index, 1);
        renderTimeline();
        updateProcessButton();
        renderPreview();
    }
}

function resetForm() {
    textContent.value = '';
    const lastEnd = textItems.length > 0 ? textItems[textItems.length - 1].endTime : 0;
    startTime.value = lastEnd;
    endTime.value = Math.min(lastEnd + 15, videoDuration);
    
    if (editingIndex >= 0) {
        editingIndex = -1;
        addTextBtn.textContent = '➕ Dodaj Tekst';
        document.querySelectorAll('.timeline-item').forEach(el => el.classList.remove('active'));
    }
}

function updateProcessButton() {
    // Always enable if we have video and texts
    processBtn.disabled = !(videoInputPath && textItems.length > 0);
}

// Process video
processBtn.addEventListener('click', async () => {
    if (!videoInputPath || textItems.length === 0) return;
    
    // If no output path, prompt for it now
    if (!videoOutputPath) {
        const fileName = videoInputPath.split(/[\\/]/).pop().replace(/\.[^/.]+$/, '_edited.mp4');
        const filePath = await window.electronAPI.selectOutputFile(fileName);
        
        if (!filePath) {
            // User cancelled
            return;
        }
        
        videoOutputPath = filePath;
        outputPathDisplay.querySelector('.path').textContent = filePath;
    }
    
    isProcessing = true;
    processBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    progressOverlay.style.display = 'flex';
    logOutput.textContent = (i18n ? i18n.ui.processing : 'Pokretanje FFmpeg-a...') + '\n';
    
    try {
        console.log('=== RENDERER: Sending to FFmpeg ===');
        console.log('videoWidth:', videoWidth);
        console.log('videoHeight:', videoHeight);
        console.log('Video element:', videoElement ? videoElement.videoWidth : 'null');
        
        // Pre-wrap all text items using canvas measureText (same as preview)
        const wrappedTextItems = textItems.map(item => {
            const ctx = previewCanvas.getContext('2d');
            ctx.font = `${item.fontSize}px ${item.fontFamily || "Arial"}`;
            
            // Word wrap function (same as in drawTextOnCanvas)
            function wrapText(text, maxWidth) {
                const words = text.split(' ');
                const lines = [];
                let currentLine = '';
                
                for (const word of words) {
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const metrics = ctx.measureText(testLine);
                    
                    if (metrics.width > maxWidth) {
                        if (currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            lines.push(word);
                        }
                    } else {
                        currentLine = testLine;
                    }
                }
                
                if (currentLine) {
                    lines.push(currentLine);
                }
                
                return lines.length > 0 ? lines : [text];
            }
            
            // Split by manual line breaks first, then apply word wrap
            const manualLines = item.text.split('\n').filter(line => line.trim());
            const maxWidth = previewCanvas.width * 0.8;
            
            let allLines = [];
            manualLines.forEach(line => {
                const wrapped = wrapText(line, maxWidth);
                allLines.push(...wrapped);
            });
            
            // Return item with pre-wrapped text (joined with \n)
            return {
                ...item,
                text: allLines.join('\n')
            };
        });
        
        console.log('Text items wrapped in renderer before FFmpeg');
        
        const result = await window.electronAPI.processVideo(
            videoInputPath,
            videoOutputPath,
            wrappedTextItems,
            useGPU,
            videoWidth
        );
        
        if (result.cancelled) {
            alert(i18n ? i18n.messages.processingCancelled : 'Obrada prekinuta');
        } else {
            progressFill.style.width = '100%';
            progressText.textContent = '100% - ' + (i18n ? i18n.ui.processing : 'Gotovo!');
            const message = i18n ? 
                i18n.messages.processingComplete.replace('{path}', videoOutputPath) :
                'Video uspješno obrađen!\n\nSpremljeno: ' + videoOutputPath;
            alert(message);
        }
    } catch (error) {
        let errorMsg = error.message;
        
        // Better error messages for GPU
        if (errorMsg.includes('[object Object]')) {
            errorMsg = i18n ? 
                'GPU ubrzanje nije uspjelo. Pokušajte ponovno bez GPU ubrzanja (Postavke → GPU Ubrzanje).' :
                'GPU acceleration failed. Try again without GPU (Settings → GPU Acceleration).';
        }
        
        alert((i18n ? i18n.messages.errorProcessing.replace('{message}', '') : 'Greška: ') + errorMsg);
        
        if (error.log) {
            logOutput.textContent += '\n--- ' + (i18n ? 'Greška' : 'Error') + ' ---\n' + error.log;
        }
    } finally {
        isProcessing = false;
        processBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        setTimeout(() => {
            progressOverlay.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        }, 2000);
    }
});

// Stop processing
stopBtn.addEventListener('click', async () => {
    if (!isProcessing) return;
    
    try {
        await window.electronAPI.stopProcessing();
        logOutput.textContent += '\n--- Zaustavljeno ---\n';
    } catch (error) {
        console.error('Error stopping:', error);
    }
});

// Listen for FFmpeg progress
window.electronAPI.onFFmpegProgress((data) => {
    if (videoDuration > 0) {
        const progress = (data.currentTime / videoDuration) * 100;
        progressFill.style.width = progress + '%';
        progressText.textContent = `${Math.round(progress)}% - ${data.currentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s`;
    }
    
    logOutput.textContent += data.log;
    logOutput.scrollTop = logOutput.scrollHeight;
});

// Initialize
renderTimeline();
updateProcessButton();
