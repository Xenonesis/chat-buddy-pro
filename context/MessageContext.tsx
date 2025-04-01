import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { saveMessages, loadMessages, Message } from '../utils/chatStorage';
import { safeJsonParse } from '../utils/safeJson';

interface MessageContextState {
  messages: Message[];
  isLoading: boolean;
  isRegenerating: boolean;
  regeneratingId: string | null;
  error: string | null;
}

type MessageAction = 
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'EDIT_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REGENERATING'; payload: { isRegenerating: boolean; messageId?: string } }
  | { type: 'SET_ERROR'; payload: string | null };

interface MessageContextValue extends MessageContextState {
  addMessage: (message: Message) => void;
  editMessage: (id: string, content: string) => Promise<void>;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  regenerateResponse: (messageId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

const initialState: MessageContextState = {
  messages: [],
  isLoading: false,
  isRegenerating: false,
  regeneratingId: null,
  error: null,
};

const messageReducer = (state: MessageContextState, action: MessageAction): MessageContextState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'EDIT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id 
            ? { ...msg, content: action.payload.content, edited: true } 
            : msg
        )
      };
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: []
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_REGENERATING':
      return {
        ...state,
        isRegenerating: action.payload.isRegenerating,
        regeneratingId: action.payload.messageId || null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

export const MessageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  
  // Load messages from storage on initial load
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('messages') || localStorage.getItem('chatMessages');
      const storedMessages = safeJsonParse(storedData, []);
      
      // Validate that we actually have an array of messages
      if (Array.isArray(storedMessages) && storedMessages.length > 0) {
        dispatch({ type: 'SET_MESSAGES', payload: storedMessages });
      }
    } catch (error) {
      console.error('Failed to load messages from storage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('messages');
      localStorage.removeItem('chatMessages');
    }
  }, []);
  
  // Save messages to storage whenever they change
  useEffect(() => {
    if (state.messages.length > 0) {
      saveMessages(state.messages);
    }
  }, [state.messages]);
  
  const addMessage = (message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };
  
  const editMessage = async (id: string, content: string) => {
    dispatch({ type: 'EDIT_MESSAGE', payload: { id, content } });
    
    // Find the edited message and the next assistant message if any
    const editedIndex = state.messages.findIndex(m => m.id === id);
    if (editedIndex === -1) return;
    
    const nextAssistantIndex = state.messages.findIndex((m, i) => 
      i > editedIndex && m.role === 'assistant'
    );
    
    // If there's a next assistant message, regenerate it based on edited content
    if (nextAssistantIndex !== -1) {
      const assistantMessage = state.messages[nextAssistantIndex];
      
      // Set loading state for regeneration
      dispatch({ 
        type: 'SET_REGENERATING', 
        payload: { isRegenerating: true, messageId: assistantMessage.id } 
      });
      
      try {
        // Call API to regenerate the response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: content,
            model: assistantMessage.model,
            // Include other necessary params like API keys or chat mode
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to regenerate response');
        }
        
        const data = await response.json();
        
        // Update the assistant message
        dispatch({ 
          type: 'EDIT_MESSAGE', 
          payload: { id: assistantMessage.id, content: data.response } 
        });
      } catch (error) {
        console.error('Error regenerating response:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to update the AI response after editing your message' 
        });
      } finally {
        dispatch({ 
          type: 'SET_REGENERATING', 
          payload: { isRegenerating: false } 
        });
      }
    }
  };
  
  const deleteMessage = (id: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: id });
  };
  
  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    saveMessages([]);
  };
  
  const regenerateResponse = async (messageId: string) => {
    const index = state.messages.findIndex(m => m.id === messageId);
    if (index <= 0) return; // Invalid index or no previous message
    
    const prevUserMessage = state.messages
      .slice(0, index)
      .reverse()
      .find(m => m.role === 'user');
      
    if (!prevUserMessage) return;
    
    const currentMessage = state.messages[index];
    
    dispatch({ 
      type: 'SET_REGENERATING', 
      payload: { isRegenerating: true, messageId } 
    });
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prevUserMessage.content,
          model: currentMessage.model,
          // Include other necessary params
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }
      
      const data = await response.json();
      
      dispatch({ 
        type: 'EDIT_MESSAGE', 
        payload: { 
          id: messageId, 
          content: data.response 
        } 
      });
    } catch (error) {
      console.error('Error regenerating response:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to regenerate response'
      });
    } finally {
      dispatch({ 
        type: 'SET_REGENERATING', 
        payload: { isRegenerating: false }
      });
    }
  };
  
  const value = {
    ...state,
    addMessage,
    editMessage,
    deleteMessage,
    clearMessages,
    regenerateResponse
  };
  
  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};
