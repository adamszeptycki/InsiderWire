import { createRoot } from 'react-dom/client';
import { RectangleSelector } from './rectangleSelector';
import './style.css';
import TurndownService from 'turndown';

// Initialize rectangle selector
let rectangleSelector: RectangleSelector | null = null;

// Function to initialize the selector
function initializeSelector() {
  if (!rectangleSelector) {
    rectangleSelector = new RectangleSelector();
  }
}

// Function to start selection
function startSelection() {
  initializeSelector();
  rectangleSelector?.show(async (selectedElements) => {
    // Convert elements to HTML strings
    const htmlContent = selectedElements.map(el => el.outerHTML).join('\n');

    // Convert HTML to markdown using Turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });
    const markdownContent = turndownService.turndown(htmlContent);

    // Send selected content to extension
    chrome.runtime.sendMessage({
      type: 'ELEMENTS_SELECTED',
      data: {
        html: htmlContent,
        markdown: markdownContent,
        count: selectedElements.length,
        url: window.location.href,
        title: document.title
      }
    }, async () => {
      // After sending, request the side panel to open
      if (chrome?.sidePanel?.open && chrome?.windows) {
        const currentWindow = await chrome.windows.getCurrent();
        if (typeof currentWindow.id === 'number') {
          chrome.sidePanel.open({ windowId: currentWindow.id });
        } else {
          chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
        }
      } else {
        // Fallback: send a message to background to open side panel
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
      }
    });
  });
}

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_SELECTION') {
    startSelection();
    sendResponse({ success: true });
  } else if (request.type === 'GET_FULL_PAGE_HTML') {
    // Get the full page HTML
    const fullPageHtml = document.documentElement.outerHTML;
    sendResponse({ html: fullPageHtml });
  }
  return true;
});

// Create a floating button for easy selection start
const floatingButton = document.createElement('div');
floatingButton.id = '__airframe-floating-button';
floatingButton.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" fill="currentColor"/>
  </svg>
`;
floatingButton.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: #4285f4;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  z-index: 999998;
  transition: transform 0.2s;
`;

floatingButton.addEventListener('click', startSelection);
floatingButton.addEventListener('mouseenter', () => {
  floatingButton.style.transform = 'scale(1.1)';
});
floatingButton.addEventListener('mouseleave', () => {
  floatingButton.style.transform = 'scale(1)';
});

document.body.appendChild(floatingButton);

// Remove the old test div
const oldRoot = document.querySelector('#__root');
if (oldRoot) {
  oldRoot.remove();
}

console.log('AirFrame content script loaded - Rectangle selection ready');
