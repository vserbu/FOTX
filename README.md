# FOTX - FFmpeg Overlay Text

**F**fmpeg **O**verlay **Te**x**t** - Desktop application for adding text overlays to videos using FFmpeg.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://github.com/vserbu/fotx/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

- **True WYSIWYG Preview** - Pixel-perfect preview matching final video output
- **Live Preview While Typing** - Text appears on video instantly as you type
- **Automatic Word Wrap** - Text automatically wraps at 80% screen width
- **Real-time Position Updates** - Move text anywhere and see it instantly
- **Save/Load Projects** - Continue editing later with `.ftep` project files
- **Multi-line Text Support** - Press Enter for manual line breaks
- **9-Position Grid** - Place text anywhere on screen
- **Font Selection** - Choose from all system fonts
- **Quality Control** - Lossless (default) or compressed output
- **GPU Acceleration** - Automatic detection for AMD, NVIDIA, and Intel
- **Multi-language Interface** - Croatian and English
- **Croatian Diacritics** - Full support for č, ć, š, ž, đ

## 🚀 Installation

### Prerequisites
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)

### Setup

```bash
# Clone repository
git clone https://github.com/vserbu/fotx.git
cd fotx

# Install dependencies
npm install

# Run application
npm start
```

### Build Installer

```bash
# Create Windows installer
npm run build:win
```

Creates a standalone `.exe` installer (~150-200MB) with embedded Node.js, FFmpeg, and all dependencies.

## 📖 Usage

1. **Open Video** - File → Open Video (Ctrl+O)
2. **Type Text** - Text appears on video instantly as you type
3. **Set Position** - Click grid to move text, updates in real-time
4. **Add Text** - Click "Add Text" to confirm
5. **Process** - Click "Process Video" to render

### Keyboard Shortcuts
- **Ctrl+O** - Open video
- **Ctrl+S** - Choose save location
- **Ctrl+Shift+S** - Save project
- **Ctrl+Shift+O** - Open project
- **F12** - Toggle Developer Tools

## 🎨 Features in Detail

### True WYSIWYG Preview
Canvas renders at actual video resolution (e.g., 1920x1080) and scales down for display. What you see is exactly what you get in the final video.

### Live Preview While Typing
Start typing and your text appears on the video immediately — no need to click "Add" first. Change font, color, size, or position and see updates instantly.

### Automatic Word Wrap
Text automatically wraps to new lines when reaching 80% of screen width. Uses Canvas `measureText()` for pixel-perfect accuracy in both preview and final video.

### Font Selection
Choose from all fonts installed on your system:
- Arial, Times New Roman, Calibri, Verdana, etc.
- Each text can have its own font
- Fonts loaded automatically from `C:\Windows\Fonts`

### Quality Settings
**Settings → Output Quality:**
- **Lossless (Default)** - CRF 15, maintains original quality
- **Compressed** - CRF 28, smaller file size

### GPU Acceleration
Automatically detects and uses:
- **AMD Radeon** - h264_amf encoder
- **NVIDIA** - h264_nvenc encoder
- **Intel** - h264_qsv encoder
- Falls back to CPU if GPU unavailable

### Project Files
Save your work as `.ftep` (FOTX Project) files:
- Stores video path, all texts, timings, positions, colors, fonts
- Resume editing anytime
- JSON format for easy backup

## 🛠️ Development

### Project Structure
```
fotx/
├── main.js              # Electron main process, FFmpeg processing
├── renderer.js          # UI logic, canvas preview, word wrap
├── preload.js           # IPC bridge
├── index.html           # Application interface
├── styles.css           # Dark theme styling
├── locales/
│   ├── hr.json         # Croatian translations
│   └── en.json         # English translations
├── package.json
├── CHANGELOG.md
└── README.md
```

### Technologies
- **Electron** - Desktop framework
- **FFmpeg** - Video processing
- **Canvas API** - WYSIWYG preview
- **Node.js** - Backend processing

## 📋 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Current Version: 1.0.4 (Stable)

**What's new:**
- Live preview while typing text
- Real-time position updates
- FFmpeg path fix for packaged app
- All controls update preview instantly

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/vserbu/fotx/issues) with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your system info (OS, Node version)

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Video processing powered by [FFmpeg](https://ffmpeg.org/)
- Font rendering uses system TrueType fonts

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ by [vserbu](https://github.com/vserbu)**

---

## 🌟 Star History

If you find FOTX useful, please consider giving it a star on GitHub!
