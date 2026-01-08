import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWidget } from './components/ChatWidget';

// Demo application for development
const App = () => {
  // Toggle between authenticated and unauthenticated states
  // Set to '' to see "Access Denied" message
  // Set to a token string to see the chat interface
  const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.token'; // Change to '' to test access denied
  
  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-gray-100">
      <ChatWidget
        apiEndpoint={`${import.meta.env.VITE_API_URL}/query`}
        authToken={mockAuthToken}
        documentId="demo-policy-doc-123"
        documentName="Clinical Research Policy Guidelines"
        placeholder="Ask about clinical research policies..."
        welcomeMessage="Hello! I'm your clinical research policy assistant. I can answer questions about the current document. How can I help you today?"
        theme="light"
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
