import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../services/api';

const ChatInput = ({ onSendMessage, isLoading, setCurrentMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Focus the input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
      setCurrentMessage('');
    }
  };
  
  // Update the current message as user types
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setCurrentMessage(e.target.value);
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      setRecordingError('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // Match backend expectations
        }
      });
      
      // Create media recorder
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Store audio chunks as they become available
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      // Process audio when recording stops
      mediaRecorder.onstop = async () => {
        // Convert audio chunks to blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Check if the audioBlob has data
        if (audioBlob.size === 0) {
          setRecordingError('No audio data captured. Please try again.');
          return;
        }
        
        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            try {
              // Get base64 data and remove the prefix
              const base64Audio = reader.result.split(',')[1];
              
              if (!base64Audio) {
                setRecordingError('Error processing audio data.');
                return;
              }
              
              console.log('Sending audio for processing, size:', audioBlob.size, 'bytes');
              
              // Get transcript from API
              const result = await chatService.speechToText(base64Audio);
              
              console.log('STT Result:', result);
              
              if (result && result.text) {
                setInputText(result.text);
                setCurrentMessage(result.text);
              } else {
                setRecordingError('No speech detected or could not understand. Please try again.');
              }
            } catch (error) {
              console.error('Speech recognition error:', error);
              setRecordingError(error.message || 'Failed to process speech. Please try again.');
            }
          };
        } catch (error) {
          console.error('Error processing audio:', error);
          setRecordingError('Error processing audio.');
        }
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);
      
      // Automatically stop recording after 8 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
          console.log('Automatically stopped recording after timeout');
        }
      }, 8000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setRecordingError('Could not access microphone. Please check permissions.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  return (
    <div className="border-t border-gray-200 p-4">
      {recordingError && (
        <div className="text-red-500 text-sm mb-2 px-3 py-1 bg-red-50 rounded-md">
          {recordingError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading || isRecording}
          className="flex-1 py-2 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
        
        {/* Voice input button */}
        <button 
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50
            ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {isRecording ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" 
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            )}
          </svg>
        </button>
        
        {/* Send button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading || isRecording}
          className="bg-primary-600 text-white py-2 px-4 rounded-full disabled:opacity-50 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span>Send</span>
          )}
        </button>
      </form>
      
      {isRecording && (
        <div className="mt-2 text-center text-xs text-gray-500">
          <div className="animate-pulse text-red-500">Recording... (click microphone to stop)</div>
        </div>
      )}
    </div>
  );
};

export default ChatInput;