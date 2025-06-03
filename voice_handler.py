import os
import logging
import tempfile
import base64
from io import BytesIO
import json

try:
    import speech_recognition as sr
    import pyttsx3
    from pydub import AudioSegment
    import threading
except ImportError as e:
    logging.warning(f"Voice libraries not installed: {e}")
    sr = None
    pyttsx3 = None
    AudioSegment = None

class VoiceHandler:
    def __init__(self):
        """Initialize voice handler with speech recognition and TTS"""
        self.recognizer = None
        self.tts_engine = None
        self.supported_languages = {
            'en': 'en-US',
            'hi': 'hi-IN'
        }
        
        self.initialize_components()
    
    def initialize_components(self):
        """Initialize speech recognition and TTS components"""
        try:
            if sr:
                self.recognizer = sr.Recognizer()
                # Adjust for ambient noise
                self.recognizer.energy_threshold = 300
                self.recognizer.dynamic_energy_threshold = True
                self.recognizer.pause_threshold = 0.8
                
            if pyttsx3:
                self.tts_engine = pyttsx3.init()
                self._configure_tts()
                
            logging.info("Voice components initialized successfully")
            
        except Exception as e:
            logging.error(f"Failed to initialize voice components: {e}")
    
    def _configure_tts(self):
        """Configure text-to-speech engine"""
        if not self.tts_engine:
            return
            
        try:
            # Set properties
            self.tts_engine.setProperty('rate', 150)  # Speed
            self.tts_engine.setProperty('volume', 0.8)  # Volume
            
            # Try to find appropriate voices
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Prefer female voice if available
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
                        
        except Exception as e:
            logging.error(f"TTS configuration error: {e}")
    
    def is_available(self):
        """Check if voice functionality is available"""
        return self.recognizer is not None and self.tts_engine is not None
    
    def speech_to_text(self, audio_data, language='en'):
        """Convert speech audio to text"""
        if not self.recognizer:
            return None, "Speech recognition not available"
        
        try:
            # Convert base64 audio data to audio format
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name
            
            try:
                # Load audio file
                with sr.AudioFile(temp_file_path) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio = self.recognizer.record(source)
                
                # Convert language code
                google_lang = self.supported_languages.get(language, 'en-US')
                
                # Recognize speech using Google Speech Recognition
                text = self.recognizer.recognize_google(audio, language=google_lang)
                
                return text, None
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except sr.UnknownValueError:
            return None, "Could not understand audio"
        except sr.RequestError as e:
            return None, f"Speech recognition service error: {e}"
        except Exception as e:
            logging.error(f"Speech to text error: {e}")
            return None, f"Error processing audio: {e}"
    
    def text_to_speech(self, text, language='en'):
        """Convert text to speech audio"""
        if not self.tts_engine:
            return None, "Text-to-speech not available"
        
        try:
            # Create temporary file for audio output
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file_path = temp_file.name
            
            # Configure voice for language if possible
            self._set_voice_for_language(language)
            
            # Save speech to file
            self.tts_engine.save_to_file(text, temp_file_path)
            self.tts_engine.runAndWait()
            
            # Read the audio file and convert to base64
            with open(temp_file_path, 'rb') as audio_file:
                audio_data = audio_file.read()
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Clean up
            os.unlink(temp_file_path)
            
            return audio_base64, None
            
        except Exception as e:
            logging.error(f"Text to speech error: {e}")
            return None, f"Error generating speech: {e}"
    
    def _set_voice_for_language(self, language):
        """Set appropriate voice for the given language"""
        if not self.tts_engine:
            return
        
        try:
            voices = self.tts_engine.getProperty('voices')
            if not voices:
                return
            
            # Language-specific voice selection
            if language == 'hi':
                # Look for Hindi voice
                for voice in voices:
                    if 'hindi' in voice.name.lower() or 'hi-' in voice.id:
                        self.tts_engine.setProperty('voice', voice.id)
                        return
            
            # Default to English voice
            for voice in voices:
                if 'english' in voice.name.lower() or 'en-' in voice.id:
                    self.tts_engine.setProperty('voice', voice.id)
                    return
                    
        except Exception as e:
            logging.error(f"Voice selection error: {e}")
    
    def get_available_voices(self):
        """Get list of available voices"""
        if not self.tts_engine:
            return []
        
        try:
            voices = self.tts_engine.getProperty('voices')
            voice_info = []
            
            for voice in voices:
                voice_info.append({
                    'id': voice.id,
                    'name': voice.name,
                    'language': getattr(voice, 'languages', ['unknown']),
                    'gender': getattr(voice, 'gender', 'unknown')
                })
            
            return voice_info
            
        except Exception as e:
            logging.error(f"Error getting voices: {e}")
            return []
    
    def test_voice_functionality(self):
        """Test voice functionality"""
        results = {
            'speech_recognition': False,
            'text_to_speech': False,
            'error': None
        }
        
        try:
            # Test TTS
            if self.tts_engine:
                test_audio, error = self.text_to_speech("Testing voice functionality", 'en')
                if test_audio and not error:
                    results['text_to_speech'] = True
            
            # Test speech recognition (would need actual audio input)
            if self.recognizer:
                results['speech_recognition'] = True
                
        except Exception as e:
            results['error'] = str(e)
        
        return results