// Component for displaying error and success messages

import React from 'react';

interface MessageDisplayProps {
  error?: string | null;
  success?: string | null;
}

export function MessageDisplay({ error, success }: MessageDisplayProps) {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <div className="error">
          <p>Error: {error}</p>
        </div>
      )}

      {success && (
        <div className="success">
          <p>{success}</p>
        </div>
      )}
    </>
  );
} 