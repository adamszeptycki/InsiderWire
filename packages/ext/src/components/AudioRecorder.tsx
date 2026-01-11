import React, { useState, useEffect, useRef } from 'react';
import { TabSelector } from './TabSelector';

interface AudioRecorderProps {
  onRecordingComplete?: (audioData: string, duration: number) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<chrome.tabs.Tab | null>(null);
  const [showTabSelector, setShowTabSelector] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Update duration while recording
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  // Listen for recording status updates
  useEffect(() => {
    const handleMessage = (request: any) => {
      if (request.type === 'RECORDING_STARTED') {
        setIsRecording(true);
        setError(null);
      } else if (request.type === 'RECORDING_STOPPED') {
        setIsRecording(false);
      } else if (request.type === 'RECORDING_ERROR') {
        setIsRecording(false);
        setError(request.error || 'Recording failed');
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'CHECK_AUDIO_PERMISSIONS' }, resolve);
      });
      setHasPermission(response.hasPermission);
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setHasPermission(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'REQUEST_AUDIO_PERMISSIONS' }, resolve);
      });
      
      if (response.granted) {
        setHasPermission(true);
        setError(null);
      } else {
        setError('Permission denied. Please enable tab capture permission.');
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setError('Failed to request permissions');
    }
  };

  const handleTabSelected = (tab: chrome.tabs.Tab) => {
    setSelectedTab(tab);
    setShowTabSelector(false);
    setError(null);
  };

  const startRecording = async () => {
    if (!selectedTab || !selectedTab.id) {
      setError('Please select a tab first');
      return;
    }

    try {
      setError(null);
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'START_TAB_AUDIO_RECORDING',
          tabId: selectedTab.id
        }, resolve);
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to start recording');
      }
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      setError(error.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'STOP_TAB_AUDIO_RECORDING' }, resolve);
      });

      if (response.success && response.audioData && onRecordingComplete) {
        onRecordingComplete(response.audioData, response.duration);
      } else if (!response.success) {
        throw new Error(response.error || 'Failed to stop recording');
      }
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      setError(error.message || 'Failed to stop recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return <div className="audio-recorder loading">Checking permissions...</div>;
  }

  if (!hasPermission) {
    return (
      <div className="audio-recorder permission-required">
        <h3 className="audio-title">Audio Recording</h3>
        <p className="permission-message">
          Tab audio capture permission is required to record audio from browser tabs.
        </p>
        <button 
          className="permission-button"
          onClick={requestPermissions}
        >
          Grant Permission
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <>
      <div className="audio-recorder">
        <h3 className="audio-title">Audio Recording</h3>
        
        {!selectedTab && (
          <div className="tab-selection">
            <p className="info-message">
              Select a tab to start recording audio
            </p>
            <button 
              className="select-tab-button"
              onClick={() => setShowTabSelector(true)}
              disabled={isRecording}
            >
              Select Tab
            </button>
          </div>
        )}

        {selectedTab && (
          <div className="selected-tab">
            <p className="tab-info">
              Recording from: <strong>{selectedTab.title}</strong>
            </p>
            {!isRecording && (
              <button 
                className="change-tab-button"
                onClick={() => setShowTabSelector(true)}
              >
                Change Tab
              </button>
            )}
          </div>
        )}

        {selectedTab && (
          <div className="recording-controls">
            {!isRecording ? (
              <button 
                className="start-recording-button"
                onClick={startRecording}
              >
                🎙️ Start Recording
              </button>
            ) : (
              <div className="recording-active">
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  Recording... {formatDuration(recordingDuration)}
                </div>
                <button 
                  className="stop-recording-button"
                  onClick={stopRecording}
                >
                  ⏹️ Stop Recording
                </button>
              </div>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {showTabSelector && (
        <TabSelector
          onTabSelected={handleTabSelected}
          onClose={() => setShowTabSelector(false)}
        />
      )}
    </>
  );
};