# Chat Widget Integration

## Overview
The Protocol Document Detail view includes an AI-powered chat widget that allows users to ask questions about protocol documents. The widget is integrated directly into the portal codebase.

## Features
- **Contextual Q&A**: Users can ask questions specific to the protocol document they're viewing
- **Access Control**: Widget requires authentication via Azure AD JWT token
- **Real-time Interaction**: Chat interface with message history
- **Error Handling**: Built-in error states and loading indicators

## Widget Location

The chat widget source code is located at:
- **Path**: `src/widgets/ChatWidget/`
- **Main Component**: `src/widgets/ChatWidget/components/ChatWidget.tsx`
- **API Service**: `src/widgets/ChatWidget/services/chatApi.ts`
- **Types**: `src/widgets/ChatWidget/types/index.ts`
- **Styles**: `src/widgets/ChatWidget/styles/ChatWidget.css`

## Configuration

### Environment Variables
Add the following to your `.env` file:

```env
# Chat Widget API URL (RAG backend for document querying)
VITE_CHAT_API_URL=http://localhost:3001/api/chat
```

**Important**: Replace the URL with your actual RAG/chat backend endpoint.

### Widget Props
The ChatWidget component receives the following props from `ProtocolDocumentDetail.tsx`:

- **apiEndpoint**: Backend API URL for chat queries (from `VITE_CHAT_API_URL`)
- **authToken**: JWT token from Azure AD MSAL authentication
- **documentId**: Current protocol document ID from route params
- **documentName**: Protocol document name/type for context
- **placeholder**: Input field placeholder text
- **welcomeMessage**: Initial greeting message
- **theme**: UI theme ('light' or 'dark')

## Backend API Requirements

The chat widget expects a backend endpoint that:

1. **Accepts POST requests** to the configured API endpoint
2. **Request format**:
   ```json
   {
     "query": "What is the primary endpoint?",
     "documentId": "123",
     "documentName": "E6_R2_Addendum.pdf",
     "context": {}
   }
   ```

3. **Response format**:
   ```json
   {
     "success": true,
     "answer": "The primary endpoint is...",
     "error": null
   }
   ```

4. **Authentication**: Validates `Authorization: Bearer <JWT_TOKEN>` header

## Integration Location

The chat widget is integrated in:
- **File**: `src/ProtocolDocumentDetail.tsx`
- **Position**: Below the Version History table
- **Section**: "Document Query Assistant"

## Usage

1. Navigate to a protocol document detail view
2. Scroll to the "Document Query Assistant" section
3. Type a question about the protocol in the input field
4. The widget will query the backend and display the AI-generated response

## Access Control

The widget enforces authentication:
- If no `authToken` is present, it displays: "🔒 Access Denied - Please log into ProtocolSync Portal"
- Token is automatically acquired from Azure AD via MSAL

## Development

### Making Changes to the Widget

The widget is now part of the portal codebase. To modify it:

1. Edit files in `src/widgets/ChatWidget/`
2. Changes will be hot-reloaded during development
3. No rebuild or reinstall needed

### Widget Structure
```
src/widgets/ChatWidget/
├── components/
│   ├── ChatWidget.tsx      # Main widget component
│   ├── MessageList.tsx     # Message display
│   ├── MessageItem.tsx     # Individual message
│   └── InputBox.tsx        # Chat input field
├── services/
│   └── chatApi.ts          # API communication
├── types/
│   └── index.ts            # TypeScript types
├── styles/
│   └── ChatWidget.css      # Widget styles
└── index.ts                # Public exports
```

## Styling

The widget includes its own CSS, imported via:
```typescript
import '../widgets/ChatWidget/styles/ChatWidget.css';
```

The widget uses a light theme by default and is styled to match the portal's design system.

## Troubleshooting

### Widget not appearing
- Check that the widget CSS is imported
- Verify TypeScript compilation is successful
- Check browser console for errors

### API errors
- Verify `VITE_CHAT_API_URL` is set correctly in `.env`
- Check that the backend endpoint is running
- Inspect browser console for error messages
- Verify JWT token is being passed correctly

### Authentication issues
- Ensure user is logged in via Azure AD
- Check MSAL token acquisition in browser console
- Verify backend accepts the JWT token format

## Future Enhancements

Potential improvements:
- Message history persistence
- Document section highlighting based on answers
- Multi-document querying
- Export conversation history
- Advanced context (current version, status, etc.)
