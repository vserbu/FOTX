const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');

let mainWindow;
let currentFFmpegProcess = null;
let currentLanguage = 'hr'; // Default Croatian
let outputQuality = 'lossless'; // 'lossless' or 'compressed'
let selectedFont = 'Arial'; // Default font

// Load language file
function loadLanguage(lang) {
    const langPath = path.join(__dirname, 'locales', `${lang}.json`);
    return JSON.parse(fs.readFileSync(langPath, 'utf8'));
}

let i18n = loadLanguage(currentLanguage);

function createMenu() {
    const menuTemplate = [
        {
            label: i18n.menu.file,
            submenu: [
                {
                    label: i18n.menu.openVideo,
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.send('menu-open-video');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save Project...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-project');
                    }
                },
                {
                    label: 'Open Project...',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: () => {
                        mainWindow.webContents.send('menu-open-project');
                    }
                },
                { type: 'separator' },
                {
                    label: i18n.menu.saveLocation,
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-location');
                    }
                },
                { type: 'separator' },
                {
                    label: i18n.menu.exit,
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: i18n.menu.settings,
            submenu: [
                {
                    label: i18n.menu.gpuAcceleration,
                    type: 'checkbox',
                    checked: false,
                    click: (menuItem) => {
                        mainWindow.webContents.send('menu-toggle-gpu', menuItem.checked);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Output Quality',
                    submenu: [
                        {
                            label: 'Lossless (Default)',
                            type: 'radio',
                            checked: outputQuality === 'lossless',
                            click: () => {
                                outputQuality = 'lossless';
                                console.log('Quality set to: lossless');
                            }
                        },
                        {
                            label: 'Compressed (Smaller file)',
                            type: 'radio',
                            checked: outputQuality === 'compressed',
                            click: () => {
                                outputQuality = 'compressed';
                                console.log('Quality set to: compressed');
                            }
                        }
                    ]
                }
            ]
        },
        {
            label: i18n.menu.language,
            submenu: [
                {
                    label: 'Hrvatski',
                    type: 'radio',
                    checked: currentLanguage === 'hr',
                    click: () => {
                        currentLanguage = 'hr';
                        i18n = loadLanguage('hr');
                        mainWindow.webContents.send('language-changed', 'hr');
                        createMenu(); // Rebuild menu
                    }
                },
                {
                    label: 'English',
                    type: 'radio',
                    checked: currentLanguage === 'en',
                    click: () => {
                        currentLanguage = 'en';
                        i18n = loadLanguage('en');
                        mainWindow.webContents.send('language-changed', 'en');
                        createMenu(); // Rebuild menu
                    }
                }
            ]
        },
        {
            label: i18n.menu.help,
            submenu: [
                {
                    label: i18n.menu.about,
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: i18n.about.title,
                            message: i18n.about.message,
                            detail: i18n.about.detail
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Developer Tools',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'icon.png'),
        title: 'FFmpeg Text Editor'
    });

    createMenu();
    mainWindow.loadFile('index.html');
    
    // Open DevTools with F12
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            mainWindow.webContents.toggleDevTools();
        }
    });
    
    // Send initial language to renderer
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('language-changed', currentLanguage);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle video file selection
ipcMain.handle('select-video-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Handle output file selection
// Get available system fonts
ipcMain.handle('get-system-fonts', async () => {
    try {
        const fontsDir = 'C:\\Windows\\Fonts';
        const files = fs.readdirSync(fontsDir);
        
        // Common font mappings (filename -> display name)
        const fontMap = {
            'arial.ttf': 'Arial',
            'times.ttf': 'Times New Roman',
            'cour.ttf': 'Courier New',
            'comic.ttf': 'Comic Sans MS',
            'verdana.ttf': 'Verdana',
            'georgia.ttf': 'Georgia',
            'trebuc.ttf': 'Trebuchet MS',
            'impact.ttf': 'Impact',
            'calibri.ttf': 'Calibri',
            'consola.ttf': 'Consolas',
            'tahoma.ttf': 'Tahoma'
        };
        
        const fonts = [];
        const seenFonts = new Set();
        
        files.forEach(file => {
            const lowerFile = file.toLowerCase();
            if (fontMap[lowerFile]) {
                const fontName = fontMap[lowerFile];
                if (!seenFonts.has(fontName)) {
                    fonts.push({
                        name: fontName,
                        file: file
                    });
                    seenFonts.add(fontName);
                }
            }
        });
        
        // Sort alphabetically
        fonts.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Found fonts:', fonts.map(f => f.name).join(', '));
        return fonts;
    } catch (error) {
        console.error('Error reading fonts:', error);
        return [{ name: 'Arial', file: 'arial.ttf' }];
    }
});

ipcMain.handle('select-output-file', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [
            { name: 'MP4 Video', extensions: ['mp4'] }
        ]
    });
    
    if (!result.canceled) {
        return result.filePath;
    }
    return null;
});

// Save project
ipcMain.handle('save-project', async (event, projectData) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Project As',
        filters: [
            { name: 'FFmpeg Text Editor Project', extensions: ['ftep'] }
        ]
    });
    
    if (!result.canceled) {
        try {
            fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2), 'utf8');
            return { success: true, path: result.filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, cancelled: true };
});

// Open project
ipcMain.handle('open-project', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open Project',
        filters: [
            { name: 'FFmpeg Text Editor Project', extensions: ['ftep'] }
        ],
        properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const projectData = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
            return { success: true, data: projectData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, cancelled: true };
});

// Detect GPU type
async function detectGPU() {
    console.log('=== Starting GPU Detection ===');
    
    // Try different encoders to see which ones are available
    const testEncoders = [
        { name: 'AMD Radeon', encoder: 'h264_amf', hwaccel: 'auto' },
        { name: 'NVIDIA', encoder: 'h264_nvenc', hwaccel: 'cuda' },
        { name: 'Intel', encoder: 'h264_qsv', hwaccel: 'qsv' }
    ];
    
    for (const test of testEncoders) {
        console.log(`Testing ${test.name} (${test.encoder})...`);
        
        try {
            const result = await new Promise((resolve) => {
                const testProcess = spawn(ffmpegPath, ['-hide_banner', '-encoders']);
                let output = '';
                
                testProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                testProcess.on('close', () => {
                    // Check if encoder is available
                    if (output.includes(test.encoder)) {
                        console.log(`✓ ${test.name} encoder FOUND`);
                        resolve(test);
                    } else {
                        console.log(`✗ ${test.name} encoder NOT FOUND`);
                        resolve(null);
                    }
                });
                
                testProcess.on('error', (err) => {
                    console.log(`✗ ${test.name} test ERROR:`, err.message);
                    resolve(null);
                });
            });
            
            if (result) {
                console.log(`Selected GPU: ${result.name}`);
                console.log('=== GPU Detection Complete ===');
                return result;
            }
        } catch (err) {
            console.log(`Failed to detect ${test.name}:`, err);
        }
    }
    
    console.log('No GPU detected, using CPU');
    console.log('=== GPU Detection Complete ===');
    return null;
}

// Get GPU info
ipcMain.handle('detect-gpu', async () => {
    const gpu = await detectGPU();
    return gpu ? gpu.name : 'CPU';
});

// Process video with FFmpeg
ipcMain.handle('process-video', async (event, inputPath, outputPath, textItems, useHardwareAccel, videoWidth) => {
    return new Promise(async (resolve, reject) => {
        console.log('=== Starting Video Processing ===');
        console.log('Input:', inputPath);
        console.log('Output:', outputPath);
        console.log('Texts:', textItems.length);
        console.log('GPU Acceleration:', useHardwareAccel);
        console.log('Video Width (from renderer):', videoWidth);
        
        // Fallback if videoWidth is 0 or undefined
        if (!videoWidth || videoWidth === 0) {
            console.log('WARNING: videoWidth is 0, using default 1920');
            videoWidth = 1920;
        }
        
        // Build drawtext filters with multi-line support
        // Text is already wrapped by renderer.js using canvas measureText
        const filters = textItems.map(item => {
            console.log('=== PROCESSING TEXT ITEM ===');
            console.log('Text (pre-wrapped from renderer):', item.text);
            console.log('Font size:', item.fontSize);
            
            // Text is already wrapped - just split by \n
            const lines = item.text.split('\n').filter(line => line.trim());
            console.log('Lines:', lines);
            
            const fgColor = '0x' + item.textColor.replace('#', '');
            const boxColor = '0x' + item.bgColor.replace('#', '');
            const opacity = (item.bgOpacity / 100).toFixed(2);
            
            // Use font from text item (selected by user)
            const fontMap = {
                'Arial': 'arial.ttf',
                'Times New Roman': 'times.ttf',
                'Courier New': 'cour.ttf',
                'Comic Sans MS': 'comic.ttf',
                'Verdana': 'verdana.ttf',
                'Georgia': 'georgia.ttf',
                'Trebuchet MS': 'trebuc.ttf',
                'Impact': 'impact.ttf',
                'Calibri': 'calibri.ttf',
                'Consolas': 'consola.ttf',
                'Tahoma': 'tahoma.ttf'
            };
            const fontName = item.fontFamily || 'Arial';
            const fontFile = fontMap[fontName] || 'arial.ttf';
            const fontPath = `C\\:/Windows/Fonts/${fontFile}`;
            console.log(`Using font: ${fontName} (${fontFile})`);
            
            const lineHeight = Math.floor(item.fontSize * 1.2);
            const totalHeight = lines.length * lineHeight;
            
            // Calculate base X position based on position and alignment
            let baseX;
            if (item.position.includes('left')) {
                baseX = '50';
            } else if (item.position.includes('right')) {
                baseX = 'w-text_w-50';
            } else {
                // Center horizontally
                if (item.align === 'left') {
                    baseX = '(w-text_w)/2-text_w/2+50';
                } else if (item.align === 'right') {
                    baseX = '(w+text_w)/2-text_w-50';
                } else {
                    baseX = '(w-text_w)/2';
                }
            }
            
            // Calculate base Y position
            let baseY;
            if (item.position.includes('top')) {
                baseY = 50;
            } else if (item.position.includes('bottom')) {
                baseY = `h-${totalHeight}-50`;
            } else {
                // Center vertically
                baseY = `(h-${totalHeight})/2`;
            }
            
            // Create a drawtext for each line
            return lines.map((line, lineIndex) => {
                const text = line.replace(/'/g, "'\\''").replace(/:/g, '\\:');
                const yOffset = lineIndex * lineHeight;
                const y = typeof baseY === 'number' ? baseY + yOffset : `${baseY}+${yOffset}`;
                
                return `drawtext=fontfile='${fontPath}':text='${text}':fontsize=${item.fontSize}:fontcolor=${fgColor}:box=1:boxcolor=${boxColor}@${opacity}:boxborderw=10:x=${baseX}:y=${y}:enable='between(t,${item.startTime},${item.endTime})'`;
            }).join(',');
        }).join(',');
        
        const args = ['-i', inputPath];
        
        // Detect and use appropriate GPU if enabled
        let gpuInfo = null;
        if (useHardwareAccel) {
            console.log('GPU acceleration requested, detecting GPU...');
            gpuInfo = await detectGPU();
            
            if (gpuInfo) {
                console.log(`Using ${gpuInfo.name} with encoder: ${gpuInfo.encoder}`);
                args.push('-hwaccel', gpuInfo.hwaccel);
                if (gpuInfo.hwaccel === 'cuda') {
                    args.push('-hwaccel_output_format', 'cuda');
                }
            } else {
                console.log('No GPU detected, falling back to CPU');
                event.sender.send('ffmpeg-progress', { 
                    currentTime: 0, 
                    log: '\n⚠️ GPU nije pronađen, koristim CPU...\n' 
                });
            }
        }
        
        args.push('-vf', filters);
        
        // Get original video bitrate for matching
        let originalBitrate = null;
        if (outputQuality === 'lossless') {
            try {
                const metadata = await new Promise((resolve) => {
                    const ffprobe = spawn(ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe'), [
                        '-v', 'error',
                        '-select_streams', 'v:0',
                        '-show_entries', 'stream=bit_rate',
                        '-of', 'default=noprint_wrappers=1:nokey=1',
                        inputPath
                    ]);
                    
                    let output = '';
                    ffprobe.stdout.on('data', (data) => output += data);
                    ffprobe.on('close', () => {
                        const bitrate = parseInt(output.trim());
                        resolve(bitrate > 0 ? bitrate : null);
                    });
                    ffprobe.on('error', () => resolve(null));
                });
                
                originalBitrate = metadata;
                if (originalBitrate) {
                    console.log(`Original video bitrate: ${Math.round(originalBitrate / 1000)}k`);
                }
            } catch (e) {
                console.log('Could not detect original bitrate');
            }
        }
        
        // Video encoding with quality settings
        if (useHardwareAccel && gpuInfo) {
            console.log(`Adding video encoder: ${gpuInfo.encoder}`);
            args.push('-c:v', gpuInfo.encoder);
            
            // Quality settings for GPU
            if (outputQuality === 'lossless') {
                args.push('-qp', '15'); // Higher quality for GPU
                console.log('Quality: Lossless (QP 15)');
            } else {
                args.push('-qp', '28'); // Compressed
                console.log('Quality: Compressed (QP 28)');
            }
        } else {
            console.log('Using default CPU encoder');
            
            // Quality settings for CPU
            if (outputQuality === 'lossless') {
                if (originalBitrate && originalBitrate > 0) {
                    // Match original bitrate
                    args.push('-b:v', originalBitrate.toString());
                    args.push('-maxrate', originalBitrate.toString());
                    args.push('-bufsize', (originalBitrate * 2).toString());
                    console.log(`Quality: Lossless (matching original ${Math.round(originalBitrate / 1000)}k bitrate)`);
                } else {
                    // Fallback to high quality CRF
                    args.push('-crf', '15');
                    args.push('-preset', 'slow');
                    console.log('Quality: Lossless (CRF 15, preset slow)');
                }
            } else {
                args.push('-crf', '28'); // Compressed
                args.push('-preset', 'fast');
                console.log('Quality: Compressed (CRF 28, preset fast)');
            }
        }
        
        args.push('-codec:a', 'copy', '-y', outputPath);
        
        console.log('FFmpeg command:', ffmpegPath);
        console.log('FFmpeg args:', args.join(' '));
        console.log('=== Starting FFmpeg Process ===');
        
        const ffmpeg = spawn(ffmpegPath, args);
        currentFFmpegProcess = ffmpeg;
        
        let stderr = '';
        let hasError = false;
        
        ffmpeg.stderr.on('data', (data) => {
            const dataStr = data.toString();
            stderr += dataStr;
            
            // Check for GPU-specific errors
            if (useHardwareAccel && !hasError) {
                if (dataStr.includes('No NVENC capable devices found') || 
                    dataStr.includes('Cannot load') ||
                    dataStr.includes('Failed to initialize') ||
                    dataStr.includes('Invalid encoder type') ||
                    dataStr.includes('Unknown encoder')) {
                    hasError = true;
                    console.log('GPU ERROR DETECTED:', dataStr);
                    event.sender.send('ffmpeg-progress', { 
                        currentTime: 0, 
                        log: '\n⚠️ GPU ubrzanje nije uspjelo!\n' 
                    });
                }
            }
            
            // Parse progress
            const timeMatch = dataStr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseFloat(timeMatch[3]);
                const currentTime = hours * 3600 + minutes * 60 + seconds;
                
                event.sender.send('ffmpeg-progress', { currentTime, log: dataStr });
            }
        });
        
        ffmpeg.on('close', (code) => {
            currentFFmpegProcess = null;
            console.log('FFmpeg process closed with code:', code);
            console.log('=== Video Processing Complete ===');
            
            if (code === 0) {
                resolve({ success: true, message: 'Video uspješno obrađen!' });
            } else if (code === null) {
                resolve({ success: false, message: 'Obrada prekinuta', cancelled: true });
            } else {
                // If GPU failed, suggest trying without it
                if (useHardwareAccel && hasError) {
                    const errorMsg = `GPU ubrzanje nije uspjelo (greška ${code}).\n\nPokušajte:\n1. Isključite GPU ubrzanje (Postavke → GPU Ubrzanje)\n2. Pokušajte ponovno`;
                    reject({ 
                        success: false, 
                        message: errorMsg, 
                        log: stderr 
                    });
                } else {
                    reject({ 
                        success: false, 
                        message: `FFmpeg greška (kod ${code}). Pogledajte log za detalje.`, 
                        log: stderr 
                    });
                }
            }
        });
        
        ffmpeg.on('error', (err) => {
            currentFFmpegProcess = null;
            console.log('FFmpeg process error:', err);
            reject({ success: false, message: 'Greška pri pokretanju FFmpeg-a: ' + err.message });
        });
    });
});

// Stop video processing
ipcMain.handle('stop-processing', async () => {
    if (currentFFmpegProcess) {
        currentFFmpegProcess.kill('SIGTERM');
        currentFFmpegProcess = null;
        return { success: true, message: 'Obrada zaustavljena' };
    }
    return { success: false, message: 'Nema aktivne obrade' };
});

// Get video metadata
ipcMain.handle('get-video-metadata', async (event, videoPath) => {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', videoPath,
            '-hide_banner'
        ];
        
        const ffmpeg = spawn(ffmpegPath, args);
        
        let stderr = '';
        
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        ffmpeg.on('close', () => {
            // Parse duration
            const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
            if (durationMatch) {
                const hours = parseInt(durationMatch[1]);
                const minutes = parseInt(durationMatch[2]);
                const seconds = parseFloat(durationMatch[3]);
                const duration = hours * 3600 + minutes * 60 + seconds;
                
                // Parse resolution
                const resolutionMatch = stderr.match(/(\d+)x(\d+)/);
                let width = 0, height = 0;
                if (resolutionMatch) {
                    width = parseInt(resolutionMatch[1]);
                    height = parseInt(resolutionMatch[2]);
                }
                
                resolve({ duration, width, height });
            } else {
                reject({ error: 'Nije moguće pročitati video metapodatke' });
            }
        });
        
        ffmpeg.on('error', (err) => {
            reject({ error: 'Greška: ' + err.message });
        });
    });
});
