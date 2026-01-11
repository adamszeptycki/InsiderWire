// Service for extracting content from Chrome tabs

export interface RawPageData {
  html: string;
  title: string;
  url: string;
}

/**
 * Extracts raw HTML content from the currently active tab
 * @returns Promise with the page data
 */
export async function extractCurrentTabContent(): Promise<RawPageData> {
  // Get current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.id || !tab.url) {
    throw new Error('No active tab found');
  }

  // Inject content script to get full page HTML
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        html: document.documentElement.outerHTML,
        title: document.title
      };
    }
  });

  const pageData = results[0]?.result;
  
  if (!pageData) {
    throw new Error('Failed to extract page content');
  }

  return {
    html: pageData.html,
    title: pageData.title,
    url: tab.url
  };
} 