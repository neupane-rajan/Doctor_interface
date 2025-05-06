import React from 'react';
import ChatMessage from './ChatMessage';

const ChatMessages = ({ messages = [], isLoading = false }) => {
  // Add a guard to ensure messages is an array
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  return (
    <div className="space-y-4">
      {safeMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      
      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 shadow max-w-xs md:max-w-md lg:max-w-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;