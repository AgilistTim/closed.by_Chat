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
        statusIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${isConnected ? '#4CAF50' : '#f44336'};
        `;
        
        const header = this.element.querySelector('.chat-widget-header');
        const existingStatus = header.querySelector('.chat-connection-status');
        if (existingStatus) {
            header.removeChild(existingStatus);
        }
        header.appendChild(statusIndicator);
    }

    // Message sending
    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Add message to chat
        this.addMessage(text, 'user');
        
        // Clear input
        this.input.value = '';

        // Show typing indicator
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

            // Remove typing indicator
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
        // Create and inject CSS
        this.injectStyles();
        
        // Create DOM elements
        this.createWidget();
        
        // Bind events
        this.bindEvents();
    }

    injectStyles() {
        const styles = `
            .chat-widget {
                position: fixed;
                ${this.options.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                z-index: 999999;
            }

            .chat-widget-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: ${this.options.theme.primary};
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
            }

            .chat-widget-button:hover {
                transform: scale(1.1);
            }

            .chat-widget-icon {
                width: 30px;
                height: 30px;
                fill: ${this.options.theme.secondary};
            }

            .chat-widget-container {
                position: absolute;
                ${this.options.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
                ${this.options.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                width: 350px;
                height: 500px;
                background: ${this.options.theme.secondary};
                border-radius: 12px;
                box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
                display: none;
                flex-direction: column;
                overflow: hidden;
            }

            .chat-widget-header {
                padding: 20px;
                background: ${this.options.theme.primary};
                color: ${this.options.theme.secondary};
            }

            .chat-widget-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .chat-widget-input {
                padding: 20px;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
            }

            .chat-widget-input input {
                flex: 1;
                padding: 10px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 20px;
                margin-right: 10px;
                outline: none;
            }

            .chat-widget-input button {
                padding: 10px 20px;
                background: ${this.options.theme.primary};
                color: ${this.options.theme.secondary};
                border: none;
                border-radius: 20px;
                cursor: pointer;
            }

            .chat-message {
                margin: 10px 0;
                padding: 10px 15px;
                border-radius: 15px;
                max-width: 80%;
                word-wrap: break-word;
            }

            .chat-message-user {
                background: ${this.options.theme.primary};
                color: ${this.options.theme.secondary};
                margin-left: auto;
            }

            .chat-message-bot {
                background: #f0f0f0;
                color: ${this.options.theme.text};
            }

            .chat-connection-status {
                transition: background-color 0.3s ease;
            }
            .chat-connection-status.connected {
                box-shadow: 0 0 4px #4CAF50;
            }
            .chat-connection-status.disconnected {
                box-shadow: 0 0 4px #f44336;
            }

            .chat-typing-indicator {
                background: #f0f0f0 !important;
                padding: 15px !important;
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }

            .chat-typing-indicator span {
                height: 8px;
                width: 8px;
                background: #90949c;
                display: block;
                border-radius: 50%;
                opacity: 0.4;
                margin: 0 2px;
                animation: typing 1s infinite ease-in-out;
            }

            .chat-typing-indicator span:nth-child(1) { animation-delay: 200ms; }
            .chat-typing-indicator span:nth-child(2) { animation-delay: 300ms; }
            .chat-typing-indicator span:nth-child(3) { animation-delay: 400ms; }

            @keyframes typing {
                0% { transform: translateY(0px); }
                28% { transform: translateY(-6px); }
                44% { transform: translateY(0px); }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    createWidget() {
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'chat-widget';

        // Create chat button
        const button = document.createElement('div');
        button.className = 'chat-widget-button';
        button.innerHTML = `
            <svg class="chat-widget-icon" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
        `;

        // Create chat container
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

        // Store references to DOM elements
        this.container = container;
        this.messagesContainer = container.querySelector('.chat-widget-messages');
        this.input = container.querySelector('input');
        this.sendButton = container.querySelector('button');

        // Add initial greeting
        this.addMessage(this.options.greeting, 'bot');
    }

    bindEvents() {
        // Toggle chat on button click
        this.element.querySelector('.chat-widget-button').addEventListener('click', () => {
            this.toggleChat();
        });

        // Send message on button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on enter key
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
        // Get existing session ID or create new one
        let sessionId = localStorage.getItem('chatWidgetSessionId');
        if (!sessionId) {
            // Generate a UUID v4-like session ID
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

    // Add typing indicator
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

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return ChatWidget; });
} else {
    window.ChatWidget = ChatWidget;
} 