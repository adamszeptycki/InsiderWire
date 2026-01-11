// Simple offscreen document for audio recording
console.log('Offscreen document script loaded');

// Add a global check to ensure the script is working
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Chrome runtime API is available');
} else {
  console.error('Chrome runtime API is not available');
}

interface AudioRecordingState {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  streamId: string | null;
  startTime: number | null;
}

const recordingState: AudioRecordingState = {
  mediaRecorder: null,
  audioChunks: [],
  streamId: null,
  startTime: null
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Offscreen received message:', request.type);
  
  switch (request.type) {
    case 'START_RECORDING':
      handleStartRecording(request.streamId)
        .then(() => {
          console.log('Recording started successfully');
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('Recording failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'STOP_RECORDING':
      handleStopRecording()
        .then((audioBlob) => {
          // Convert blob to base64 for transfer
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('Recording stopped and converted to base64');
            sendResponse({ 
              success: true, 
              audioData: reader.result,
              duration: Date.now() - (recordingState.startTime || Date.now())
            });
          };
          reader.readAsDataURL(audioBlob);
        })
        .catch((error) => {
          console.error('Stop recording failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'GET_RECORDING_STATUS':
      sendResponse({ 
        isRecording: recordingState.mediaRecorder !== null,
        duration: recordingState.startTime ? Date.now() - recordingState.startTime : 0
      });
      return true;
      
    case 'TEST_CONNECTION':
      console.log('Test connection request received');
      sendResponse({ success: true, message: 'Offscreen document is working' });
      return true;
      
    default:
      console.warn('Unknown message type:', request.type);
      return false;
  }
});

async function handleStartRecording(streamId: string): Promise<void> {
  try {
    console.log('Starting recording with streamId:', streamId);
    
    // Stop any existing recording
    if (recordingState.mediaRecorder) {
      await handleStopRecording();
    }

    // Get the media stream from the streamId
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      } as any,
      video: false
    });

    console.log('Media stream obtained');

    // Create MediaRecorder with WebM format
    const options = {
      mimeType: 'audio/webm;codecs=opus'
    };

    const output = new AudioContext();
    const source = output.createMediaStreamSource(stream);
    source.connect(output.destination);
    
    recordingState.mediaRecorder = new MediaRecorder(stream, options);
    recordingState.audioChunks = [];
    recordingState.streamId = streamId;
    recordingState.startTime = Date.now();

    // Handle data available event
    recordingState.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordingState.audioChunks.push(event.data);
      }
    };

    // Handle recording errors
    recordingState.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      chrome.runtime.sendMessage({ 
        type: 'RECORDING_ERROR', 
        error: 'Recording failed' 
      });
    };

    // Start recording
    recordingState.mediaRecorder.start(1000); // Capture in 1-second chunks
    console.log('MediaRecorder started');
    
    // Notify background script that recording started
    chrome.runtime.sendMessage({ type: 'RECORDING_STARTED' });
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

async function handleStopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!recordingState.mediaRecorder) {
      reject(new Error('No active recording'));
      return;
    }

    console.log('Stopping recording');

    recordingState.mediaRecorder.onstop = () => {
      // Create a blob from all chunks
      const audioBlob = new Blob(recordingState.audioChunks, { 
        type: 'audio/webm;codecs=opus' 
      });
      
      console.log('Recording stopped, blob created:', audioBlob.size, 'bytes');
      
      // Clean up
      recordingState.mediaRecorder = null;
      recordingState.audioChunks = [];
      recordingState.streamId = null;
      recordingState.startTime = null;
      
      // Notify background script
      chrome.runtime.sendMessage({ type: 'RECORDING_STOPPED' });
      
      resolve(audioBlob);
    };

    // Stop all tracks
    recordingState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    // Stop the recorder
    recordingState.mediaRecorder.stop();
  });
}