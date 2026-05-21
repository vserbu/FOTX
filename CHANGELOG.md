# Changelog

All notable changes to FOTX (FFmpeg Overlay Text) will be documented in this file.

## [1.0.0] - 2026-05-08 🎉 STABLE RELEASE

### Project Renamed
- **FFmpeg Text Editor** → **FOTX** (FFmpeg Overlay Text)
- New branding and identity

### Added
- **Quality Settings** - Choose between Lossless (default) and Compressed output
  - Lossless: CRF 18 (near-lossless, larger files)
  - Compressed: CRF 28 (smaller files, good quality)
  - Settings → Output Quality
- **Font Selection** - Choose from 5 fonts:
  - Arial (default)
  - Times New Roman
  - Courier New
  - Comic Sans MS
  - Verdana
  - Settings → Font

### Changed
- **Default quality is now Lossless** - no quality loss from original video
- Output files maintain original quality by default
- Font setting applies to both preview and final video

### Fixed
- Output video file size now matches or slightly exceeds input (lossless)
- True WYSIWYG - preview exactly matches video output
- Font rendering consistent between preview and video

## [0.9.3] - 2026-05-08

### Added
- **Automatic Word Wrap** - Text automatically wraps to new line when reaching 80% of screen width
- Works in both preview and final video output
- Respects manual line breaks (Enter key still works)
- Smart word-based wrapping - never breaks words in the middle

### Changed
- Text wrapping is now automatic - no need to manually press Enter for long text
- Preview accurately shows wrapped text as it will appear in video

## [0.9.2] - 2026-05-08

### Added
- **Live Preview Updates** - Changes to position, alignment, colors, font size, and text update preview immediately while editing
- No need to click "Save Changes" to see preview - instant feedback!

### Changed
- Default text duration increased to **15 seconds** (from 10 seconds)
- All text properties update preview in real-time during editing

### Note
- For automatic word wrap, manually press Enter where you want line breaks
- Preview shows exact text layout as final video

## [0.9.1] - 2026-05-08

### Fixed
- Text input field now maintains focus after validation errors
- Replaced blocking alert() dialogs with non-blocking toast notifications
- Red border flash on empty text field instead of alert
- Smooth notification system for errors, success messages, and info

### Changed
- All validation messages now use toast notifications
- Toast notifications auto-dismiss after 3 seconds
- Better UX - no more focus-stealing dialogs

## [0.9.0] - 2026-05-08 (Release Candidate)

### Added
- **Save Project** - Save your work as `.ftep` file to continue editing later
- **Open Project** - Load saved projects with all texts and settings
- Project files include: video path, all texts, timings, positions, colors, and output path
- File → Save Project (Ctrl+Shift+S)
- File → Open Project (Ctrl+Shift+O)

### Changed
- File menu reorganized with project operations
- Projects use `.ftep` (FFmpeg Text Editor Project) extension

### Notes
- This is a Release Candidate - approaching v1.0.0 stable release
- Save your work and come back anytime to edit or add more texts
- Project files are human-readable JSON format

## [0.8.8] - 2026-05-08

### Fixed
- Loading new video now clears all existing texts from timeline
- Output path is reset when loading new video
- Fresh start for each new video file

### Changed
- Timeline automatically clears when opening new video file

## [0.8.7] - 2026-05-08

### Changed
- DevTools no longer opens automatically on startup
- DevTools moved to menu: Pomoć → Developer Tools
- F12 keyboard shortcut still works to toggle DevTools

## [0.8.6] - 2026-05-08

### Fixed
- Text input field now maintains focus after empty text alert
- Removed default "Moj tekst" value from textarea (now uses placeholder only)
- Text input field remains functional after validation errors

## [0.8.5] - 2026-05-08

### Changed
- **TRUE WYSIWYG!** Preview canvas now renders at actual video resolution (e.g., 1920x1080)
- Preview is scaled down for display but internally matches video pixel-for-pixel
- Font size input now represents actual pixels in final video (60px = 60px in video)
- Default font size changed to 60px (appropriate for Full HD video)
- Maximum font size increased to 400px

### Fixed
- Preview now **exactly** matches final video output
- No more guessing font sizes - what you see is what you get!
- Text positioning, size, and appearance identical between preview and video

## [0.8.4] - 2026-05-08

### Added
- Auto-suggested font size based on video resolution
- Real-time font size preview showing actual video size (e.g., "Preview: 25px → Video: ~60px")
- Font size automatically adjusts for different video resolutions

### Changed
- Font size input now shows helper text with calculated actual video size
- For 1920x1080 video, default font size is now ~25px (renders as ~60px in video)

### Fixed
- Font size now properly scaled between preview canvas (800px) and actual video (e.g., 1920px)
- Preview font size better represents final video output

## [0.8.3] - 2026-05-08

### Fixed
- FFmpeg now uses Arial font (fontfile parameter) for better consistency with preview
- Croatian characters (č, ć, š, ž, đ) now display correctly in output video
- Text positioning in FFmpeg output now matches preview exactly
- Font size and spacing consistent between preview and final video

### Changed
- FFmpeg text rendering improved to match browser preview quality

## [0.8.2] - 2026-05-08

### Fixed
- Preview now correctly displays all 9 positions (top-left, top-right, etc.)
- Text alignment now properly works within position boxes
- Position buttons with `type="button"` to prevent form submission

### Added
- DevTools automatically opens for debugging
- F12 keyboard shortcut to toggle DevTools
- Detailed console logging for position selection and text creation

## [0.8.1] - 2026-05-08

### Added
- 9 position grid (all corners, sides, and center)
- Auto-updating start/end times as video plays or slider moves
- Vertical scroll for timeline when many texts added

### Changed
- Default font size: 25px (from 48px)
- Default alignment: left (from center)
- Default text duration: 10 seconds (from 5 seconds)

## [0.8.0] - 2026-05-07

### Added
- **Visual timeline bar** - Click on timeline to jump to specific text
- **Drag & drop text positioning** - Move texts left/right on timeline
- **Multi-language support** - Croatian and English UI
- **Smart save dialog** - Automatically prompts for save location when processing
- **Interactive timeline** - Click timeline segments to edit texts
- **Play/Pause controls** - Video playback with working slider
- **Real-time preview** - See texts as video plays
- **Text alignment** - Left, Center, Right options
- **Compact position selector** - Top, Center, Bottom (simplified from 9 to 3)
- **Professional menu bar** - File, Settings, Language, Help menus

### Changed
- Complete UI redesign - Modern 2-panel layout
- Moved GPU acceleration to Settings menu
- Moved file operations to File menu
- Improved text editor with better controls
- Better error handling for GPU acceleration
- Cleaner timeline display

### Fixed
- **Timeline slider** - Now updates correctly during playback
- **GPU detection** - Better error handling for unsupported GPUs
- **Multi-line text** - Proper spacing and alignment
- Duplicate variable declaration bug

## [0.7.0] - 2026-05-07

### Added
- Multi-line text support (Enter for new lines)
- AMD GPU support (h264_amf encoder)
- Intel GPU support (h264_qsv encoder)
- Automatic GPU detection (NVIDIA/AMD/Intel)
- GPU fallback to CPU on error

### Changed
- GPU checkbox now shows detected GPU type
- Better error messages for GPU failures

## [0.6.0] - 2026-05-07

### Added
- Live video preview with Canvas rendering
- Preview slider for timeline navigation
- Visual timeline bar showing text segments
- Stop button for canceling video processing
- NVIDIA GPU hardware acceleration support

### Changed
- Improved UI layout with preview section
- Better progress tracking during processing

## [0.5.0] - 2026-05-07

### Added
- Timeline editor for multiple texts
- Precise time control (start/end in seconds)
- Visual timeline showing all texts
- Edit and delete individual texts
- Text sorting by start time

### Changed
- Replaced single text input with timeline system
- Improved text management

## [0.4.0] - 2026-05-07

### Added
- Desktop application with Electron
- Automatic video duration detection
- Video metadata reading (resolution, duration)
- File picker dialogs for video and output
- Embedded FFmpeg binary

### Changed
- Moved from HTML file to desktop app
- Professional desktop interface

## [0.3.0] - 2026-05-07

### Added
- 9 position options for text placement
- Color pickers for text and background
- Background opacity control
- Font size adjustment (12-200px)
- FFmpeg command generation

## [0.2.0] - 2026-05-07

### Added
- Timeline visualization
- Multiple text support with time ranges
- Text styling options

## [0.1.0] - 2026-05-07

### Added
- Initial HTML GUI for FFmpeg text overlay
- Basic text input
- Simple position selection
- FFmpeg command output

---

## Version Naming

- **0.1.x - 0.4.x**: Early prototypes (HTML-based)
- **0.5.x - 0.7.x**: Desktop app development
- **0.8.x**: Beta release with complete feature set
- **0.9.x**: Release candidates (bug fixes only)
- **1.0.0**: Stable release (planned)

## Planned for 1.0.0

- [ ] Font selection
- [ ] Text animations (fade in/out)
- [ ] Export/Import text configurations
- [ ] Batch processing multiple videos
- [ ] Video trimming
- [ ] More output formats
