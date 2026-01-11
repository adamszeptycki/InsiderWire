interface AudioRecording {
  id: string;
  url: string;
  title: string;
  duration: number;
  data: string; // base64 encoded audio data
  timestamp: number;
}

export class AudioCaptureService {
  private static STORAGE_KEY = 'audioRecordings';
  
  /**
   * Save an audio recording to storage
   */
  static async saveRecording(recording: Omit<AudioRecording, 'id' | 'timestamp'>): Promise<AudioRecording> {
    const newRecording: AudioRecording = {
      ...recording,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    const recordings = await this.getAllRecordings();
    recordings.push(newRecording);
    
    await chrome.storage.local.set({ [this.STORAGE_KEY]: recordings });
    
    return newRecording;
  }
  
  /**
   * Get all saved recordings
   */
  static async getAllRecordings(): Promise<AudioRecording[]> {
    const result = await chrome.storage.local.get([this.STORAGE_KEY]);
    return result[this.STORAGE_KEY] || [];
  }
  
  /**
   * Get a specific recording by ID
   */
  static async getRecording(id: string): Promise<AudioRecording | null> {
    const recordings = await this.getAllRecordings();
    return recordings.find(r => r.id === id) || null;
  }
  
  /**
   * Delete a recording
   */
  static async deleteRecording(id: string): Promise<void> {
    const recordings = await this.getAllRecordings();
    const filtered = recordings.filter(r => r.id !== id);
    await chrome.storage.local.set({ [this.STORAGE_KEY]: filtered });
  }
  
  /**
   * Convert base64 audio data to a blob URL for playback
   */
  static createBlobUrl(base64Data: string): string {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/webm' });
    
    return URL.createObjectURL(blob);
  }
  
  /**
   * Download audio recording as a file
   */
  static downloadRecording(recording: AudioRecording, filename?: string): void {
    const url = this.createBlobUrl(recording.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording-${recording.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Get storage usage information
   */
  static async getStorageInfo(): Promise<{ used: number; available: number }> {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0
    };
  }
}