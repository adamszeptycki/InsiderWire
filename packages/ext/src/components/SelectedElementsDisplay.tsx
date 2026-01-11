interface SelectedElementsDisplayProps {
  data: {
    html: string;
    count: number;
    url: string;
    title: string;
  } | null;
}

export function SelectedElementsDisplay({ data }: SelectedElementsDisplayProps) {
  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </div>
        <p className="empty-state-text bg-red-500">
          Click the extension icon or the floating button on any webpage to start selecting elements
        </p>
      </div>
    );
  }

  return (
    <div className="selected-elements-container">
      <div className="selection-info">
        <h3 className="selection-title">Selected Elements</h3>
        <div className="selection-meta">
          {/* <p><strong>Count:</strong> {data.count} elements</p>
          <p><strong>Page:</strong> {data.title}</p>
          <p className="selection-url">{data.url}</p> */}
        </div>
      </div>
      
      <div className="selected-content">
        <div className="content-header">
          <h4>Preview</h4>
          <button
            type="button"
            className="copy-button"
            onClick={() => {
              navigator.clipboard.writeText(data.html);
            }}
          >
            Copy HTML
          </button>
        </div>
        
        <div className="html-preview">
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <base href="${data.url}">
                  <style>
                    body {
                      margin: 16px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    * {
                      max-width: 100% !important;
                      overflow-wrap: break-word;
                    }
                  </style>
                </head>
                <body>
                  ${data.html}
                </body>
              </html>
            `}
            style={{
              width: '100%',
              height: '400px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
            sandbox="allow-same-origin"
          />
        </div>

      </div>
    </div>
  );
}