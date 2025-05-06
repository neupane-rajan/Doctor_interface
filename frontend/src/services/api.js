import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  // Send text message to backend
  sendMessage: async (message, conversationHistory = []) => {
    try {
      // If there's conversation history, use it
      let messages = conversationHistory.length > 0 
        ? conversationHistory 
        : [];
      
      // Add the current message if it's not already in the history
      if (typeof message === 'string') {
        messages.push({
          role: "user",
          content: message
        });
      }
      
      // Make the API call with the format expected by your backend
      const response = await apiClient.post('/chat', {
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw error;
    }
  },
  
  // Convert speech to text
  speechToText: async (audioBase64) => {
    try {
      const response = await apiClient.post('/stt', {
        audio_content: audioBase64,
        language_code: 'en-US',
      });
      return response.data;
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      throw error;
    }
  },
  
  // Convert text to speech
  textToSpeech: async (text, voiceName = "en-US-Neural2-F") => {
    try {
      const response = await apiClient.post('/tts', { 
        text: text,
        voice_name: voiceName,
        speaking_rate: 1.0,
        pitch: 0.0
      });
      return response.data;
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  },
};

export default chatService;