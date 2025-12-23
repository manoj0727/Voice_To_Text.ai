# Voice to Text Desktop App

A high-performance, real-time voice-to-text desktop application built with **Tauri 2.0**, **React 19**, and **Deepgram AI**. Inspired by [Wispr Flow](https://www.wispr.ai/), this app delivers near-instant speech transcription with visual audio feedback.

## Features

- **Push-to-Talk Interface**: Hold button or spacebar to record, release to stop
- **Real-Time Transcription**: ~20ms audio streaming for near-zero latency
- **Live Audio Waveform**: Visual feedback showing voice activity in real-time
- **Pre-Connected WebSocket**: Connection established on app load for instant response
- **Copy to Clipboard**: One-click copy using native Tauri clipboard API
- **Dark Theme UI**: Pure black, distraction-free interface
- **Cross-Platform**: Windows, macOS, and Linux support

## Quick Start

### Prerequisites

1. **Node.js** (v18+): [nodejs.org](https://nodejs.org/)
2. **Rust**: Install via [rustup.rs](https://rustup.rs/)
3. **Deepgram API Key**: Free at [console.deepgram.com](https://console.deepgram.com/)

#### Platform-Specific

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

**Windows:**
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd Voice_To_Text.ai
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

## Architecture

```
src/
├── components/              # React UI Components
│   ├── RecordButton.tsx        # Push-to-talk with waveform visualization
│   ├── TranscriptDisplay.tsx   # Live transcript display
│   ├── StatusBar.tsx           # Connection status indicator
│   ├── ErrorMessage.tsx        # Error handling UI
│   └── ApiKeySettings.tsx      # API key configuration
├── hooks/
│   └── useVoiceToText.ts       # Core voice-to-text state management
├── services/
│   ├── audioCapture.ts         # Web Audio API integration
│   └── deepgramService.ts      # Deepgram WebSocket client
├── types/
│   └── index.ts                # TypeScript definitions
├── App.tsx                     # Main application
└── App.css                     # Global styles

src-tauri/
├── src/
│   ├── lib.rs                  # Tauri plugin configuration
│   └── main.rs                 # Native app entry point
├── capabilities/
│   └── default.json            # Security permissions
└── tauri.conf.json             # App configuration
```

## Architectural Decisions

### 1. Real-Time Audio Pipeline

**Challenge**: Minimize latency between speaking and seeing text.

**Solution**:
- Audio chunks sent every **20ms** (vs typical 250ms)
- Deepgram `endpointing: 10` for fast utterance detection
- `no_delay: true` flag for immediate results
- Connection kept alive between recordings

```typescript
// Ultra-low latency configuration
this.mediaRecorder.start(20);  // 20ms chunks

this.connection = deepgram.listen.live({
  model: 'nova-2',
  interim_results: true,
  endpointing: 10,
  no_delay: true,
});
```

### 2. Pre-Connection Strategy

**Challenge**: WebSocket handshake adds ~200-500ms delay on first recording.

**Solution**: Pre-connect to Deepgram when API key is loaded, before user starts speaking.

```typescript
// Pre-connect when API key becomes available
useEffect(() => {
  if (apiKey && hasPermission !== false) {
    preConnect();  // WebSocket ready before user clicks
  }
}, [apiKey, hasPermission]);
```

### 3. Visual Audio Feedback

**Challenge**: Users need confirmation that the app is "hearing" them.

**Solution**: RMS-based audio level detection with waveform visualization.

```typescript
// Calculate RMS for voice detection
const rms = Math.sqrt(sum / dataArray.length);
const normalizedLevel = Math.min(rms * 3, 1);
```

- 20-bar waveform that scrolls with new audio levels
- Green gradient bars with glow effect
- Updates every animation frame (~60fps)

### 4. Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| `audioCapture.ts` | Microphone access, MediaRecorder, audio analysis |
| `deepgramService.ts` | WebSocket connection, API communication |
| `useVoiceToText.ts` | State management, orchestration |
| Components | Pure UI rendering |

### 5. Error Handling Strategy

Errors are categorized by type for appropriate user feedback:

```typescript
type ErrorType = 'permission' | 'network' | 'api' | 'audio' | 'unknown';
```

- **Permission**: Guide user to system settings
- **Network**: Suggest checking connection
- **API**: Validate API key
- **Audio**: Check microphone availability

### 6. Tauri vs Electron

**Why Tauri?**
- **Binary size**: ~10MB vs ~150MB+ for Electron
- **Memory usage**: Uses system WebView, not bundled Chromium
- **Security**: Rust backend, granular permissions
- **Speed**: Native performance, faster startup

## Performance Optimizations

| Optimization | Impact |
|--------------|--------|
| 20ms audio chunks | Near-instant streaming |
| Pre-connection | Zero delay on first recording |
| Keep-alive connection | Instant subsequent recordings |
| `punctuate: false` | Removes processing delay |
| `smart_format: false` | Removes formatting delay |
| RMS audio detection | Low CPU, accurate levels |
| RequestAnimationFrame | Smooth 60fps waveform |

## Known Limitations

1. **Network Dependency**: Requires stable internet for Deepgram API
2. **Deepgram Free Tier**: Limited to ~$200 worth of transcription credits
3. **Transcription Latency**: ~100-300ms inherent network/API latency (unavoidable)
4. **Browser Audio API**: Requires user gesture to start first recording
5. **No Offline Mode**: Speech recognition requires cloud API

## Configuration

### Changing Language

Edit `src/services/deepgramService.ts`:

```typescript
this.connection = deepgram.listen.live({
  model: 'nova-2',
  language: 'es',  // Spanish, French: 'fr', German: 'de', etc.
  // ...
});
```

### Enabling Punctuation

For better formatted text (with slight latency increase):

```typescript
this.connection = deepgram.listen.live({
  punctuate: true,
  smart_format: true,
  // ...
});
```

## Usage

1. **Launch app** → Enter Deepgram API key on first run
2. **Grant microphone** → Allow when prompted
3. **Record** → Hold button or press spacebar
4. **Speak** → Watch waveform and live transcription
5. **Release** → Text is finalized
6. **Copy** → Click copy button to clipboard

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Microphone denied" | Check System Preferences → Privacy → Microphone |
| No transcription | Verify API key at console.deepgram.com |
| Waveform not moving | Check microphone is not muted |
| Slow transcription | Check internet connection speed |
| Build fails | Run `rustc --version` to verify Rust installation |

## Tech Stack

- **[Tauri 2.0](https://tauri.app/)** - Rust-based desktop framework
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite 7](https://vitejs.dev/)** - Build tool
- **[Deepgram Nova-2](https://deepgram.com/)** - Speech-to-text AI

## Scripts

```bash
npm run dev          # Vite dev server only
npm run build        # Build frontend
npm run tauri dev    # Full app development mode
npm run tauri build  # Production build
```

## License

MIT License

## Acknowledgments

- Inspired by [Wispr Flow](https://www.wispr.ai/)
- Powered by [Deepgram](https://deepgram.com/)
- Built with [Tauri](https://tauri.app/)
