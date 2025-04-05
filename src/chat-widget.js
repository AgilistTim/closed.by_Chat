/**
 * ChatWidget - A lightweight, customizable chat widget
 * @version 1.0.0
 * @license MIT
 */
class ChatWidget {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'bottom-right',
            theme: options.theme || {
                primary: '#2196F3',
                secondary: '#ffffff',
                text: '#000000'
            },
            title: options.title || 'Chat Widget',
            greeting: options.greeting || 'Hello! How can I help you today?',
            placeholder: options.placeholder || 'Type a message...',
            endpoint: options.endpoint || 'https://closedbyrick.app.n8n.cloud/webhook/9147e53d-f8f7-4ade-8336-633759855053/chat'
        };
        
        this.callbacks = {};
        this.messages = [];
        this.isOpen = false;
        
        this.initialize();
    }

    // Event system
    on(event, callback) {
        this.callbacks[event] = this.callbacks[event] || [];
        this.callbacks[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.callbacks[event]) return this;
        this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        return this;
    }

    emit(event, data) {
        if (!this.callbacks[event]) return;
        this.callbacks[event].forEach(callback => callback(data));
    }

    updateConnectionStatus(isConnected) {
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `chat-connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        
        const header = this.element.querySelector('.chat-widget-header');
        const existingStatus = header.querySelector('.chat-connection-status');
        if (existingStatus) {
            header.removeChild(existingStatus);
        }
        header.appendChild(statusIndicator);
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.input.value = '';
        this.showTypingIndicator();

        try {
            const response = await fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action: 'sendMessage',
                    sessionId: this.getSessionId(),
                    chatInput: text
                })
            });

            this.removeTypingIndicator();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.emit('message_sent', text);
            this.updateConnectionStatus(true);
            
            if (data.output) {
                this.addMessage(data.output, 'bot');
                this.emit('message_received', data.output);
            }
        } catch (error) {
            this.removeTypingIndicator();
            this.emit('message_error', error);
            this.updateConnectionStatus(false);
            
            let errorMessage = 'Sorry, there was an error sending your message. ';
            if (error.message.includes('500')) {
                errorMessage = 'The chat service is currently experiencing issues. Please try again in a moment.';
            } else if (!navigator.onLine) {
                errorMessage += 'Please check your internet connection and try again.';
            } else {
                errorMessage += 'Please try again later.';
            }
            
            this.addMessage(errorMessage, 'bot');
        }
    }

    initialize() {
        this.loadStyles();
        this.createWidget();
        this.bindEvents();
        this.applyTheme();
    }

    loadStyles() {
        // Check if styles are already loaded
        if (!document.getElementById('chat-widget-styles')) {
            const link = document.createElement('link');
            link.id = 'chat-widget-styles';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.example.com/chat-widget.css'; // Replace with your actual CDN URL
            document.head.appendChild(link);
        }
    }

    applyTheme() {
        const themeStyles = document.createElement('style');
        themeStyles.textContent = `
            .chat-widget-button { background-color: ${this.options.theme.primary}; }
            .chat-widget-icon { fill: ${this.options.theme.secondary}; }
            .chat-widget-header { 
                background: ${this.options.theme.primary}; 
                color: ${this.options.theme.secondary}; 
            }
            .chat-widget-container { background: ${this.options.theme.secondary}; }
            .chat-widget-input button { 
                background: ${this.options.theme.primary}; 
                color: ${this.options.theme.secondary}; 
            }
            .chat-message-user { 
                background: ${this.options.theme.primary}; 
                color: ${this.options.theme.secondary}; 
            }
            .chat-message-bot { color: ${this.options.theme.text}; }
        `;
        document.head.appendChild(themeStyles);
    }

    createWidget() {
        this.element = document.createElement('div');
        this.element.className = 'chat-widget';
        this.element.setAttribute('data-position', this.options.position);

        const button = document.createElement('div');
        button.className = 'chat-widget-button';
        button.innerHTML = `
            <svg class="chat-widget-icon" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
        `;

        const container = document.createElement('div');
        container.className = 'chat-widget-container';
        container.innerHTML = `
            <div class="chat-widget-header">
                <h3>${this.options.title}</h3>
            </div>
            <div class="chat-widget-messages"></div>
            <div class="chat-widget-input">
                <input type="text" placeholder="${this.options.placeholder}">
                <button>Send</button>
            </div>
        `;

        this.element.appendChild(container);
        this.element.appendChild(button);
        document.body.appendChild(this.element);

        this.container = container;
        this.messagesContainer = container.querySelector('.chat-widget-messages');
        this.input = container.querySelector('input');
        this.sendButton = container.querySelector('button');

        this.addMessage(this.options.greeting, 'bot');
    }

    bindEvents() {
        this.element.querySelector('.chat-widget-button').addEventListener('click', () => {
            this.toggleChat();
        });

        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.container.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            this.input.focus();
        }
    }

    getSessionId() {
        let sessionId = localStorage.getItem('chatWidgetSessionId');
        if (!sessionId) {
            sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('chatWidgetSessionId', sessionId);
        }
        return sessionId;
    }

    addMessage(text, sender) {
        const message = document.createElement('div');
        message.className = `chat-message chat-message-${sender}`;
        message.textContent = text;
        
        this.messagesContainer.appendChild(message);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        this.messages.push({ text, sender, timestamp: new Date() });
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chat-message chat-message-bot chat-typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        this.messagesContainer.appendChild(indicator);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = this.messagesContainer.querySelector('.chat-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Create minified version
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return ChatWidget; });
} else {
    window.ChatWidget = ChatWidget;
} 