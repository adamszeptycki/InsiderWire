// Backend integration utility for saving tab content

export interface TabContent {
  url: string;
  title: string;
  markdown: string;
}

export interface SaveContentResponse {
  success: boolean;
  id?: string;
  message?: string;
}

/**
 * Configuration for backend endpoints
 * TODO: Replace these with your actual backend URLs
 */
const BACKEND_CONFIG = {
  // Replace with your actual backend endpoint
  saveContentEndpoint: '/api/save-content',
  // Base URL for backend - update this for production
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-url.com' 
    : 'https://localhost:3000',
  // You can add more endpoints here as needed
  // getContentEndpoint: '/api/get-content',
  // deleteContentEndpoint: '/api/delete-content',
};

/**
 * Get the backend base URL
 */
export function getBackendUrl(): string {
  return BACKEND_CONFIG.baseUrl;
}

/**
 * Call a TRPC endpoint
 */
export async function callTrpcEndpoint<T = any>(
  procedure: string, 
  input: any,
  authToken?: string
): Promise<T> {
  const url = `${getBackendUrl()}/api/trpc/${procedure}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ json: input }),
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error.message || 'Unknown error');
  }

  return result.result.data.json;
}

/**
 * Save tab content to the backend
 * @param content The tab content to save
 * @returns Promise with the response from the backend
 */
export async function saveTabContent(content: TabContent): Promise<SaveContentResponse> {
  try {
    const payload = {
      url: content.url,
      title: content.title,
      markdown: content.markdown,
      timestamp: new Date().toISOString(),
      source: 'chrome-extension'
    };

    const response = await fetch(BACKEND_CONFIG.saveContentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication headers if needed
        // 'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      id: result.id,
      message: result.message || 'Content saved successfully'
    };

  } catch (error) {
    console.error('Failed to save content to backend:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * TODO: Add authentication token management if needed
 */
// export function getAuthToken(): string | null {
//   return localStorage.getItem('authToken');
// }

// export function setAuthToken(token: string): void {
//   localStorage.setItem('authToken', token);
// }

/**
 * TODO: Add other backend operations as needed
 */
// export async function getStoredContent(url: string): Promise<TabContent | null> {
//   // Implementation for retrieving stored content
// }

// export async function deleteStoredContent(id: string): Promise<boolean> {
//   // Implementation for deleting stored content
// } 