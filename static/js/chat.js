class SerenityChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');

        // Voice elements
        this.voiceButton = document.getElementById('voiceButton');
        this.speakerButton = document.getElementById('speakerButton');
        this.voiceStatus = document.getElementById('voiceStatus');

        // Meditation modal elements
        this.meditationModal = new bootstrap.Modal(document.getElementById('meditationModal'));
        this.meditationContent = document.getElementById('meditationContent');
        this.nextMeditationStep = document.getElementById('nextMeditationStep');

        // Resources modal elements
        this.resourcesModal = new bootstrap.Modal(document.getElementById('resourcesModal'));
        this.resourcesContent = document.getElementById('resourcesContent');

        // Meditation session state
        this.currentMeditationSession = null;
        this.currentStep = 0;

        // Voice functionality state
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.voiceAvailable = false;
        this.currentLanguage = 'en';
        this.continuousMode = false;
        this.speakerMode = true; // Default to enabled for conversational experience
        
        // Conversation mode state
        this.selectedMode = null; // 'voice' or 'text'
        this.voiceConversationPending = false;

        this.initializeEventListeners();
        this.initializeVoiceFeatures();
        this.focusInput();
        this.showWelcomeMessage();
    }

    initializeEventListeners() {
        // Chat form submission
        this.chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));

        // Enter key in input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage(e);
            }
        });

        // Meditation next step
        this.nextMeditationStep.addEventListener('click', () => this.nextMeditationStepHandler());

        // Language selector change
        document.querySelectorAll('input[name="language"], input[name="mobileLanguage"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleLanguageChange(e));
        });

        // Voice button events
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => this.toggleVoiceRecording());
        }

        if (this.speakerButton) {
            this.speakerButton.addEventListener('click', () => this.toggleSpeakerMode());
        }

        // Test voice button
        this.testVoiceButton = document.getElementById('testVoiceButton');
        if (this.testVoiceButton) {
            this.testVoiceButton.addEventListener('click', () => this.testVoiceFunctionality());
        }

        // Conversation mode button
        this.conversationModeButton = document.getElementById('conversationModeButton');
        if (this.conversationModeButton) {
            this.conversationModeButton.addEventListener('click', () => this.toggleConversationMode());
        }
    }

    async handleSendMessage(e) {
        e.preventDefault();

        const message = this.messageInput.value.trim();
        if (!message) return;

        // Disable form while processing
        this.setFormState(false);

        // Add user message to chat
        this.addMessage(message, 'user');

        // Clear input
        this.messageInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            if (data.success) {
                // Add assistant response
                this.addMessage(data.response, 'assistant', {
                    language: data.language,
                    sessionType: data.session_type,
                    crisisDetected: data.crisis_detected
                });

                // Handle special response types
                if (data.session_type === 'meditation_offer') {
                    this.handleMeditationOffer();
                }
            } else {
                this.addMessage('I apologize, but I encountered an error. Please try again.', 'assistant', { error: true });
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('I\'m having trouble connecting right now. Please check your internet connection and try again.', 'assistant', { error: true });
        } finally {
            this.hideTypingIndicator();
            this.setFormState(true);
            this.focusInput();
        }
    }

    addMessage(content, sender, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        if (options.crisisDetected) {
            messageDiv.classList.add('crisis-message');
        }

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';

        if (sender === 'assistant') {
            avatarDiv.innerHTML = '<i class="fas fa-leaf"></i>';
        } else {
            avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Process content for markdown-like formatting
        const processedContent = this.processMessageContent(content);
        contentDiv.innerHTML = processedContent;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Add meditation buttons if this is a meditation offer
        if (options.sessionType === 'meditation_offer') {
            this.addMeditationButtons(contentDiv);
        }
    }

    processMessageContent(content) {
        // Convert newlines to <br>
        let processed = content.replace(/\n/g, '<br>');

        // Convert **bold** to <strong>
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert bullet points
        processed = processed.replace(/^[•·]\s*(.*?)$/gm, '<li>$1</li>');

        // Wrap consecutive list items in <ul>
        processed = processed.replace(/(<li>.*?<\/li>)(<br>)?(?=<li>|$)/gs, (match, listItem) => {
            return listItem;
        });

        // Group list items
        processed = processed.replace(/(<li>.*?<\/li>)(<br>)*(<li>.*?<\/li>)/gs, (match) => {
            const items = match.match(/<li>.*?<\/li>/g);
            if (items && items.length > 1) {
                return '<ul>' + items.join('') + '</ul>';
            }
            return match;
        });

        // Clean up any remaining standalone list items
        processed = processed.replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');

        return processed;
    }

    addMeditationButtons(contentDiv) {
        setTimeout(() => {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'meditation-buttons mt-3';

            const buttons = [
                { text: 'Breathing Exercise (5 min)', type: 'breathing', duration: '5' },
                { text: 'Body Scan (10 min)', type: 'bodyscan', duration: '10' },
                { text: 'Mindfulness (5 min)', type: 'mindfulness', duration: '5' }
            ];

            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary btn-sm me-2 mb-2';
                btn.textContent = button.text;
                btn.onclick = () => this.startMeditation(button.type, button.duration);
                buttonContainer.appendChild(btn);
            });

            contentDiv.appendChild(buttonContainer);
        }, 1000);
    }

    async startMeditation(sessionType, duration) {
        try {
            const response = await fetch(`/meditation/${sessionType}/${duration}`);
            const data = await response.json();

            if (data.success) {
                this.currentMeditationSession = data;
                this.currentStep = 0;
                this.showMeditationModal();
            }
        } catch (error) {
            console.error('Meditation start error:', error);
            this.addMessage('Unable to start meditation session. Please try again.', 'assistant', { error: true });
        }
    }

    showMeditationModal() {
        if (!this.currentMeditationSession) return;

        const { meditation_script, session_type, duration } = this.currentMeditationSession;

        // Update modal title
        const modalTitle = document.querySelector('#meditationModal .modal-title');
        modalTitle.textContent = `${session_type.charAt(0).toUpperCase() + session_type.slice(1)} Meditation (${duration} min)`;

        // Show first step
        this.updateMeditationStep();

        this.meditationModal.show();
    }

    updateMeditationStep() {
        if (!this.currentMeditationSession) return;

        const { meditation_script } = this.currentMeditationSession;
        const totalSteps = meditation_script.length;

        if (this.currentStep >= totalSteps) {
            // Meditation complete
            this.completeMeditation();
            return;
        }

        // Update progress bar
        const progressHtml = `
            <div class="meditation-progress">
                <div class="meditation-progress-bar" style="width: ${(this.currentStep / totalSteps) * 100}%"></div>
            </div>
        `;

        // Update content
        const stepHtml = `
            ${progressHtml}
            <div class="meditation-step">
                <h6>Step ${this.currentStep + 1} of ${totalSteps}</h6>
                <p>${meditation_script[this.currentStep]}</p>
            </div>
        `;

        this.meditationContent.innerHTML = stepHtml;

        // Update button text
        if (this.currentStep === totalSteps - 1) {
            this.nextMeditationStep.textContent = 'Complete';
        } else {
            this.nextMeditationStep.textContent = 'Next';
        }
    }

    nextMeditationStepHandler() {
        this.currentStep++;
        this.updateMeditationStep();
    }

    completeMeditation() {
        this.meditationContent.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                <h5>Meditation Complete!</h5>
                <p>Well done! You've completed your meditation session. Take a moment to notice how you feel.</p>
            </div>
        `;

        this.nextMeditationStep.style.display = 'none';

        // Add completion message to chat
        setTimeout(() => {
            this.meditationModal.hide();
            this.addMessage('🧘‍♀️ Congratulations on completing your meditation session! How are you feeling now?', 'assistant');
            this.currentMeditationSession = null;
            this.currentStep = 0;
            this.nextMeditationStep.style.display = 'inline-block';
        }, 3000);
    }

    async showResources() {
        try {
            const response = await fetch('/resources');
            const data = await response.json();

            if (data.success) {
                this.displayResources(data.resources);
                this.resourcesModal.show();
            }
        } catch (error) {
            console.error('Resources error:', error);
            this.addMessage('Unable to load resources. Please try again.', 'assistant', { error: true });
        }
    }

    displayResources(resources) {
        let resourcesHtml = `
            <div class="alert alert-warning">
                ${resources.disclaimer}
            </div>
            <h6 class="mb-3">Emergency Helplines:</h6>
        `;

        resources.helplines.forEach(helpline => {
            resourcesHtml += `
                <div class="resource-card">
                    <h6>${helpline.name}</h6>
                    <p class="resource-number">${helpline.number}</p>
                    <p class="text-muted">${helpline.description}</p>
                </div>
            `;
        });

        this.resourcesContent.innerHTML = resourcesHtml;
    }

    setFormState(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;

        if (enabled) {
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        } else {
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    focusInput() {
        this.messageInput.focus();
    }

    handleLanguageChange(e) {
        // Sync language selection between desktop and mobile
        const selectedLang = e.target.value;
        document.querySelectorAll('input[name="language"], input[name="mobileLanguage"]').forEach(radio => {
            radio.checked = radio.value === selectedLang;
        });

        this.currentLanguage = selectedLang;
        
        // If voice conversation is pending and language is selected, start voice conversation
        if (this.voiceConversationPending && this.selectedMode === 'voice') {
            this.voiceConversationPending = false;
            this.startVoiceConversation(selectedLang);
        }
        
        console.log('Language changed to:', selectedLang);
    }

    async startVoiceConversation(language) {
        // Send language confirmation to assistant
        const languageName = language === 'en' ? 'English' : 'Hindi';
        const confirmationMessage = `I would like to communicate in ${languageName}`;
        
        // Add user message to show language selection
        this.addMessage(confirmationMessage, 'user');
        
        // Send message to assistant to confirm language and start voice mode
        await this.sendVoiceMessage(confirmationMessage);
        
        // Enable continuous conversation mode automatically after response
        setTimeout(() => {
            if (!this.continuousMode) {
                this.toggleConversationMode();
            }
        }, 3000);
    }

    handleMeditationOffer() {
        // Scroll to see the meditation buttons when they appear
        setTimeout(() => {
            this.scrollToBottom();
        }, 1500);
    }

    async initializeVoiceFeatures() {
        try {
            // Check voice functionality status
            const response = await fetch('/voice/status');
            const data = await response.json();

            if (data.success) {
                this.voiceAvailable = data.status.available;
                this.updateVoiceUI(data.status);
            }

            // Request microphone permission
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('Microphone access granted');
                } catch (error) {
                    console.warn('Microphone access denied:', error);
                }
            }
        } catch (error) {
            console.error('Voice initialization error:', error);
            this.updateVoiceUI({ available: false });
        }
    }

    updateVoiceUI(status) {
        if (this.voiceStatus) {
            if (status.available) {
                this.voiceStatus.innerHTML = '🎤 Voice Ready';
                this.voiceStatus.className = 'badge bg-success ms-2';
            } else {
                this.voiceStatus.innerHTML = '🎤 Voice Unavailable';
                this.voiceStatus.className = 'badge bg-warning ms-2';
            }
        }

        if (this.voiceButton) {
            this.voiceButton.disabled = !status.available;
        }

        if (this.speakerButton) {
            this.speakerButton.disabled = !status.available;
        }

        if (this.conversationModeButton) {
            this.conversationModeButton.disabled = !status.available;
        }

        if (this.testVoiceButton) {
            this.testVoiceButton.disabled = !status.available;
        }
    }

    async toggleVoiceRecording() {
        if (!this.voiceAvailable) {
            this.addMessage('Voice functionality is not available on this server.', 'assistant', { error: true });
            return;
        }

        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            // Request microphone access with fallback constraints
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
            } catch (constraintError) {
                console.warn('Failed with specific constraints, trying basic audio:', constraintError);
                // Fallback to basic audio if constraints fail
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            // Find best supported MIME type
            let mimeType = 'audio/wav';
            const supportedTypes = [
                'audio/wav',
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus'
            ];

            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }

            console.log('Using MIME type:', mimeType);

            // Create MediaRecorder with error handling
            try {
                this.mediaRecorder = new MediaRecorder(stream, { 
                    mimeType,
                    audioBitsPerSecond: 128000
                });
            } catch (recorderError) {
                console.warn('MediaRecorder creation failed, trying without options:', recorderError);
                this.mediaRecorder = new MediaRecorder(stream);
                mimeType = this.mediaRecorder.mimeType;
            }

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                console.log('Data available:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                console.log('Recording stopped, processing', this.audioChunks.length, 'chunks');
                try {
                    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                    console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
                    
                    if (audioBlob.size === 0) {
                        throw new Error('No audio data recorded. Please try speaking longer or check your microphone.');
                    }
                    
                    if (audioBlob.size < 1000) {
                        throw new Error('Audio recording too short. Please speak for at least 1 second.');
                    }
                    
                    await this.processVoiceInput(audioBlob);
                } catch (error) {
                    console.error('Error processing recorded audio:', error);
                    this.addMessage(`Error processing recorded audio: ${error.message}`, 'assistant', { error: true });
                } finally {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                    this.audioChunks = [];
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.addMessage(`Recording error: ${event.error?.message || 'Unknown error'}. Please try again.`, 'assistant', { error: true });
                this.isRecording = false;
                this.updateVoiceButtonState(false);
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording
            try {
                this.mediaRecorder.start(1000); // Collect data every second
                this.isRecording = true;

                // Update UI
                this.updateVoiceButtonState(true);
                this.addMessage('🎤 Listening... Click the stop button when finished speaking.', 'assistant');

                // Auto-stop after 30 seconds to prevent very long recordings
                setTimeout(() => {
                    if (this.isRecording) {
                        console.log('Auto-stopping recording after 30 seconds');
                        this.stopRecording();
                    }
                }, 30000);

            } catch (startError) {
                console.error('Failed to start recording:', startError);
                stream.getTracks().forEach(track => track.stop());
                throw new Error('Failed to start recording. Please try again.');
            }

        } catch (error) {
            console.error('Recording error:', error);
            let errorMessage = 'Unable to access microphone. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow microphone access in your browser settings and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No microphone found. Please connect a microphone and try again.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Your browser does not support audio recording.';
            } else {
                errorMessage += `${error.message || 'Please check your microphone settings and try again.'}`;
            }
            
            this.addMessage(errorMessage, 'assistant', { error: true });
            this.isRecording = false;
            this.updateVoiceButtonState(false);
        }
    }

    updateVoiceButtonState(isRecording) {
        if (this.voiceButton) {
            if (isRecording) {
                this.voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
                this.voiceButton.className = 'btn btn-danger';
                this.voiceButton.title = 'Stop Recording';
            } else {
                this.voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                this.voiceButton.className = 'btn btn-outline-primary';
                this.voiceButton.title = 'Voice Input';
            }
        }
    }

    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateVoiceButtonState(false);
        }
    }

    async processVoiceInput(audioBlob) {
        try {
            console.log('Processing audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
            
            // Validate audio blob
            if (!audioBlob || audioBlob.size === 0) {
                throw new Error('No audio data recorded. Please try again.');
            }

            // Convert audio blob to WAV format if needed
            const wavBlob = await this.convertToWav(audioBlob);
            console.log('Converted to WAV:', wavBlob.size, 'bytes');

            // Validate converted audio
            if (!wavBlob || wavBlob.size === 0) {
                throw new Error('Audio conversion failed. Please try recording again.');
            }

            // Convert audio blob to base64 with better error handling
            const audioBuffer = await wavBlob.arrayBuffer();
            
            // Create base64 in chunks to avoid memory issues
            const uint8Array = new Uint8Array(audioBuffer);
            let binary = '';
            const chunkSize = 1024;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.slice(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, chunk);
            }
            const audioBase64 = btoa(binary);

            console.log('Audio converted to base64, length:', audioBase64.length);

            this.showTypingIndicator();

            // Send to speech-to-text endpoint with better error handling
            const response = await fetch('/voice/speech-to-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio_data: audioBase64,
                    language: this.currentLanguage || 'en'
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                throw new Error('Invalid response from server. Please try again.');
            }

            if (!response.ok) {
                const errorMsg = data?.error || `Server error (${response.status})`;
                throw new Error(errorMsg);
            }

            if (data.success && data.text && data.text.trim()) {
                // Add recognized text to chat
                this.addMessage(data.text, 'user');

                // Process the message automatically
                await this.sendVoiceMessage(data.text);
            } else {
                const errorMsg = data.error || 'Could not understand speech. Please try again or speak more clearly.';
                this.addMessage(`❌ ${errorMsg}`, 'assistant', { error: true });
            }

        } catch (error) {
            console.error('Voice processing error:', error);
            console.error('Error details:', {
                name: error?.name || 'Unknown',
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace'
            });
            
            let errorMessage = 'Error processing voice input. ';
            
            if (error && error.message && typeof error.message === 'string') {
                if (error.message.includes('HTTP 503') || error.message.includes('Service Unavailable')) {
                    errorMessage += 'Voice service is not available on this server.';
                } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
                    errorMessage += 'Please check your internet connection and try again.';
                } else if (error.message.includes('No audio data')) {
                    errorMessage = error.message;
                } else if (error.message.includes('conversion failed')) {
                    errorMessage = error.message;
                } else {
                    errorMessage += error.message;
                }
            } else if (error && typeof error === 'string') {
                errorMessage += error;
            } else {
                errorMessage += 'Unknown error occurred. Please try speaking again.';
            }
            
            this.addMessage(errorMessage, 'assistant', { error: true });
        } finally {
            this.hideTypingIndicator();
        }
    }

    async convertToWav(audioBlob) {
        try {
            // If it's already WAV, return as is
            if (audioBlob.type.includes('wav')) {
                return audioBlob;
            }

            // Create audio context for conversion
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            // Convert blob to array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Convert to WAV format
            const wavBuffer = this.audioBufferToWav(audioBuffer);
            
            audioContext.close();
            
            return new Blob([wavBuffer], { type: 'audio/wav' });
        } catch (error) {
            console.warn('Audio conversion failed, using original:', error);
            return audioBlob;
        }
    }

    audioBufferToWav(buffer) {
        const numChannels = 1; // Force mono
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        // Get audio data and convert to mono if needed
        let audioData;
        if (buffer.numberOfChannels === 1) {
            audioData = buffer.getChannelData(0);
        } else {
            // Mix down to mono
            const left = buffer.getChannelData(0);
            const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
            audioData = new Float32Array(left.length);
            for (let i = 0; i < left.length; i++) {
                audioData[i] = (left[i] + right[i]) / 2;
            }
        }

        const bufferLength = audioData.length;
        const arrayBuffer = new ArrayBuffer(44 + bufferLength * bytesPerSample);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + bufferLength * bytesPerSample, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, bufferLength * bytesPerSample, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < bufferLength; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        return arrayBuffer;
    }

    async sendVoiceMessage(message) {
        try {
            this.showTypingIndicator();
            
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessage(data.response, 'assistant', {
                    language: data.language,
                    sessionType: data.session_type,
                    crisisDetected: data.crisis_detected
                });

                // Always speak response if speaker mode is enabled
                if (this.speakerMode) {
                    await this.speakText(data.response, data.language);
                }

                // Handle special response types
                if (data.session_type === 'meditation_offer') {
                    this.handleMeditationOffer();
                } else if (data.session_type === 'language_confirmed') {
                    // After language confirmation, enable conversation mode and prompt for input
                    if (!this.continuousMode) {
                        setTimeout(() => {
                            this.toggleConversationMode();
                            // Immediately prompt for voice input after language confirmation
                            setTimeout(() => {
                                this.promptForVoiceInput();
                            }, 1000);
                        }, 2000);
                    } else {
                        // If already in continuous mode, just prompt for input
                        setTimeout(() => {
                            this.promptForVoiceInput();
                        }, 3000);
                    }
                }

                // Enable continuous conversation mode with longer delay for user to process
                if (this.continuousMode && !data.crisis_detected && data.session_type !== 'language_confirmed') {
                    setTimeout(() => {
                        this.promptForVoiceInput();
                    }, 4000);
                }
            }
        } catch (error) {
            console.error('Voice message error:', error);
            this.addMessage('Error processing voice message.', 'assistant', { error: true });
        } finally {
            this.hideTypingIndicator();
        }
    }

    promptForNextInput() {
        if (this.voiceAvailable && !this.isRecording) {
            this.addMessage('🎤 Ready for your next message. Click the microphone to continue.', 'assistant');
        }
    }

    promptForVoiceInput() {
        if (this.voiceAvailable && !this.isRecording) {
            const promptMessage = this.currentLanguage === 'hi' ? 
                '🎤 अब आप बोल सकते हैं। माइक्रोफोन बटन दबाकर अपनी बात कहें।' :
                '🎤 You can now speak. Press the microphone button to share what\'s on your mind.';
            
            this.addMessage(promptMessage, 'assistant');
            
            // Auto-highlight the voice button to draw attention
            if (this.voiceButton) {
                this.voiceButton.classList.add('btn-warning');
                this.voiceButton.classList.remove('btn-outline-primary');
                
                // Reset button style after 5 seconds
                setTimeout(() => {
                    if (this.voiceButton && !this.isRecording) {
                        this.voiceButton.classList.remove('btn-warning');
                        this.voiceButton.classList.add('btn-outline-primary');
                    }
                }, 5000);
            }
        }
    }

    async toggleSpeakerMode() {
        this.speakerMode = !this.speakerMode;

        if (this.speakerButton) {
            if (this.speakerMode) {
                this.speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.speakerButton.className = 'btn btn-success';
                this.speakerButton.title = 'Speaker On';
                this.addMessage('🔊 Speaker mode enabled. Responses will be spoken aloud.', 'assistant');
            } else {
                this.speakerButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
                this.speakerButton.className = 'btn btn-outline-secondary';
                this.speakerButton.title = 'Speaker Off';
                this.addMessage('🔇 Speaker mode disabled.', 'assistant');
            }
        }
    }

    async speakText(text, language = 'en') {
        if (!this.voiceAvailable) {
            console.warn('Voice functionality not available');
            return;
        }

        try {
            const response = await fetch('/voice/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: language
                })
            });

            const data = await response.json();

            if (data.success && data.audio_data) {
                // Convert base64 to audio and play
                const audioBlob = this.base64ToBlob(data.audio_data, 'audio/wav');
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                };

                await audio.play();
            }
        } catch (error) {
            console.error('Text-to-speech error:', error);
        }
    }

    base64ToBlob(base64Data, contentType) {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }

    async testVoiceFunctionality() {
        if (!this.voiceAvailable) {
            this.addMessage('Voice functionality is not available on this server.', 'assistant', { error: true });
            return;
        }

        try {
            // Show loading state
            this.testVoiceButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
            this.testVoiceButton.disabled = true;

            this.addMessage('🧪 Testing voice functionality...', 'assistant');

            const response = await fetch('/voice/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: this.currentLanguage,
                    text: this.currentLanguage === 'hi' ? 
                        'नमस्ते! यह एक आवाज़ परीक्षण है। यदि आप इसे सुन सकते हैं, तो आपकी आवाज़ कार्यक्षमता सही तरीके से काम कर रही है।' :
                        'Hello! This is a voice test. If you can hear this, your voice functionality is working correctly.'
                })
            });

            const data = await response.json();

            if (data.success) {
                // Play the test audio
                if (data.audio_data) {
                    const audioBlob = this.base64ToBlob(data.audio_data, 'audio/wav');
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);

                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                    };

                    await audio.play();
                }

                // Show test results
                let resultMessage = '✅ Voice test completed successfully!\n\n';
                resultMessage += `📊 Test Results:\n`;
                resultMessage += `• Text-to-Speech: ${data.test_results.text_to_speech ? '✅ Working' : '❌ Failed'}\n`;
                resultMessage += `• Speech Recognition: ${data.test_results.speech_recognition ? '✅ Available' : '❌ Not Available'}\n`;
                resultMessage += `• Language: ${data.language}\n`;
                resultMessage += `• Available Voices: ${data.voice_info.length}`;

                this.addMessage(resultMessage, 'assistant');

                // Show available voices if any
                if (data.voice_info.length > 0) {
                    let voicesInfo = '\n🎤 Available Voices:\n';
                    data.voice_info.slice(0, 5).forEach((voice, index) => {
                        voicesInfo += `${index + 1}. ${voice.name} (${voice.language})\n`;
                    });
                    if (data.voice_info.length > 5) {
                        voicesInfo += `... and ${data.voice_info.length - 5} more`;
                    }
                    this.addMessage(voicesInfo, 'assistant');
                }

            } else {
                this.addMessage(`❌ Voice test failed: ${data.error}`, 'assistant', { error: true });
            }

        } catch (error) {
            console.error('Voice test error:', error);
            this.addMessage('❌ Error running voice test. Please try again.', 'assistant', { error: true });
        } finally {
            // Reset button state
            this.testVoiceButton.innerHTML = '<i class="fas fa-vial"></i>';
            this.testVoiceButton.title = 'Test Voice';
            this.testVoiceButton.disabled = !this.voiceAvailable;
        }
    }

    toggleConversationMode() {
        this.continuousMode = !this.continuousMode;

        if (this.conversationModeButton) {
            if (this.continuousMode) {
                this.conversationModeButton.innerHTML = '<i class="fas fa-comments"></i>';
                this.conversationModeButton.className = 'btn btn-success';
                this.conversationModeButton.title = 'Conversation Mode: On';
                this.addMessage('💬 Conversation mode enabled. I\'ll prompt you for continuous voice interaction.', 'assistant');
                
                // Auto-enable speaker mode
                if (!this.speakerMode) {
                    this.toggleSpeakerMode();
                }
            } else {
                this.conversationModeButton.innerHTML = '<i class="fas fa-comment"></i>';
                this.conversationModeButton.className = 'btn btn-outline-primary';
                this.conversationModeButton.title = 'Conversation Mode: Off';
                this.addMessage('💬 Conversation mode disabled.', 'assistant');
            }
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showConversationModeModal();
        }, 1000);
    }

    showConversationModeModal() {
        // Create and show the conversation mode selection modal
        const modalHtml = `
            <div class="modal fade" id="conversationModeModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">🙏 Welcome to Serenity</h5>
                        </div>
                        <div class="modal-body text-center">
                            <div class="mb-4">
                                <img src="/static/assets/meditation-icon.svg" alt="Serenity" style="width: 60px; height: 60px;" class="mb-3">
                                <h6>Your Bilingual Mental Health Companion</h6>
                                <p class="text-muted">आपका द्विभाषी मानसिक स्वास्थ्य साथी</p>
                            </div>
                            
                            <div class="mb-4">
                                <h6>How would you like to communicate?</h6>
                                <p class="small text-muted">आप कैसे बातचीत करना चाहेंगे?</p>
                            </div>
                            
                            <div class="d-grid gap-3">
                                <button type="button" class="btn btn-success btn-lg" onclick="serenityChat.selectConversationMode('voice')">
                                    <i class="fas fa-microphone me-2"></i>
                                    Voice Conversation
                                    <br><small class="text-light">आवाज़ से बातचीत</small>
                                </button>
                                <button type="button" class="btn btn-primary btn-lg" onclick="serenityChat.selectConversationMode('text')">
                                    <i class="fas fa-keyboard me-2"></i>
                                    Text Chat
                                    <br><small class="text-light">टेक्स्ट चैट</small>
                                </button>
                            </div>
                            
                            <div class="mt-3">
                                <small class="text-muted">
                                    💡 You can switch between modes anytime during our conversation
                                    <br>बातचीत के दौरान आप कभी भी मोड बदल सकते हैं
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('conversationModeModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('conversationModeModal'));
        modal.show();
    }

    selectConversationMode(mode) {
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('conversationModeModal'));
        modal.hide();
        
        // Remove modal from DOM
        setTimeout(() => {
            const modalElement = document.getElementById('conversationModeModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 300);
        
        // Set conversation mode
        this.selectedMode = mode;
        
        if (mode === 'voice') {
            // Enable voice features and show voice welcome
            this.showVoiceWelcome();
        } else {
            // Show text chat welcome
            this.showTextWelcome();
        }
    }

    showVoiceWelcome() {
        this.addMessage('🎤 **Voice Mode Selected!**\n\n🙏 Hello! मैं Serenity हूँ - I\'m Serenity, your bilingual mental health companion.\n\n**Before we begin our voice conversation, please select your preferred language:**\n\n• Click "English" for English conversation\n• Click "हिंदी" for Hindi conversation\n• अंग्रेजी के लिए "English" पर क्लिक करें\n• हिंदी बातचीत के लिए "हिंदी" पर क्लिक करें\n\nOnce you select your language, I\'ll start our voice conversation! 🎙️', 'assistant');
        
        // Auto-enable speaker mode for voice conversation
        if (!this.speakerMode) {
            this.toggleSpeakerMode();
        }
        
        // Enable conversation mode after language selection
        this.voiceConversationPending = true;
    }

    showTextWelcome() {
        this.addMessage('💬 **Text Chat Mode Selected!**\n\n🙏 Hello! मैं Serenity हूँ - I\'m Serenity, your bilingual mental health companion.\n\nBefore we begin, I\'d like to know: **Would you prefer to communicate in English or Hindi?** (क्या आप अंग्रेजी या हिंदी में बात करना पसंद करेंगे?)\n\nPlease select your preferred language above, or simply tell me "English" or "Hindi" / "अंग्रेजी" या "हिंदी".\n\nOnce you confirm your language, we can start our conversation! 😊', 'assistant');
    }
}

// Quick action functions
function startQuickMeditation() {
    serenityChat.addMessage("I'd like to start a quick meditation session", 'user');
    serenityChat.handleSendMessage(new Event('submit'));
}

function getStressTip() {
    serenityChat.addMessage("Can you give me a stress relief tip?", 'user');
    serenityChat.handleSendMessage(new Event('submit'));
}

function showResources() {
    serenityChat.showResources();
}

// Initialize chat when page loads
let serenityChat;
document.addEventListener('DOMContentLoaded', () => {
    serenityChat = new SerenityChat();
});

// Handle page visibility change to focus input when returning to tab
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && serenityChat) {
        serenityChat.focusInput();
    }
});