import os
import logging
from flask import Flask, render_template, request, jsonify, session
from werkzeug.middleware.proxy_fix import ProxyFix
from assistant import MentalHealthAssistant
from voice_handler import VoiceHandler

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Initialize the mental health assistant and voice handler
assistant = MentalHealthAssistant()
voice_handler = VoiceHandler()

@app.route('/')
def index():
    """Main chat interface"""
    # Initialize session if needed
    if 'conversation_id' not in session:
        session['conversation_id'] = os.urandom(16).hex()
        session['user_language'] = None
    
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            }), 400
        
        # Get response from assistant
        response = assistant.process_message(user_message, session)
        
        return jsonify({
            'success': True,
            'response': response['message'],
            'language': response['language'],
            'session_type': response.get('session_type'),
            'crisis_detected': response.get('crisis_detected', False)
        })
        
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while processing your message. Please try again.'
        }), 500

@app.route('/meditation/<session_type>/<duration>')
def start_meditation(session_type, duration):
    """Start a guided meditation session"""
    try:
        # Get user's preferred language from session
        user_language = session.get('user_language', 'en')
        
        meditation_response = assistant.start_meditation_session(
            session_type, duration, user_language
        )
        
        return jsonify({
            'success': True,
            'meditation_script': meditation_response['script'],
            'language': meditation_response['language'],
            'duration': duration,
            'session_type': session_type
        })
        
    except Exception as e:
        logging.error(f"Error starting meditation: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Unable to start meditation session. Please try again.'
        }), 500

@app.route('/resources')
def get_resources():
    """Get mental health resources"""
    try:
        user_language = session.get('user_language', 'en')
        resources = assistant.get_mental_health_resources(user_language)
        
        return jsonify({
            'success': True,
            'resources': resources,
            'language': user_language
        })
        
    except Exception as e:
        logging.error(f"Error getting resources: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Unable to retrieve resources. Please try again.'
        }), 500

@app.route('/voice/speech-to-text', methods=['POST'])
def speech_to_text():
    """Convert speech audio to text"""
    try:
        if not voice_handler.is_available():
            return jsonify({
                'success': False,
                'error': 'Voice functionality not available on this server'
            }), 503
        
        data = request.get_json()
        audio_data = data.get('audio_data')
        language = data.get('language', 'en')
        
        if not audio_data:
            return jsonify({
                'success': False,
                'error': 'No audio data provided'
            }), 400
        
        # Convert speech to text
        text, error = voice_handler.speech_to_text(audio_data, language)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        return jsonify({
            'success': True,
            'text': text,
            'language': language
        })
        
    except Exception as e:
        logging.error(f"Speech to text error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error processing speech input'
        }), 500

@app.route('/voice/text-to-speech', methods=['POST'])
def text_to_speech():
    """Convert text to speech audio"""
    try:
        if not voice_handler.is_available():
            return jsonify({
                'success': False,
                'error': 'Voice functionality not available on this server'
            }), 503
        
        data = request.get_json()
        text = data.get('text', '').strip()
        language = data.get('language', 'en')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        # Convert text to speech
        audio_data, error = voice_handler.text_to_speech(text, language)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        return jsonify({
            'success': True,
            'audio_data': audio_data,
            'language': language
        })
        
    except Exception as e:
        logging.error(f"Text to speech error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error generating speech output'
        }), 500

@app.route('/voice/status')
def voice_status():
    """Get voice functionality status"""
    try:
        status = {
            'available': voice_handler.is_available(),
            'speech_recognition': voice_handler.recognizer is not None,
            'text_to_speech': voice_handler.tts_engine is not None,
            'supported_languages': list(voice_handler.supported_languages.keys())
        }
        
        if voice_handler.is_available():
            test_results = voice_handler.test_voice_functionality()
            status.update(test_results)
            status['available_voices'] = voice_handler.get_available_voices()
        
        return jsonify({
            'success': True,
            'status': status
        })
        
    except Exception as e:
        logging.error(f"Voice status error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error checking voice status'
        }), 500

@app.route('/voice/test', methods=['POST'])
def test_voice():
    """Test voice functionality with sample text"""
    try:
        if not voice_handler.is_available():
            return jsonify({
                'success': False,
                'error': 'Voice functionality not available on this server'
            }), 503
        
        data = request.get_json()
        language = data.get('language', 'en')
        test_text = data.get('text', 'Hello! This is a voice test. If you can hear this, your voice functionality is working correctly.')
        
        # Test text-to-speech
        audio_data, error = voice_handler.text_to_speech(test_text, language)
        
        if error:
            return jsonify({
                'success': False,
                'error': f'Text-to-speech test failed: {error}'
            }), 400
        
        # Get voice system information
        voice_info = voice_handler.get_available_voices()
        test_results = voice_handler.test_voice_functionality()
        
        return jsonify({
            'success': True,
            'audio_data': audio_data,
            'language': language,
            'test_text': test_text,
            'voice_info': voice_info,
            'test_results': test_results,
            'message': 'Voice test completed successfully!'
        })
        
    except Exception as e:
        logging.error(f"Voice test error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Voice test failed: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('index.html'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
