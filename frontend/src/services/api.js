import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(request => {
  // Log request info without logging large payloads
  const logRequest = { ...request };
  if (request.data && typeof request.data === 'object') {
    // For large data like audio, just log the presence
    if (request.url.includes('/stt') && request.data.audio_content) {
      logRequest.data = { 
        audio_content: `[Base64 audio data: ${request.data.audio_content.length} chars]`,
        ...request.data
      };
      delete logRequest.data.audio_content;
    }
  }
  console.log('API Request:', logRequest.method, logRequest.url, logRequest.data);
  return request;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for logging
apiClient.interceptors.response.use(response => {
  // Log response info
  console.log('API Response:', response.status, response.config.url);
  return response;
}, error => {
  console.error('API Error:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
  return Promise.reject(error);
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
      throw error;
    }
  },
  
  speechToText: async (audioBase64, mimeType = 'audio/webm') => {
    try {
      // Check if audioBase64 is empty
      if (!audioBase64 || audioBase64.length === 0) {
        throw new Error('Empty audio data');
      }
      
      // Determine encoding from MIME type
      let encoding = "LINEAR16";
      if (mimeType.includes('audio/webm')) {
        encoding = "WEBM_OPUS";
      } else if (mimeType.includes('audio/mp3') || mimeType.includes('audio/mpeg')) {
        encoding = "MP3";
      } else if (mimeType.includes('audio/ogg')) {
        encoding = "OGG_OPUS";
      }
      
      console.log(`Sending audio data to STT API, length: ${audioBase64.length} chars, format: ${mimeType}, encoding: ${encoding}`);
      
      const response = await apiClient.post('/api/stt', {
        audio_content: audioBase64,
        language_code: 'en-US',
        encoding: encoding,
        sample_rate_hertz: 16000 // Match browser's sample rate
      });
      
      console.log('STT Response type:', typeof response.data);
      
      // Handle different response formats
      if (typeof response.data === 'string') {
        return { text: response.data };
      } 
      else if (response.data && response.data.text) {
        return response.data;
      }
      else {
        console.warn('STT API returned unexpected response format:', response.data);
        return { text: response.data ? response.data.toString() : '' };
      }
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      
      if (error.response) {
        console.error('STT error status:', error.response.status);
        console.error('STT error data:', error.response.data);
      }
      
      return { text: `Error: ${error.message || 'Failed to process speech'}` };
    }
  },
  // Convert text to speech
  textToSpeech: async (text, options = {}) => {
    try {
      const defaultOptions = {
        voice_name: "en-US-Chirp-HD-F", // Using new Chirp HD voice
        speaking_rate: 1.0,
        pitch: 0.0
      };
      
      const mergedOptions = {...defaultOptions, ...options};
      
      const response = await apiClient.post('/tts', { 
        text: text,
        ...mergedOptions
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  },
};

export default chatService;