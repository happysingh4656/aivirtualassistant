import os
import re
import logging
from googletrans import Translator, LANGUAGES
from textblob import TextBlob
from meditation_scripts import MeditationScripts
from crisis_detection import CrisisDetector

class MentalHealthAssistant:
    def __init__(self):
        """Initialize the mental health assistant"""
        self.translator = Translator()
        self.meditation_scripts = MeditationScripts()
        self.crisis_detector = CrisisDetector()
        
        # Supported languages
        self.supported_languages = ['en', 'hi']
        
        # Empathetic responses
        self.empathetic_responses = {
            'en': {
                'stressed': [
                    "I understand you're feeling stressed. Let's take a moment to breathe together.",
                    "Stress can be overwhelming. I'm here to help you find some calm.",
                    "It's okay to feel stressed. Let's try a quick relaxation technique."
                ],
                'sad': [
                    "I'm sorry you're feeling sad. Your feelings are valid and I'm here to support you.",
                    "Sadness is a natural emotion. Let's explore some gentle activities that might help.",
                    "I hear that you're going through a difficult time. Would you like to try a calming exercise?"
                ],
                'anxious': [
                    "Anxiety can feel overwhelming. Let's work together to find your center.",
                    "I understand anxiety can be difficult. Let's try some grounding techniques.",
                    "Take a deep breath. I'm here to help you through this anxious moment."
                ],
                'default': [
                    "I'm here to listen and support you. How can I help you today?",
                    "Thank you for sharing with me. Let's explore how I can assist you.",
                    "I'm glad you reached out. What would be most helpful for you right now?"
                ]
            },
            'hi': {
                'stressed': [
                    "मैं समझ सकता हूँ कि आप तनाव महसूस कर रहे हैं। आइए एक साथ सांस लेते हैं।",
                    "तनाव कभी-कभी बहुत भारी लग सकता है। मैं यहाँ आपकी शांति पाने में मदद करने के लिए हूँ।",
                    "तनाव महसूस करना सामान्य है। आइए एक आसान आराम की तकनीक आज़माते हैं।"
                ],
                'sad': [
                    "मुझे खुशी है कि आपने मुझसे साझा किया। आपकी भावनाएं वैध हैं और मैं आपका साथ देने के लिए यहाँ हूँ।",
                    "उदासी एक प्राकृतिक भावना है। आइए कुछ सौम्य गतिविधियों का पता लगाते हैं जो मदद कर सकती हैं।",
                    "मैं समझ सकता हूँ कि आप कठिन समय से गुज़र रहे हैं। क्या आप कोई शांत करने वाला अभ्यास करना चाहेंगे?"
                ],
                'anxious': [
                    "चिंता कभी-कभी भारी लग सकती है। आइए मिलकर आपके केंद्र को खोजने की कोशिश करते हैं।",
                    "मैं समझ सकता हूँ कि चिंता कठिन हो सकती है। आइए कुछ ग्राउंडिंग तकनीकें आज़माते हैं।",
                    "एक गहरी सांस लें। मैं इस चिंताजनक क्षण में आपकी मदद करने के लिए यहाँ हूँ।"
                ],
                'default': [
                    "मैं यहाँ सुनने और आपका साथ देने के लिए हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
                    "मुझसे साझा करने के लिए धन्यवाद। आइए देखते हैं कि मैं आपकी कैसे सहायता कर सकता हूँ।",
                    "मुझे खुशी है कि आपने संपर्क किया। अभी आपके लिए सबसे उपयोगी क्या होगा?"
                ]
            }
        }
        
    def detect_language(self, text):
        """Detect the language of input text"""
        try:
            detection = self.translator.detect(text)
            detected_lang = detection.lang
            
            # Map detected language to supported languages
            if detected_lang == 'hi' or detected_lang in ['hi-Latn']:  # Hindi
                return 'hi'
            else:
                return 'en'  # Default to English
                
        except Exception as e:
            logging.error(f"Language detection error: {str(e)}")
            return 'en'  # Default to English on error
    
    def translate_text(self, text, target_language):
        """Translate text to target language"""
        try:
            if target_language == 'en':
                return text  # Assume input is already in English or handle accordingly
            
            result = self.translator.translate(text, dest=target_language)
            return result.text
            
        except Exception as e:
            logging.error(f"Translation error: {str(e)}")
            return text  # Return original text on error
    
    def analyze_sentiment(self, text):
        """Analyze sentiment and emotion of text"""
        try:
            # Convert to English for analysis if needed
            english_text = text
            if self.detect_language(text) == 'hi':
                english_text = self.translator.translate(text, dest='en').text
            
            blob = TextBlob(english_text)
            polarity = blob.sentiment.polarity
            
            # Simple keyword-based emotion detection
            text_lower = english_text.lower()
            
            stress_keywords = ['stressed', 'stress', 'overwhelmed', 'pressure', 'burden', 'exhausted']
            sad_keywords = ['sad', 'depressed', 'down', 'upset', 'hurt', 'broken', 'crying']
            anxious_keywords = ['anxious', 'worried', 'nervous', 'panic', 'afraid', 'scared', 'fear']
            
            if any(keyword in text_lower for keyword in stress_keywords):
                return 'stressed'
            elif any(keyword in text_lower for keyword in sad_keywords):
                return 'sad'
            elif any(keyword in text_lower for keyword in anxious_keywords):
                return 'anxious'
            elif polarity < -0.1:
                return 'sad'
            else:
                return 'default'
                
        except Exception as e:
            logging.error(f"Sentiment analysis error: {str(e)}")
            return 'default'
    
    def get_empathetic_response(self, emotion, language):
        """Get an empathetic response based on emotion and language"""
        import random
        
        responses = self.empathetic_responses.get(language, self.empathetic_responses['en'])
        emotion_responses = responses.get(emotion, responses['default'])
        
        return random.choice(emotion_responses)
    
    def process_message(self, message, session):
        """Process user message and generate appropriate response"""
        try:
            # Detect language
            detected_language = self.detect_language(message)
            session['user_language'] = detected_language
            
            # Check for crisis
            crisis_response = self.crisis_detector.check_crisis(message, detected_language)
            if crisis_response:
                return {
                    'message': crisis_response,
                    'language': detected_language,
                    'crisis_detected': True
                }
            
            # Analyze sentiment
            emotion = self.analyze_sentiment(message)
            
            # Check if user is asking for meditation
            message_lower = message.lower()
            meditation_keywords = ['meditat', 'breathe', 'breath', 'calm', 'relax', 'peace']
            hindi_meditation_keywords = ['ध्यान', 'शांत', 'आराम', 'सांस', 'मेडिटेशन']
            
            is_meditation_request = (
                any(keyword in message_lower for keyword in meditation_keywords) or
                any(keyword in message for keyword in hindi_meditation_keywords)
            )
            
            if is_meditation_request:
                meditation_offer = self.get_meditation_options(detected_language)
                empathetic_response = self.get_empathetic_response(emotion, detected_language)
                
                combined_response = f"{empathetic_response}\n\n{meditation_offer}"
                
                return {
                    'message': combined_response,
                    'language': detected_language,
                    'session_type': 'meditation_offer'
                }
            
            # Generate empathetic response
            response = self.get_empathetic_response(emotion, detected_language)
            
            # Add stress relief suggestions
            if emotion in ['stressed', 'anxious', 'sad']:
                stress_relief = self.get_stress_relief_tip(detected_language)
                response += f"\n\n{stress_relief}"
            
            return {
                'message': response,
                'language': detected_language,
                'emotion': emotion
            }
            
        except Exception as e:
            logging.error(f"Error processing message: {str(e)}")
            
            # Fallback response
            fallback_responses = {
                'en': "I'm here to help. Could you please tell me more about how you're feeling?",
                'hi': "मैं यहाँ मदद करने के लिए हूँ। कृपया मुझे बताएं कि आप कैसा महसूस कर रहे हैं?"
            }
            
            user_language = session.get('user_language', 'en')
            return {
                'message': fallback_responses[user_language],
                'language': user_language
            }
    
    def get_meditation_options(self, language):
        """Get meditation session options"""
        options = {
            'en': """Would you like to try a guided meditation? I can offer:

🧘‍♀️ **Breathing Exercise** (5, 10, or 15 minutes)
🌸 **Body Scan Meditation** (10 or 15 minutes)  
🌙 **Mindfulness Practice** (5 or 10 minutes)

Just tell me which type and duration you prefer, like "breathing exercise for 5 minutes" or "body scan for 10 minutes".""",
            
            'hi': """क्या आप गाइडेड मेडिटेशन करना चाहेंगे? मैं ये विकल्प दे सकता हूँ:

🧘‍♀️ **सांस का अभ्यास** (5, 10, या 15 मिनट)
🌸 **शरीर स्कैन मेडिटेशन** (10 या 15 मिनट)
🌙 **माइंडफुलनेस अभ्यास** (5 या 10 मिनट)

बस मुझे बताएं कि आप कौन सा प्रकार और कितनी देर का चाहते हैं, जैसे "5 मिनट का सांस अभ्यास" या "10 मिनट का बॉडी स्कैन"।"""
        }
        
        return options.get(language, options['en'])
    
    def get_stress_relief_tip(self, language):
        """Get a stress relief tip"""
        import random
        
        tips = {
            'en': [
                "💡 **Quick Tip**: Try the 5-4-3-2-1 grounding technique. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
                "💡 **Quick Tip**: Take 5 deep breaths. Breathe in for 4 counts, hold for 4, and breathe out for 6 counts.",
                "💡 **Quick Tip**: Write down three things you're grateful for today, no matter how small.",
                "💡 **Quick Tip**: Step outside if possible, and take a moment to feel the fresh air on your skin.",
                "💡 **Quick Tip**: Place your hand on your heart and remind yourself: 'This feeling will pass, and I am stronger than I know.'"
            ],
            'hi': [
                "💡 **त्वरित सुझाव**: 5-4-3-2-1 ग्राउंडिंग तकनीक आज़माएं। 5 चीज़ें जो आप देख सकते हैं, 4 जो छू सकते हैं, 3 जो सुन सकते हैं, 2 जो सूंघ सकते हैं, और 1 जो चख सकते हैं, उनके नाम बताएं।",
                "💡 **त्वरित सुझाव**: 5 गहरी सांसें लें। 4 गिनती तक सांस अंदर लें, 4 तक रोकें, और 6 गिनती तक छोड़ें।",
                "💡 **त्वरित सुझाव**: आज आप जिन तीन चीज़ों के लिए आभारी हैं, उन्हें लिखें, चाहे वे कितनी भी छोटी हों।",
                "💡 **त्वरित सुझाव**: यदि संभव हो तो बाहर जाएं, और अपनी त्वचा पर ताज़ी हवा महसूस करने के लिए एक पल रुकें।",
                "💡 **त्वरित सुझाव**: अपना हाथ अपने दिल पर रखें और अपने आप से कहें: 'यह भावना गुज़र जाएगी, और मैं जितना जानता हूँ उससे कहीं ज्यादा मज़बूत हूँ।'"
            ]
        }
        
        language_tips = tips.get(language, tips['en'])
        return random.choice(language_tips)
    
    def start_meditation_session(self, session_type, duration, language):
        """Start a guided meditation session"""
        return self.meditation_scripts.get_meditation_script(session_type, duration, language)
    
    def get_mental_health_resources(self, language):
        """Get mental health resources and helplines"""
        resources = {
            'en': {
                'helplines': [
                    {
                        'name': 'National Suicide Prevention Lifeline (US)',
                        'number': '988',
                        'description': '24/7 free and confidential support'
                    },
                    {
                        'name': 'Crisis Text Line (US)',
                        'number': 'Text HOME to 741741',
                        'description': '24/7 crisis support via text'
                    },
                    {
                        'name': 'Vandrevala Foundation (India)',
                        'number': '+91 9999 666 555',
                        'description': '24/7 mental health helpline'
                    }
                ],
                'disclaimer': '⚠️ **Important**: I am an AI assistant, not a mental health professional. If you are experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.'
            },
            'hi': {
                'helplines': [
                    {
                        'name': 'वंद्रेवाला फाउंडेशन (भारत)',
                        'number': '+91 9999 666 555',
                        'description': '24/7 मानसिक स्वास्थ्य हेल्पलाइन'
                    },
                    {
                        'name': 'कनेक्ट इंडिया',
                        'number': '+91 9152987821',
                        'description': 'मानसिक स्वास्थ्य सहायता'
                    },
                    {
                        'name': 'AASRA (आसरा)',
                        'number': '+91 9820466726',
                        'description': 'संकट में सहायता के लिए'
                    }
                ],
                'disclaimer': '⚠️ **महत्वपूर्ण**: मैं एक AI सहायक हूँ, मानसिक स्वास्थ्य पेशेवर नहीं। यदि आप मानसिक स्वास्थ्य संकट का सामना कर रहे हैं, तो कृपया तुरंत आपातकालीन सेवाओं या मानसिक स्वास्थ्य पेशेवर से संपर्क करें।'
            }
        }
        
        return resources.get(language, resources['en'])
