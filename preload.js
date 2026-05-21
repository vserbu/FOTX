const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
    selectOutputFile: (defaultName) => ipcRenderer.invoke('select-output-file', defaultName),
    getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
    saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
    openProject: () => ipcRenderer.invoke('open-project'),
    processVideo: (inputPath, outputPath, textItems, useHardwareAccel, videoWidth) => ipcRenderer.invoke('process-video', inputPath, outputPath, textItems, useHardwareAccel, videoWidth),
    stopProcessing: () => ipcRenderer.invoke('stop-processing'),
    getVideoMetadata: (videoPath) => ipcRenderer.invoke('get-video-metadata', videoPath),
    detectGPU: () => ipcRenderer.invoke('detect-gpu'),
    onFFmpegProgress: (callback) => ipcRenderer.on('ffmpeg-progress', (event, data) => callback(data)),
    onMenuOpenVideo: (callback) => ipcRenderer.on('menu-open-video', callback),
    onMenuSaveLocation: (callback) => ipcRenderer.on('menu-save-location', callback),
    onMenuSaveProject: (callback) => ipcRenderer.on('menu-save-project', callback),
    onMenuOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
    onMenuToggleGPU: (callback) => ipcRenderer.on('menu-toggle-gpu', (event, checked) => callback(checked)),
    onLanguageChanged: (callback) => ipcRenderer.on('language-changed', (event, lang) => callback(lang)),
    onFontChanged: (callback) => ipcRenderer.on('font-changed', (event, font) => callback(font))
});
