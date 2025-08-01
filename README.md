# Curia IRC Web Client (The Lounge)

Modern web-based IRC client for the CommonGround chat system. Provides a browser-based interface that connects to the Soju bouncer for seamless IRC access.

## Features

- **Public Mode**: No login required - authentication handled by parent application
- **Network Locked**: Pre-configured to connect only to CommonGround IRC network
- **WebSocket Support**: Real-time messaging through WebSocket connections
- **Message History**: Local message storage and history
- **Mobile Responsive**: Works on desktop and mobile browsers
- **iframe Integration**: Designed to be embedded in CommonGround application
- **Auto-join**: Automatically joins #general channel on connection

## Environment Variables

### IRC Connection
- `IRC_HOST`: IRC server hostname (default: "irc.curia.network")
- `IRC_PORT`: IRC server port (default: "6697")
- `IRC_TLS`: Enable TLS encryption (default: "true")
- `IRC_REJECT_UNAUTHORIZED`: Reject self-signed certificates (default: "true")
- `IRC_SASL`: SASL authentication mechanism (optional)

### Server Configuration
- `PORT`: HTTP server port (default: "9000", Railway will override)
- `LOUNGE_HOST`: Bind address (default: "0.0.0.0")

## Ports

- `9000`: HTTP server (Railway will map to port 80/443 with TLS)

## Local Development

```bash
# Build the image
docker build -t curia-lounge .

# Run with environment variables
docker run -p 9000:9000 \
  -e IRC_HOST=localhost \
  -e IRC_PORT=6697 \
  -e IRC_TLS=false \
  curia-lounge
```

Access the web interface at: http://localhost:9000

## Production Deployment (Railway)

1. Create a new Railway service from this repository
2. Set environment variables in Railway dashboard (optional, defaults should work)
3. Railway will automatically provide HTTPS via their domain
4. Access via: https://your-service.up.railway.app

## iframe Integration

This client is designed to be embedded in the Curia web application:

```html
<iframe 
  id="ircFrame" 
  src="https://embed.curia.network" 
  width="100%" 
  height="600"
  allow="microphone; camera">
</iframe>

<script>
// Auto-login user via postMessage
const iframe = document.getElementById('ircFrame');
iframe.onload = function() {
  iframe.contentWindow.postMessage({
    type: 'irc-login',
    nick: 'username',
    password: 'user-password-or-token',
    realname: 'User Full Name'
  }, 'https://embed.curia.network');
};
</script>
```

## Authentication Flow

1. Parent application embeds The Lounge in an iframe
2. Parent sends user credentials via `postMessage`
3. The Lounge auto-fills connection form and connects to Soju
4. Soju authenticates user against CommonGround system
5. User is connected to IRC and can start chatting

## Message Types

### Parent → iframe (The Lounge)
```javascript
{
  type: 'irc-login',
  nick: 'username',
  password: 'password-or-token',
  realname: 'Full Name',
  channels: ['#general', '#random']  // Optional
}

{
  type: 'irc-theme',
  theme: 'dark'  // Optional theme switching
}
```

### iframe → Parent (Events)
```javascript
{
  type: 'irc-event',
  eventType: 'connected|disconnected|joined|error',
  data: { message: 'Status message' }
}

{
  type: 'irc-event',
  eventType: 'ready',
  data: { url: 'current-url', userAgent: 'browser-info' }
}
```

## Security

- **Origin Validation**: Integration script validates parent origin
- **Network Locked**: Users cannot change IRC server settings
- **Public Mode**: No user accounts stored locally
- **TLS Required**: All connections encrypted in production

## Customization

### Custom CSS
Add custom stylesheets by mounting them in the public directory:

```dockerfile
COPY custom-styles.css /home/thelounge/.thelounge/public/
```

### Additional Scripts
The integration system supports loading additional JavaScript:

```dockerfile
COPY custom-script.js /home/thelounge/.thelounge/public/
```

## Troubleshooting

### Connection Issues
1. Check `IRC_HOST` and `IRC_PORT` environment variables
2. Verify Soju bouncer is running and accessible
3. Check TLS certificate validity if `IRC_REJECT_UNAUTHORIZED=true`

### iframe Integration Issues
1. Verify parent origin is allowed in `iframe-integration.js`
2. Check browser console for postMessage errors
3. Ensure iframe has proper permissions

### Development vs Production
- Development: Use `IRC_TLS=false` and `IRC_REJECT_UNAUTHORIZED=false`
- Production: Use `IRC_TLS=true` and valid TLS certificates

## Integration with Curia

This client works as part of the full IRC stack:
- **curia-ircd-ergo**: IRC server backend
- **curia-irc-bouncer**: Soju bouncer for persistence
- **curia / host service**: User authentication and management

The client receives user credentials from the parent Curia application and connects through the Soju bouncer, which handles authentication and message persistence.