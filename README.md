# Custom Chat Widget

A lightweight, customizable chat widget built with vanilla JavaScript and CSS. This widget provides a clean, modern interface for integrating chat functionality into any website.

## Features

- 🎨 Customizable themes and positioning
- 📱 Responsive design
- 💾 Session persistence
- ⚡ Real-time responses
- 🔌 Webhook integration
- 🌐 Cross-browser compatibility
- 🔒 Secure communication
- 🎯 Event-driven architecture

## Installation

### Direct Usage

Add the following to your HTML:

```html
<!-- In the <head> -->
<link rel="stylesheet" href="src/chat-widget.css">

<!-- Before </body> -->
<script src="src/chat-widget.js"></script>
```

### Initialize the Widget

```javascript
const chatWidget = new ChatWidget({
    position: 'bottom-right',
    theme: {
        primary: '#2196F3',
        secondary: '#ffffff',
        text: '#000000'
    },
    title: 'Chat With Us',
    greeting: 'Hello! 👋 How can I help you today?',
    placeholder: 'Type your message...',
    endpoint: 'your-webhook-url'
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('top-left', 'top-right', 'bottom-left', 'bottom-right') |
| theme | object | {...} | Theme colors for the widget |
| title | string | 'Chat Widget' | Title displayed in the widget header |
| greeting | string | 'Hello!' | Initial greeting message |
| placeholder | string | 'Type a message...' | Input field placeholder text |
| endpoint | string | null | Webhook URL |

## Events

```javascript
chatWidget.on('message_sent', (message) => {
    console.log('Message sent:', message);
});

chatWidget.on('message_received', (message) => {
    console.log('Message received:', message);
});

chatWidget.on('message_error', (error) => {
    console.error('Error:', error);
});
```

## Message Format

### Request
```json
{
    "action": "sendMessage",
    "sessionId": "unique-session-id",
    "chatInput": "user message"
}
```

### Response
```json
{
    "output": "response message"
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Development

1. Clone the repository
2. Open `examples/index.html` in your browser
3. Start a local server (e.g., `python -m http.server 8000`)
4. Make changes to `src/chat-widget.js` and `src/chat-widget.css`

## License

MIT License 