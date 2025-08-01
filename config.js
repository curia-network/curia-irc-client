"use strict";

// The Lounge configuration for CommonGround IRC
// Based on o3-irc-howto.md specifications

module.exports = {
	// Public mode - enabled for bouncer auto-connect
	public: true,
	
	// Server configuration
	host: process.env.LOUNGE_HOST || "0.0.0.0",
	port: process.env.PORT || 9000,
	bind: undefined,
	
	// Reverse proxy support
	reverseProxy: true,
	
	// Theme
	theme: "default",
	
	// Default network configuration
	defaults: {
		name: "CommonGround IRC",
		host: process.env.IRC_HOST || "irc.curia.network",
		port: parseInt(process.env.IRC_PORT) || 6697,
		password: process.env.IRC_PASS || "", // Soju bouncer password
		tls: process.env.IRC_TLS !== "false",
		rejectUnauthorized: process.env.IRC_REJECT_UNAUTHORIZED !== "false",
		nick: process.env.IRC_USER || "admin", // Use consistent bouncer username  
		username: (process.env.IRC_USER || "admin") + "/commonground", // Soju bouncer with network
		realname: "CommonGround User",
		join: "#general", // Auto-join default channel
		leaveMessage: "",
		sasl: process.env.IRC_SASL || "",
		saslAccount: "",
		saslPassword: ""
	},
	
	// Lock network settings (prevent users from changing server details)
	lockNetwork: true,
	
	// Display network in UI
	displayNetwork: true,
	
	// History settings
	maxHistory: 10000,
	
	// Message storage
	messageStorage: ["sqlite", "text"],
	
	// Logging
	logs: {
		timezone: "UTC+00:00",
		dateFormat: "YYYY-MM-DD HH:mm:ss"
	},
	
	// File upload settings
	fileUpload: {
		enable: false,
		maxFileSize: 10240,
		baseUrl: null
	},
	
	// Transports for WebSocket
	transports: ["websocket", "polling"],
	
	// HTTPS settings (Railway handles TLS termination)
	https: {
		enable: false,
		key: "",
		certificate: ""
	},
	
	// Identd server
	identd: {
		enable: false,
		port: 113
	},
	
	// LDAP authentication (disabled in public mode)
	ldap: {
		enable: false,
		url: "",
		tlsOptions: {},
		primaryKey: "uid",
		searchDN: {
			rootDN: "",
			rootPassword: "",
			filter: "",
			base: "",
			scope: ""
		}
	},
	
	// Debug settings
	debug: {
		ircFramework: process.env.NODE_ENV === "development",
		raw: process.env.NODE_ENV === "development"
	},
	
	// Prefetch settings
	prefetch: true,
	prefetchStorage: false,
	prefetchMaxImageSize: 2048,
	prefetchMaxSearchSize: 50,
	prefetchTimeout: 5000,
	
	// Disable certain features in public mode
	webirc: null,
	
	// Custom CSS/JS injection for CommonGround integration
	stylesheets: [],
	
	// Override some client settings for better integration
	clientSettings: {
		awayMessage: "Away from CommonGround",
		highlights: "",
		nickChanges: true,
		notification: true,
		notificationSound: true,
		desktopNotifications: true,
		showSeconds: false,
		use12hClock: false,
		useConductor: true,
		muted: [],
		links: true,
		motd: true,
		join: true,
		part: true,
		quit: true,
		nick: true,
		mode: true,
		topic: true,
		whois: true,
		searchEnabled: true,
		autocomplete: true,
		coloredNicks: true,
		desktopNotifications: true,
		uploadThumbnails: true
	}
};