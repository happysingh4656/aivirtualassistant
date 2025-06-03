import random

class MeditationScripts:
    def __init__(self):
        """Initialize meditation scripts for different sessions"""
        
        self.scripts = {
            'breathing': {
                'en': {
                    '5': [
                        "Let's begin a 5-minute breathing exercise. Find a comfortable position and close your eyes if you feel comfortable doing so.",
                        "Take a moment to notice your natural breath. Don't change anything, just observe.",
                        "Now, we'll breathe together. Inhale slowly for 4 counts... 1, 2, 3, 4...",
                        "Hold your breath gently for 2 counts... 1, 2...",
                        "Exhale slowly for 6 counts... 1, 2, 3, 4, 5, 6...",
                        "Continue this pattern. Inhale for 4... hold for 2... exhale for 6...",
                        "If your mind wanders, that's perfectly normal. Gently bring your attention back to your breath.",
                        "You're doing wonderfully. Continue breathing at your own pace.",
                        "Take three more deep breaths with me.",
                        "When you're ready, slowly open your eyes. Notice how you feel. You've given yourself a beautiful gift of calm."
                    ],
                    '10': [
                        "Welcome to a 10-minute breathing meditation. Settle into a comfortable position.",
                        "Close your eyes softly and take a moment to arrive fully in this space.",
                        "Begin by taking three natural breaths, noticing the sensation of air entering and leaving your body.",
                        "Now, let's establish our rhythm. Inhale deeply for 4 counts... 1, 2, 3, 4...",
                        "Pause and hold for 4 counts... 1, 2, 3, 4...",
                        "Exhale slowly for 6 counts... 1, 2, 3, 4, 5, 6...",
                        "Continue this pattern, letting each breath wash away tension and stress.",
                        "If thoughts arise, acknowledge them with kindness and return to your breath.",
                        "Imagine your breath as waves gently washing over a peaceful shore.",
                        "With each exhale, release any worry or tension you've been carrying.",
                        "Continue breathing mindfully, honoring this time you've given yourself.",
                        "Take five more conscious breaths, appreciating your commitment to your well-being.",
                        "Slowly bring awareness back to your surroundings. Open your eyes when ready."
                    ]
                },
                'hi': {
                    '5': [
                        "आइए 5 मिनट का सांस का अभ्यास शुरू करते हैं। एक आरामदायक स्थिति में बैठें और यदि सहज लगे तो अपनी आंखें बंद कर लें।",
                        "अपनी प्राकृतिक सांस को महसूस करें। कुछ भी बदलने की कोशिश न करें, बस देखें।",
                        "अब हम साथ में सांस लेंगे। 4 गिनती तक धीरे-धीरे सांस अंदर लें... 1, 2, 3, 4...",
                        "अपनी सांस को 2 गिनती तक धीरे से रोकें... 1, 2...",
                        "6 गिनती तक धीरे-धीरे सांस छोड़ें... 1, 2, 3, 4, 5, 6...",
                        "इसी पैटर्न को जारी रखें। 4 की गिनती में सांस लें... 2 की गिनती में रोकें... 6 की गिनती में छोड़ें...",
                        "यदि आपका मन भटके, तो यह बिल्कुल सामान्य है। धीरे से अपना ध्यान वापस अपनी सांस पर लाएं।",
                        "आप बहुत अच्छा कर रहे हैं। अपनी गति से सांस लेना जारी रखें।",
                        "मेरे साथ तीन और गहरी सांसें लें।",
                        "जब आप तैयार हों, तो धीरे-धीरे अपनी आंखें खोलें। देखें कि आप कैसा महसूस कर रहे हैं। आपने अपने आप को शांति का एक सुंदर उपहार दिया है।"
                    ],
                    '10': [
                        "10 मिनट के सांस के ध्यान में आपका स्वागत है। एक आरामदायक स्थिति में बैठ जाएं।",
                        "अपनी आंखें धीरे से बंद करें और इस स्थान में पूरी तरह से आने के लिए एक पल लें।",
                        "तीन प्राकृतिक सांसें लेकर शुरुआत करें, हवा के आपके शरीर में प्रवेश करने और निकलने की संवेदना को महसूस करें।",
                        "अब, आइए अपनी लय स्थापित करते हैं। 4 गिनती के लिए गहरी सांस लें... 1, 2, 3, 4...",
                        "4 गिनती के लिए रुकें और रोकें... 1, 2, 3, 4...",
                        "6 गिनती के लिए धीरे-धीरे सांस छोड़ें... 1, 2, 3, 4, 5, 6...",
                        "इस पैटर्न को जारी रखें, हर सांस को तनाव और चिंता को धो जाने दें।",
                        "यदि विचार आएं, तो उन्हें दयालुता से स्वीकार करें और अपनी सांस पर वापस लौटें।",
                        "अपनी सांस की कल्पना शांत किनारे पर धीरे-धीरे आने वाली लहरों की तरह करें।",
                        "हर सांस छोड़ने के साथ, आपने जो भी चिंता या तनाव लिया है, उसे मुक्त करें।",
                        "सचेत रूप से सांस लेना जारी रखें, अपने कल्याण के लिए दिए गए इस समय का सम्मान करें।",
                        "पांच और सचेत सांसें लें, अपनी भलाई के प्रति अपनी प्रतिबद्धता की सराहना करें।",
                        "धीरे-धीरे अपने आसपास के वातावरण में जागरूकता लाएं। जब तैयार हों तो अपनी आंखें खोलें।"
                    ]
                }
            },
            'bodyscan': {
                'en': {
                    '10': [
                        "Welcome to a 10-minute body scan meditation. Lie down comfortably or sit with your back supported.",
                        "Close your eyes and take three deep, cleansing breaths.",
                        "We'll begin at the top of your head. Notice any sensations in your scalp and forehead.",
                        "Breathe into this area, allowing any tension to soften and release.",
                        "Move your attention to your eyes, cheeks, and jaw. Let your face relax completely.",
                        "Notice your neck and shoulders. With each exhale, let them drop and soften.",
                        "Bring awareness to your arms, from shoulders to fingertips. Feel the weight of your arms.",
                        "Focus on your chest and heart area. Notice your heartbeat and the rise and fall of your breath.",
                        "Move to your abdomen. Let your belly rise and fall naturally with each breath.",
                        "Notice your lower back and hips. Breathe into any areas of tension.",
                        "Bring attention to your thighs, knees, and calves. Feel the support beneath you.",
                        "Finally, notice your feet and toes. Feel grounded and connected to the earth.",
                        "Take a moment to feel your whole body as one unified, peaceful presence.",
                        "When ready, gently wiggle your fingers and toes, and slowly open your eyes."
                    ]
                },
                'hi': {
                    '10': [
                        "10 मिनट के बॉडी स्कैन मेडिटेशन में आपका स्वागत है। आराम से लेट जाएं या अपनी पीठ के सहारे बैठें।",
                        "अपनी आंखें बंद करें और तीन गहरी, शुद्ध करने वाली सांसें लें।",
                        "हम आपके सिर के ऊपरी हिस्से से शुरुआत करेंगे। अपनी खोपड़ी और माथे में किसी भी संवेदना को महसूस करें।",
                        "इस क्षेत्र में सांस लें, किसी भी तनाव को नरम होने और मुक्त होने दें।",
                        "अपना ध्यान अपनी आंखों, गालों और जबड़े पर ले जाएं। अपने चेहरे को पूरी तरह से आराम दें।",
                        "अपनी गर्दन और कंधों को महसूस करें। हर सांस छोड़ने के साथ, उन्हें गिरने और नरम होने दें।",
                        "अपनी बाहों में जागरूकता लाएं, कंधों से उंगलियों तक। अपनी बाहों का वजन महसूस करें।",
                        "अपनी छाती और हृदय क्षेत्र पर ध्यान दें। अपने दिल की धड़कन और सांस के उठने-गिरने को महसूस करें।",
                        "अपने पेट की ओर बढ़ें। अपने पेट को हर सांस के साथ प्राकृतिक रूप से उठने-गिरने दें।",
                        "अपनी पीठ के निचले हिस्से और कूल्हों को महसूस करें। तनाव के किसी भी क्षेत्र में सांस लें।",
                        "अपनी जांघों, घुटनों और पिंडलियों पर ध्यान दें। अपने नीचे के सहारे को महसूस करें।",
                        "अंत में, अपने पैरों और पैर की उंगलियों को महसूस करें। धरती से जुड़ाव और स्थिरता महसूस करें।",
                        "अपने पूरे शरीर को एक एकीकृत, शांतिपूर्ण उपस्थिति के रूप में महसूस करने के लिए एक पल लें।",
                        "जब तैयार हों, तो धीरे से अपनी उंगलियों और पैर की उंगलियों को हिलाएं, और धीरे-धीरे अपनी आंखें खोलें।"
                    ]
                }
            },
            'mindfulness': {
                'en': {
                    '5': [
                        "Welcome to a 5-minute mindfulness practice. Sit comfortably with your spine straight.",
                        "Close your eyes and bring your attention to the present moment.",
                        "Notice five things you can hear around you. Don't judge, just observe.",
                        "Now notice four things you can feel - perhaps your clothes, the air, the chair.",
                        "Observe three things you can smell, even if they're very subtle.",
                        "Think of two things you can taste, maybe from something you drank earlier.",
                        "Finally, visualize one beautiful thing in your mind's eye.",
                        "Take a moment to appreciate being fully present in this moment.",
                        "Notice how it feels to be completely here, now.",
                        "When ready, slowly open your eyes and carry this awareness with you."
                    ]
                },
                'hi': {
                    '5': [
                        "5 मिनट के माइंडफुलनेस अभ्यास में आपका स्वागत है। अपनी रीढ़ सीधी रखकर आराम से बैठें।",
                        "अपनी आंखें बंद करें और अपना ध्यान वर्तमान क्षण पर लाएं।",
                        "अपने आसपास पांच चीजों को सुनें जो आप सुन सकते हैं। न्याय न करें, बस देखें।",
                        "अब चार चीजों को महसूस करें जो आप छू सकते हैं - शायद आपके कपड़े, हवा, कुर्सी।",
                        "तीन चीजों को सूंघें जो आप महसूस कर सकते हैं, भले ही वे बहुत सूक्ष्म हों।",
                        "दो चीजों के बारे में सोचें जिनका स्वाद आप ले सकते हैं, शायद पहले कुछ पिया था।",
                        "अंत में, अपने मन की आंखों में एक सुंदर चीज की कल्पना करें।",
                        "इस क्षण में पूरी तरह से उपस्थित होने की सराहना करने के लिए एक पल लें।",
                        "देखें कि यहां, अभी पूरी तरह से होना कैसा लगता है।",
                        "जब तैयार हों, तो धीरे-धीरे अपनी आंखें खोलें और इस जागरूकता को अपने साथ ले जाएं।"
                    ]
                }
            }
        }
    
    def get_meditation_script(self, session_type, duration, language):
        """Get meditation script based on type, duration, and language"""
        try:
            # Normalize inputs
            session_type = session_type.lower()
            duration = str(duration)
            language = language if language in ['en', 'hi'] else 'en'
            
            # Get the script
            if session_type in self.scripts and language in self.scripts[session_type]:
                if duration in self.scripts[session_type][language]:
                    script_steps = self.scripts[session_type][language][duration]
                    
                    return {
                        'script': script_steps,
                        'language': language,
                        'session_type': session_type,
                        'duration': duration
                    }
            
            # Fallback to default
            fallback_scripts = {
                'en': [
                    "Let's begin with a simple breathing exercise.",
                    "Find a comfortable position and close your eyes.",
                    "Take a deep breath in through your nose for 4 counts.",
                    "Hold for 2 counts.",
                    "Exhale through your mouth for 6 counts.",
                    "Repeat this pattern at your own pace.",
                    "When ready, slowly open your eyes."
                ],
                'hi': [
                    "आइए एक सरल सांस अभ्यास के साथ शुरुआत करते हैं।",
                    "एक आरामदायक स्थिति खोजें और अपनी आंखें बंद करें।",
                    "4 गिनती के लिए अपनी नाक से गहरी सांस लें।",
                    "2 गिनती के लिए रोकें।",
                    "6 गिनती के लिए अपने मुंह से सांस छोड़ें।",
                    "अपनी गति से इस पैटर्न को दोहराएं।",
                    "जब तैयार हों, तो धीरे-धीरे अपनी आंखें खोलें।"
                ]
            }
            
            return {
                'script': fallback_scripts.get(language, fallback_scripts['en']),
                'language': language,
                'session_type': 'breathing',
                'duration': '5'
            }
            
        except Exception as e:
            # Emergency fallback
            return {
                'script': ["Take a moment to breathe deeply and relax."],
                'language': 'en',
                'session_type': 'breathing',
                'duration': '5'
            }
