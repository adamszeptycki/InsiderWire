// Custom hook for managing tab content extraction and backend operations

import { useState, useCallback } from 'react';
import { extractCurrentTabContent, processHtmlToMarkdown, type ProcessedContent } from '../services';
import { saveTabContent, type TabContent } from '../utils/backend';

interface UseTabContentState {
  isLoading: boolean;
  tabContent: ProcessedContent | null;
  error: string | null;
  successMessage: string | null;
}

interface UseTabContentActions {
  getCurrentTabContent: () => Promise<void>;
  sendToBackend: (content: ProcessedContent) => Promise<void>;
  clearMessages: () => void;
}

export type UseTabContentReturn = UseTabContentState & UseTabContentActions;

/**
 * Custom hook for managing tab content extraction and backend operations
 */
export function useTabContent(): UseTabContentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [tabContent, setTabContent] = useState<ProcessedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Clears all messages (error and success)
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  /**
   * Extracts content from the current tab and converts to markdown
   */
  const getCurrentTabContent = useCallback(async () => {
    setIsLoading(true);
    clearMessages();

    try {
      // Extract raw content from current tab
      const rawData = await extractCurrentTabContent();
      
      // Process HTML and convert to markdown
      const processedContent = await processHtmlToMarkdown(rawData);
      
      setTabContent(processedContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get tab content');
    } finally {
      setIsLoading(false);
    }
  }, [clearMessages]);

  /**
   * Sends content to backend
   */
  const sendToBackend = useCallback(async (content: ProcessedContent) => {
    setIsLoading(true);
    clearMessages();
    
    // Convert to the format expected by backend utility
    const backendContent: TabContent = {
      url: content.url,
      title: content.title,
      markdown: content.markdown
    };
    
    const result = await saveTabContent(backendContent);
    
    if (result.success) {
      setSuccessMessage(result.message || 'Content saved successfully!');
      console.log('Content saved successfully:', result);
    } else {
      setError(result.message || 'Failed to save content');
    }
    
    setIsLoading(false);
  }, [clearMessages]);

  return {
    // State
    isLoading,
    tabContent,
    error,
    successMessage,
    // Actions
    getCurrentTabContent,
    sendToBackend,
    clearMessages
  };
} 