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
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef(new Audio());
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Track user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);
  
  // Use browser's speech synthesis for text-to-speech
  const speakMessage = async (text) => {
    if (!text) return;
    
    try {
      // Try to get TTS audio from backend first
      const response = await chatService.textToSpeech(text);
      
      if (response && response.audio_url) {
        console.log("Received audio URL:", response.audio_url.substring(0, 50) + "...");
        
        // Make sure audioRef exists
        if (audioRef.current) {
          // Set the audio source
          audioRef.current.src = response.audio_url;
          audioRef.current.onplay = () => setDoctorSpeaking(true);
          audioRef.current.onended = () => setDoctorSpeaking(false);
          
          // Play the audio
          const playPromise = audioRef.current.play();
          
          // Handle play promise (required for modern browsers)
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Audio playback started successfully");
              })
              .catch(err => {
                console.error("Error playing audio:", err);
                // Fall back to browser TTS
                useBrowserTTS(text);
              });
          }
        }
      } else {
        console.warn("No audio URL received from TTS service");
        // Fall back to browser TTS
        useBrowserTTS(text);
      }
    } catch (error) {
      console.error("TTS service error:", error);
      // Fall back to browser TTS
      useBrowserTTS(text);
    }
  };
  
  // Browser's built-in TTS
  const useBrowserTTS = (text) => {
    if (!window.speechSynthesis) return;
    
    // Only use browser TTS if user has interacted
    if (userInteracted) {
      setDoctorSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setDoctorSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      // Just show speaking animation without audio
      setDoctorSpeaking(true);
      setTimeout(() => setDoctorSpeaking(false), 3000);
    }
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
        
        if (userInteracted) {
          audioRef.current.play().catch(err => {
            console.error("Error playing audio:", err);
            speakMessage(botMessage.text);
          });
        } else {
          // Just animate doctor without audio
          setDoctorSpeaking(true);
          setTimeout(() => setDoctorSpeaking(false), 3000);
        }
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
    // Set user as having interacted since this is a manual action
    setUserInteracted(true);
    
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
      // Add the initial welcome message
      const welcomeMessage = {
        id: Date.now(),
        text: "Hello! I'm your medical assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages([welcomeMessage]);
      
      // Don't try to play audio yet since user hasn't interacted
      // Just set doctor speaking for animation
      setDoctorSpeaking(true);
      setTimeout(() => setDoctorSpeaking(false), 3000);
    }
  }, []);

  // Add an effect to play welcome audio once user has interacted
  useEffect(() => {
    if (userInteracted && messages.length > 0 && !doctorSpeaking) {
      // Try to play the welcome message once user has interacted
      const welcomeMessage = messages[0];
      if (welcomeMessage && !welcomeMessage.isUser) {
        speakMessage(welcomeMessage.text);
      }
    }
  }, [userInteracted]);

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
          
          {/* User interaction instruction */}
          {!userInteracted && (
            <div className="bg-blue-50 text-blue-700 p-2 text-center text-sm">
              Click or type anywhere to enable audio
            </div>
          )}
        </div>
      </main>
      
      {/* Audio element for TTS playback */}
      <audio 
  ref={audioRef} 
  style={{ display: 'none' }} 
  onError={(e) => {
    console.error("Audio playback error:", e);
    // Fallback to browser TTS if there's an error
    if (lastMessage && lastMessage.role === 'assistant') {
      useBrowserTTS(lastMessage.content);
    }
  }}
/>
    </div>
  );
}

export default App;