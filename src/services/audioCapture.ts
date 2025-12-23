/**
 * Audio Capture Service
 * Handles microphone access, audio recording, and audio data streaming
 */

export type AudioLevelCallback = (level: number) => void;

export class AudioCaptureService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  private onDataCallback: ((data: Blob) => void) | null = null;
  private onAudioLevelCallback: AudioLevelCallback | null = null;
  private animationFrameId: number | null = null;

  /**
   * Request microphone permission and check if access is granted
   */
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      // Release the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Check if microphone permission is already granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch {
      // Some browsers don't support permissions API for microphone
      // In this case, we'll attempt to request permission
      return false;
    }
  }

  /**
   * Start capturing audio from the microphone
   */
  async startCapture(onData: (data: Blob) => void, onAudioLevel?: AudioLevelCallback): Promise<void> {
    this.onDataCallback = onData;
    this.onAudioLevelCallback = onAudioLevel || null;

    try {
      // Get audio stream - use default sample rate for best compatibility
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create AudioContext for audio level analysis
      this.audioContext = new AudioContext();

      // Setup audio analyser for level monitoring
      if (this.onAudioLevelCallback) {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.1; // Very fast response
        source.connect(this.analyser);
        this.startLevelMonitoring();
      }

      // Determine the best MIME type for the browser
      const mimeType = this.getSupportedMimeType();

      // Create MediaRecorder with optimized settings
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
      });

      // Handle data available events - send chunks immediately
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.onDataCallback) {
          this.onDataCallback(event.data);
        }
      };

      // Start recording with minimum time slices for instant streaming
      this.mediaRecorder.start(20); // 20ms chunks for zero-lag response
    } catch (error) {
      this.cleanup();
      throw this.handleError(error);
    }
  }

  /**
   * Start monitoring audio levels
   */
  private startLevelMonitoring(): void {
    if (!this.analyser || !this.onAudioLevelCallback) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.analyser || !this.onAudioLevelCallback) return;

      this.analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS (root mean square) for better voice detection
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
        sum += value * value;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      // Amplify and clamp the level for better visual feedback
      const normalizedLevel = Math.min(rms * 3, 1);

      this.onAudioLevelCallback(normalizedLevel);

      this.animationFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Get a supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback - let browser decide
    return '';
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
    this.onDataCallback = null;
    this.onAudioLevelCallback = null;
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          return new Error('Microphone access denied. Please grant permission in your browser settings.');
        case 'NotFoundError':
          return new Error('No microphone found. Please connect a microphone and try again.');
        case 'NotReadableError':
          return new Error('Microphone is in use by another application.');
        default:
          return new Error(`Audio error: ${error.message}`);
      }
    }
    return error instanceof Error ? error : new Error('Unknown audio capture error');
  }
}

// Export singleton instance
export const audioCaptureService = new AudioCaptureService();
