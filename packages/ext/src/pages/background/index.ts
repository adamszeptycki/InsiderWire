console.log('background script loaded');

// Store selected elements data
let selectedElementsData: any = null;

// Audio recording state
let offscreenCreated = false;
let currentRecordingTabId: number | null = null;

// Create offscreen document for audio recording
async function createOffscreenDocument() {
  if (offscreenCreated) return;
  
  try {
    console.log('Creating offscreen document...');
    const offscreenUrl = chrome.runtime.getURL('src/pages/offscreen/index.html');
    console.log('Offscreen document URL:', offscreenUrl);
    
    // Check if an offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as any]
    });
    
    if (existingContexts.length > 0) {
      console.log('Offscreen document already exists');
      offscreenCreated = true;
      return;
    }
    
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['USER_MEDIA' as chrome.offscreen.Reason],
      justification: 'Recording audio from browser tabs'
    });
    offscreenCreated = true;
    console.log('Offscreen document created successfully');
    
    // Wait a bit for the document to fully initialize
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed to create offscreen document:', error);
    // Try to check if document exists anyway
    try {
      const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT' as any]
      });
      
      if (existingContexts.length > 0) {
        console.log('Offscreen document exists despite error');
        offscreenCreated = true;
        return;
      }
    } catch (contextError) {
      console.error('Failed to check contexts:', contextError);
    }
    
    throw error;
  }
}

// Handle extension icon click to open side panel and start selection
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // First, open the side panel
    await chrome.sidePanel.open({
      windowId: tab.windowId
    });
    
    // Then send message to content script to start selection
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
    }
  } catch (error) {
    console.error('Failed to open side panel or start selection:', error);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ELEMENTS_SELECTED') {
    // Store the selected elements data
    selectedElementsData = request.data;
    
    // Send to all open panels
    chrome.runtime.sendMessage({
      type: 'SELECTED_ELEMENTS_UPDATE',
      data: selectedElementsData
    });
    
    sendResponse({ success: true });
  } else if (request.type === 'GET_SELECTED_ELEMENTS') {
    // Panel is asking for stored selected elements
    sendResponse({ data: selectedElementsData });
  } else if (request.type === 'OPEN_SIDE_PANEL') {
    // Open the side panel for the sender's window if possible
    let windowId = sender.tab?.windowId;
    if (typeof windowId !== 'number') {
      // Fallback: get the current window
      chrome.windows.getCurrent().then(win => {
        if (typeof win.id === 'number') {
          chrome.sidePanel.open({ windowId: win.id });
        }
      });
    } else {
      chrome.sidePanel.open({ windowId });
    }
    sendResponse({ success: true });
  } else if (request.type === 'CHECK_AUDIO_PERMISSIONS') {
    // Check if we have necessary permissions
    chrome.permissions.contains({
      permissions: ['tabCapture']
    }, (result) => {
      sendResponse({ hasPermission: result });
    });
    return true;
  } else if (request.type === 'REQUEST_AUDIO_PERMISSIONS') {
    // Request audio capture permissions
    chrome.permissions.request({
      permissions: ['tabCapture']
    }, (granted) => {
      sendResponse({ granted });
    });
    return true;
  } else if (request.type === 'START_TAB_AUDIO_RECORDING') {
    startTabAudioRecording(request.tabId)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.type === 'STOP_TAB_AUDIO_RECORDING') {
    stopTabAudioRecording()
      .then((result) => sendResponse({ success: true, ...result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.type === 'GET_RECORDING_STATUS') {
    // Forward to offscreen document
    chrome.runtime.sendMessage(request, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { success: false, error: 'No response from offscreen document' });
      }
    });
    return true;
  } else if (request.type === 'RECORDING_STARTED' || request.type === 'RECORDING_STOPPED') {
    // Forward recording status updates to panel
    chrome.runtime.sendMessage(request);
  }
  
  return true;
});

// Start recording audio from a specific tab
async function startTabAudioRecording(tabId: number) {
  try {
    console.log('Starting tab audio recording for tab:', tabId);
    // Create offscreen document if needed
    await createOffscreenDocument();
    console.log('Offscreen document created/verified');
    
    // Test offscreen document communication
    const testResponse = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({
        type: 'TEST_CONNECTION'
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response from offscreen document' });
        }
      });
    });
    
    console.log('Test connection response:', testResponse);
    
    if (!testResponse.success) {
      throw new Error(`Offscreen document not responding: ${testResponse.error}`);
    }
    
    // Get stream ID for the tab
    console.log('Getting stream ID for tab:', tabId);
    const streamId = await new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({
        targetTabId: tabId
      }, (streamId) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to get stream ID:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('Stream ID obtained:', streamId);
          resolve(streamId);
        }
      });
    });
    
    // Store the current recording tab
    currentRecordingTabId = tabId;
    
    // Send stream ID to offscreen document to start recording
    console.log('Sending START_RECORDING message to offscreen document');
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({
        type: 'START_RECORDING',
        streamId: streamId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error sending message:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Response from offscreen document:', response);
          resolve(response || { success: false, error: 'No response from offscreen document' });
        }
      });
    });
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to start recording');
    }
  } catch (error) {
    currentRecordingTabId = null;
    throw error;
  }
}

// Stop recording audio
async function stopTabAudioRecording() {
  try {
    // Send stop message to offscreen document
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({
        type: 'STOP_RECORDING'
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response from offscreen document' });
        }
      });
    });
    
    currentRecordingTabId = null;
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to stop recording');
    }
    
    return {
      audioData: response.audioData,
      duration: response.duration
    };
  } catch (error) {
    currentRecordingTabId = null;
    throw error;
  }
}

// Clear data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Stop recording if the recorded tab is closed
  if (tabId === currentRecordingTabId) {
    stopTabAudioRecording().catch(console.error);
  }
  // Optional: Clear selected data when tab closes
  // selectedElementsData = null;
});
