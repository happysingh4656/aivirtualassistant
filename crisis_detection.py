import re

class CrisisDetector:
    def __init__(self):
        """Initialize crisis detection patterns and responses"""
        
        # Crisis keywords and phrases
        self.crisis_patterns = {
            'en': [
                r'\b(kill myself|end my life|suicide|suicidal)\b',
                r'\b(want to die|wish I was dead|better off dead)\b',
                r'\b(can\'t go on|can\'t take it|give up|hopeless)\b',
                r'\b(hurt myself|self harm|cut myself)\b',
                r'\b(no point|worthless|useless|burden)\b'
            ],
            'hi': [
                r'\b(मरना चाहता|जान देना|आत्महत्या|खुदकुशी)\b',
                r'\b(मरना बेहतर|जीना नहीं|जीवन समाप्त)\b',
                r'\b(नहीं रह सकता|सहन नहीं|हार मान|निराशा)\b',
                r'\b(खुद को नुकसान|आत्म हानि|काटना)\b',
                r'\b(कोई फायदा नहीं|बेकार|निरर्थक|बोझ)\b'
            ]
        }
        
        # Crisis responses with helplines
        self.crisis_responses = {
            'en': """🚨 **I'm concerned about what you've shared with me.**

I want you to know that you matter, and there are people who can help you through this difficult time. Please consider reaching out to:

**🆘 Emergency Resources:**
• **Emergency Services**: 911 (US) or your local emergency number
• **National Suicide Prevention Lifeline**: 988 (US)
• **Crisis Text Line**: Text HOME to 741741 (US)
• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

**🇮🇳 India Resources:**
• **Vandrevala Foundation**: +91 9999 666 555 (24/7)
• **AASRA**: +91 9820466726
• **iCall**: +91 9152987821

**⚠️ Important**: I am an AI assistant, not a mental health professional. If you are in immediate danger, please contact emergency services right away.

Would you like me to guide you through a calming breathing exercise while you consider reaching out for professional support?""",
            
            'hi': """🚨 **आपने जो मुझसे साझा किया है, उससे मैं चिंतित हूँ।**

मैं चाहता हूँ कि आप जानें कि आप महत्वपूर्ण हैं, और ऐसे लोग हैं जो इस कठिन समय में आपकी मदद कर सकते हैं। कृपया संपर्क करने पर विचार करें:

**🆘 आपातकालीन संसाधन:**
• **आपातकालीन सेवाएं**: 102 या आपका स्थानीय आपातकालीन नंबर
• **वंद्रेवाला फाउंडेशन**: +91 9999 666 555 (24/7)
• **AASRA (आसरा)**: +91 9820466726
• **iCall**: +91 9152987821

**🌍 अंतर्राष्ट्रीय संसाधन:**
• **आत्महत्या रोकथाम के लिए अंतर्राष्ट्रीय संघ**: https://www.iasp.info/resources/Crisis_Centres/

**⚠️ महत्वपूर्ण**: मैं एक AI सहायक हूँ, मानसिक स्वास्थ्य पेशेवर नहीं। यदि आप तत्काल खतरे में हैं, तो कृपया तुरंत आपातकालीन सेवाओं से संपर्क करें।

क्या आप चाहेंगे कि मैं आपको एक शांत करने वाली सांस की तकनीक के माध्यम से मार्गदर्शन करूं जबकि आप पेशेवर सहायता लेने पर विचार करते हैं?"""
        }
    
    def check_crisis(self, text, language):
        """Check if text contains crisis indicators"""
        try:
            text_lower = text.lower()
            
            # Check patterns for the detected language
            patterns = self.crisis_patterns.get(language, self.crisis_patterns['en'])
            
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    return self.crisis_responses.get(language, self.crisis_responses['en'])
            
            # Also check English patterns if language is Hindi (code-switching)
            if language == 'hi':
                for pattern in self.crisis_patterns['en']:
                    if re.search(pattern, text_lower, re.IGNORECASE):
                        return self.crisis_responses.get(language, self.crisis_responses['en'])
            
            return None
            
        except Exception:
            # If there's any error in crisis detection, err on the side of caution
            return None
