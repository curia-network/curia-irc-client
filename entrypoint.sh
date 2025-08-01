#!/bin/sh

# Entrypoint script for The Lounge IRC client
# Handles environment variable substitution and setup

echo "Starting The Lounge IRC Client..."

# Set default environment variables
export IRC_HOST=${IRC_HOST:-"irc.curia.network"}
export IRC_PORT=${IRC_PORT:-"6697"}
export IRC_TLS=${IRC_TLS:-"true"}
export IRC_REJECT_UNAUTHORIZED=${IRC_REJECT_UNAUTHORIZED:-"true"}
export IRC_SASL=${IRC_SASL:-""}
export PORT=${PORT:-"9000"}
export LOUNGE_HOST=${LOUNGE_HOST:-"0.0.0.0"}
export THELOUNGE_THEME=${THELOUNGE_THEME:-"thelounge-theme-cg"}

echo "Configuration:"
echo "  IRC Host: $IRC_HOST"
echo "  IRC Port: $IRC_PORT"
echo "  IRC TLS: $IRC_TLS"
echo "  Lounge Port: $PORT"
echo "  Theme: $THELOUNGE_THEME"

# Ensure config directory exists and has correct permissions
mkdir -p /home/node/.thelounge/logs
mkdir -p /home/node/.thelounge/uploads

# Copy integration script to The Lounge's public directory if it exists
if [ -f /home/node/.thelounge/public/iframe-integration.js ]; then
    echo "Integration script found and ready"
fi

# Generate a custom index.html that includes our integration script
# This is a workaround since The Lounge doesn't have built-in plugin support for this
cat > /home/node/.thelounge/public/integration-loader.js << 'EOF'
// Auto-load integration script
(function() {
    if (window.location !== window.parent.location) {
        // We're in an iframe, load the integration script
        var script = document.createElement('script');
        script.src = '/iframe-integration.js';
        script.async = true;
        document.head.appendChild(script);
    }
})();
EOF

echo "Integration loader created"

# Start The Lounge with theme configuration
echo "Starting The Lounge..."
exec thelounge start -c "theme=$THELOUNGE_THEME"