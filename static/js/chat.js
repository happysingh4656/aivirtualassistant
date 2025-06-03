class SerenityChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        
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
        
        this.initializeEventListeners();
        this.focusInput();
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
        
        // You could add a message about language change here
        console.log('Language changed to:', selectedLang);
    }
    
    handleMeditationOffer() {
        // Scroll to see the meditation buttons when they appear
        setTimeout(() => {
            this.scrollToBottom();
        }, 1500);
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
