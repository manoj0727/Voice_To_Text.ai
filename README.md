# Voice to Text Desktop App

A cross-platform voice-to-text desktop application built with **Tauri** and **Deepgram**, inspired by [Wispr Flow](https://www.wispr.ai/). This app provides real-time speech-to-text transcription with a push-to-talk interface.

## Features

- **Push-to-Talk Voice Input**: Hold the microphone button to record, release to stop
- **Real-Time Transcription**: Stream audio to Deepgram for live speech-to-text conversion
- **Copy to Clipboard**: One-click copy of transcribed text
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Dark Theme UI**: Clean, modern interface optimized for voice input workflows
- **Error Handling**: Graceful handling of network issues, API errors, and permission denials

## Architecture

```
src/
├── components/           # React UI components
│   ├── RecordButton.tsx     # Push-to-talk button with visual feedback
│   ├── TranscriptDisplay.tsx # Shows transcribed text
│   ├── StatusBar.tsx        # Connection status indicator
│   ├── ErrorMessage.tsx     # Error display component
│   └── ApiKeySettings.tsx   # API key configuration
├── hooks/
│   └── useVoiceToText.ts    # Main hook managing voice-to-text state
├── services/
│   ├── audioCapture.ts      # Microphone access and audio recording
│   └── deepgramService.ts   # Deepgram WebSocket integration
├── types/
│   └── index.ts             # TypeScript type definitions
├── App.tsx                  # Main application component
└── App.css                  # Application styles

src-tauri/
├── src/
│   ├── lib.rs               # Tauri backend setup
│   └── main.rs              # Application entry point
├── tauri.conf.json          # Tauri configuration
└── Cargo.toml               # Rust dependencies
```

### Design Decisions

1. **Separation of Concerns**: Audio capture, transcription, and UI are cleanly separated into distinct services and components.

2. **WebSocket Streaming**: Uses Deepgram's WebSocket API for real-time transcription with low latency (~250ms audio chunks).

3. **React Hooks Pattern**: The `useVoiceToText` hook encapsulates all voice-to-text logic, making it reusable and testable.

4. **Local Storage for API Key**: The Deepgram API key is stored in browser localStorage for persistence across sessions.

5. **CSP Configuration**: Content Security Policy is configured to allow WebSocket connections to Deepgram while maintaining security.

## Prerequisites

Before running the application, ensure you have:

### 1. Rust

Install Rust using rustup:

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Download and run rustup-init.exe from https://rustup.rs
```

After installation, restart your terminal and verify:

```bash
rustc --version
cargo --version
```

### 2. Node.js

Install Node.js (v18 or later) from [nodejs.org](https://nodejs.org/) or using a version manager like nvm.

### 3. Platform-Specific Dependencies

#### macOS
```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### Windows
- Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### 4. Deepgram API Key

1. Sign up for a free account at [Deepgram](https://console.deepgram.com/)
2. Create an API key with "Usage" permissions
3. You'll enter this key in the app on first launch

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Voice_To_Text.ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run tauri dev
   ```

4. **Build for production**:
   ```bash
   npm run tauri build
   ```

The built application will be in `src-tauri/target/release/bundle/`.

## Usage

1. **Launch the app** - On first launch, you'll be prompted to enter your Deepgram API key.

2. **Grant microphone permission** - When prompted, allow the app to access your microphone.

3. **Start recording**:
   - Click and hold the microphone button to start recording
   - Speak clearly into your microphone
   - Release the button to stop recording

4. **View transcription** - Your speech will be transcribed in real-time in the transcript area.

5. **Copy text** - Click the "Copy" button to copy the transcribed text to your clipboard.

6. **Clear transcript** - Click "Clear" to start a new transcription session.

## Configuration

### Changing the Deepgram Model

The app uses Deepgram's `nova-2` model by default. To change this, modify `src/services/deepgramService.ts`:

```typescript
this.config = {
  model: 'nova-2',      // Change to 'nova', 'enhanced', etc.
  language: 'en',       // Change language code
  punctuate: true,
  interimResults: true,
  ...config,
};
```

### Supported Languages

Deepgram supports many languages. Common codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `zh` - Chinese

See [Deepgram documentation](https://developers.deepgram.com/docs/language) for full list.

## Known Limitations

1. **Browser-based Audio API**: Audio capture uses the Web Audio API, which requires user interaction to start.

2. **Network Dependency**: Real-time transcription requires a stable internet connection.

3. **API Usage**: Deepgram API has usage limits on the free tier. Monitor your usage at [console.deepgram.com](https://console.deepgram.com/).

4. **Keyboard Shortcuts**: Spacebar toggle mentioned in UI is not yet implemented (future enhancement).

## Troubleshooting

### "Microphone permission denied"
- Check your system privacy settings
- macOS: System Preferences → Security & Privacy → Privacy → Microphone
- Windows: Settings → Privacy → Microphone

### "Connection error" or WebSocket fails
- Verify your internet connection
- Check if your Deepgram API key is valid
- Ensure your firewall allows WebSocket connections

### Audio not being captured
- Try a different microphone
- Check if another application is using the microphone
- Restart the application

### Build errors
- Ensure Rust is properly installed: `rustc --version`
- On Linux, verify all dependencies are installed
- Clear build cache: `rm -rf node_modules && npm install`

## Development

### Project Structure

- **Frontend (React + TypeScript)**: Located in `src/`
- **Backend (Rust + Tauri)**: Located in `src-tauri/`

### Available Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Build frontend
npm run tauri dev    # Start Tauri in development mode
npm run tauri build  # Build production app
```

### Adding New Features

1. For UI changes, modify components in `src/components/`
2. For audio/transcription logic, modify services in `src/services/`
3. For Tauri/native features, modify `src-tauri/src/`

## Tech Stack

- **[Tauri 2.0](https://tauri.app/)** - Cross-platform desktop framework
- **[React 19](https://react.dev/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Deepgram](https://deepgram.com/)** - Speech-to-text API

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- Inspired by [Wispr Flow](https://www.wispr.ai/)
- Powered by [Deepgram](https://deepgram.com/) speech recognition
- Built with [Tauri](https://tauri.app/)
