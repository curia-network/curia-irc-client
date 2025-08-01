// CommonGround iframe integration script for The Lounge
// Handles postMessage communication with parent window for seamless authentication

(function() {
    'use strict';
    
    // Only run in iframe context
    if (window.self === window.top) {
        return;
    }
    
    console.log('CommonGround IRC integration loaded');
    
    // Listen for authentication messages from parent
    window.addEventListener('message', function(event) {
        // Verify origin (adjust for your domain)
        const allowedOrigins = [
            'https://curia.network',
            'https://www.curia.network',
            'http://localhost:3000', // For development
            'http://localhost:3001'  // For development
        ];
        
        if (!allowedOrigins.includes(event.origin)) {
            console.warn('Ignored message from unauthorized origin:', event.origin);
            return;
        }
        
        const data = event.data;
        console.log('Received message from parent:', data);
        
        if (data && data.type === 'irc-login') {
            handleIrcLogin(data);
        } else if (data && data.type === 'irc-theme') {
            handleThemeChange(data);
        }
    });
    
    // Handle IRC login from parent window
    function handleIrcLogin(data) {
        const { nick, password, realname, channels } = data;
        
        console.log('Attempting IRC login for user:', nick);
        
        // Wait for the connect form to be available
        const waitForForm = setInterval(function() {
            const nickInput = document.querySelector('input[name="nick"]');
            const passwordInput = document.querySelector('input[name="password"]');
            const realnameInput = document.querySelector('input[name="realname"]');
            const connectForm = document.querySelector('form.connect');
            
            if (nickInput && passwordInput && connectForm) {
                clearInterval(waitForForm);
                
                // Fill in the form
                if (nick) {
                    nickInput.value = nick;
                }
                
                if (password) {
                    passwordInput.value = password;
                }
                
                if (realname && realnameInput) {
                    realnameInput.value = realname;
                }
                
                // Auto-submit the form
                setTimeout(function() {
                    console.log('Submitting IRC connection form');
                    connectForm.submit();
                }, 100);
            }
        }, 100);
        
        // Clear the interval after 10 seconds to avoid infinite loop
        setTimeout(function() {
            clearInterval(waitForForm);
        }, 10000);
    }
    
    // Handle theme changes from parent
    function handleThemeChange(data) {
        const { theme } = data;
        if (theme) {
            console.log('Applying theme:', theme);
            // Implementation depends on The Lounge's theme system
            // This is a placeholder for theme switching logic
        }
    }
    
    // Notify parent when IRC connection state changes
    function notifyParent(eventType, data) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'irc-event',
                eventType: eventType,
                data: data
            }, '*'); // Parent should validate origin
        }
    }
    
    // Monitor connection status and notify parent
    function setupConnectionMonitoring() {
        // Monitor for connection events
        const originalLog = console.log;
        console.log = function() {
            const message = Array.prototype.slice.call(arguments).join(' ');
            
            // Look for connection-related messages
            if (message.includes('Connected to')) {
                notifyParent('connected', { message: message });
            } else if (message.includes('Disconnected from')) {
                notifyParent('disconnected', { message: message });
            } else if (message.includes('Joined channel')) {
                notifyParent('joined', { message: message });
            }
            
            // Call original console.log
            originalLog.apply(console, arguments);
        };
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupConnectionMonitoring();
        });
    } else {
        setupConnectionMonitoring();
    }
    
    // Send ready signal to parent
    setTimeout(function() {
        notifyParent('ready', { 
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    }, 1000);
    
})();