import React, { useState, useEffect } from 'react';

interface TabSelectorProps {
  onTabSelected: (tab: chrome.tabs.Tab) => void;
  onClose: () => void;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ onTabSelected, onClose }) => {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTabs();
  }, []);

  const loadTabs = async () => {
    try {
      const allTabs = await chrome.tabs.query({});
      
      // Filter out extension tabs and chrome:// urls
      const validTabs = allTabs.filter(tab => 
        tab.url && 
        !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://')
      );
      
      // Sort tabs - audible tabs first
      validTabs.sort((a, b) => {
        if (a.audible && !b.audible) return -1;
        if (!a.audible && b.audible) return 1;
        return 0;
      });
      
      setTabs(validTabs);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tabs:', error);
      setLoading(false);
    }
  };

  const getFaviconUrl = (tab: chrome.tabs.Tab): string => {
    if (tab.favIconUrl) {
      return tab.favIconUrl;
    }
    // Default favicon for tabs without one
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
  };

  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="tab-selector-overlay">
        <div className="tab-selector-modal">
          <div className="tab-selector-loading">Loading tabs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-selector-overlay" onClick={onClose}>
      <div className="tab-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tab-selector-header">
          <h3>Select a Tab to Record</h3>
          <button className="tab-selector-close" onClick={onClose}>×</button>
        </div>
        
        <div className="tab-selector-list">
          {tabs.length === 0 ? (
            <div className="tab-selector-empty">No tabs available for recording</div>
          ) : (
            tabs.map((tab) => (
              <div
                key={tab.id}
                className={`tab-selector-item ${tab.audible ? 'audible' : ''}`}
                onClick={() => onTabSelected(tab)}
              >
                <img 
                  src={getFaviconUrl(tab)} 
                  alt="" 
                  className="tab-selector-favicon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
                  }}
                />
                <div className="tab-selector-info">
                  <div className="tab-selector-title">{tab.title || 'Untitled'}</div>
                  <div className="tab-selector-url">{getDomain(tab.url || '')}</div>
                </div>
                {tab.audible && (
                  <div className="tab-selector-audio-indicator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    Playing audio
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="tab-selector-footer">
          <p className="tab-selector-hint">
            {tabs.filter(t => t.audible).length > 0 
              ? '🔊 Tabs with audio are highlighted' 
              : 'ℹ️ No tabs are currently playing audio'}
          </p>
        </div>
      </div>
    </div>
  );
};