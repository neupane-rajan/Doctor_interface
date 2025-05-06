import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header/Header';
import ChatMessages from './components/ChatMessage/ChatMessage';
import ChatInput from './components/ChatInput/ChatInput';
import DoctorAvatar from './components/DoctorAvatar/DoctorAvatar';
import { chatService } from './services/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [doctorSpeaking, setDoctorSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const audioRef = useRef(new Audio());
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Use browser's speech synthesis for text-to-speech
  const speakMessage = (text) => {
    if (!text) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Try to get TTS audio from backend first
    chatService.textToSpeech(text)
      .then(response => {
        if (response && response.audio_url) {
          // Use audio URL from backend
          audioRef.current.src = response.audio_url;
          audioRef.current.onplay = () => setDoctorSpeaking(true);
          audioRef.current.onended = () => setDoctorSpeaking(false);
          audioRef.current.play().catch(err => {
            console.error("Error playing audio:", err);
            // Fall back to browser TTS
            useBrowserTTS(text);
          });
        } else {
          // Fall back to browser TTS
          useBrowserTTS(text);
        }
      })
      .catch(error => {
        console.error("Error with server TTS:", error);
        // Fall back to browser TTS
        useBrowserTTS(text);
      });
  };
  
  // Browser's built-in TTS
  const useBrowserTTS = (text) => {
    if (!window.speechSynthesis) return;
    
    setDoctorSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setDoctorSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  
  // Handle sending a message
  const handleSendMessage = async (text) => {
    if (!text || !text.trim()) return;
    
    // Add user message to chat UI
    const userMessage = {
      id: Date.now(),
      text: text,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    // Update messages with proper error handling
    setMessages(prevMessages => {
      // Ensure prevMessages is always an array
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
      return [...safeMessages, userMessage];
    });
    
    setIsLoading(true);
    
    // Add the new user message to conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: text }
    ];
    
    try {
      // Send message to backend
      const response = await chatService.sendMessage(text, updatedHistory);
      
      // Log response for debugging
      console.log("Backend response:", response);
      
      // Extract message from response
      const responseMessage = response && typeof response === 'object' ? 
        response.message : 
        (typeof response === 'string' ? response : "I'm sorry, I couldn't process that.");
      
      // Update conversation history with assistant's response
      const newHistory = [
        ...updatedHistory,
        { role: "assistant", content: responseMessage }
      ];
      setConversationHistory(newHistory);
      
      // Add bot message to chat UI
      const botMessage = {
        id: Date.now() + 1,
        text: responseMessage,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      // Update messages with proper error handling
      setMessages(prevMessages => {
        // Ensure prevMessages is always an array
        const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
        return [...safeMessages, botMessage];
      });
      
      // Handle TTS
      if (response && response.audio_url) {
        // If backend provides audio URL, use it
        audioRef.current.src = response.audio_url;
        audioRef.current.onplay = () => setDoctorSpeaking(true);
        audioRef.current.onended = () => setDoctorSpeaking(false);
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          speakMessage(botMessage.text);
        });
      } else {
        // Otherwise use TTS
        speakMessage(botMessage.text);
      }
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      // Update messages with proper error handling
      setMessages(prevMessages => {
        // Ensure prevMessages is always an array
        const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
        return [...safeMessages, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle starting a new chat
  const handleNewChat = () => {
    // Reset states
    setMessages([]);
    setConversationHistory([]);
    setCurrentMessage('');
    
    // Add a welcome message
    const welcomeMessage = {
      id: Date.now(),
      text: "Hello! I'm your medical assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([welcomeMessage]);
    speakMessage(welcomeMessage.text);
  };
  
  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      handleNewChat();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onNewChat={handleNewChat} />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Doctor Avatar Section */}
        <div className="w-full md:w-1/3 p-4 flex items-center justify-center bg-blue-50">
          <DoctorAvatar 
            isSpeaking={doctorSpeaking} 
            text={currentMessage}
          />
        </div>
        
        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg mx-2 my-2 md:ml-0">
          <div className="flex-1 overflow-y-auto p-4">
            <ChatMessages 
              messages={Array.isArray(messages) ? messages : []} 
              isLoading={isLoading}
            />
            <div ref={messagesEndRef} />
          </div>
          
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            setCurrentMessage={setCurrentMessage}
          />
        </div>
      </main>
      
      {/* Audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

export default App;