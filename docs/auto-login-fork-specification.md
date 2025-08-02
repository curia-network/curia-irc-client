# The Lounge Auto-Login Fork Specification

**Goal**: Enable seamless auto-login functionality for Curia IRC integration

## **Current Implementation Status** ✅

The **ChatModal is already fully implemented** and ready. When your fork supports autologin, it will work immediately.

**Current URL being generated**:
```
http://localhost:9000?autologin&user=admin&al-password=adminpass123&autoconnect&nick=${userNick}&username=admin/commonground&realname=${userNick}&join=%23${channelName}&lockchannel&nofocus
```

## **What Your Fork Needs to Implement** 🎯

### **1. Parameter Detection**
```javascript
// Client-side JavaScript to detect autologin parameters
const urlParams = new URLSearchParams(window.location.search);
const isAutoLogin = urlParams.has('autologin');
const user = urlParams.get('user');
const password = urlParams.get('al-password');
```

### **2. Auto-Login Logic**
```javascript
if (isAutoLogin && user && password) {
  // Skip login form entirely
  // Auto-submit credentials to login endpoint
  // On success: proceed with IRC connection parameters
  // On failure: fall back to normal login form
}
```

### **3. Login Flow Override**
- **Normal flow**: Show login form → User enters credentials → Submit → IRC connection
- **Auto-login flow**: Parse URL params → Auto-submit credentials → IRC connection

### **4. Parameter Validation**
- Require both `user` and `al-password` when `autologin` is present
- Gracefully handle missing/invalid credentials
- Maintain backward compatibility with existing URL parameters

## **Integration Points** 🔧

### **Current Parameters Being Used**:
- **`autologin`** - Enable auto-login mode
- **`user=admin`** - The Lounge username 
- **`al-password=adminpass123`** - The Lounge password
- **`autoconnect`** - Auto-connect to IRC after login
- **`nick=${userNick}`** - IRC nickname (from user data)
- **`username=admin/commonground`** - IRC username with network
- **`realname=${userNick}`** - IRC real name
- **`join=%23${channelName}`** - Auto-join community channel
- **`lockchannel`** - Lock channel focus (multi-tab support)
- **`nofocus`** - Don't auto-focus input (iframe-friendly)

### **Expected User Experience**:
1. User clicks "Messages" in Curia sidebar
2. ChatModal opens with iframe URL containing autologin params
3. **The Lounge skips login form completely**
4. User is immediately connected to IRC with community channel

## **Security Considerations** 🔒

### **Current Approach** (temporary):
- Hardcoded admin credentials in URL
- Acceptable for testing and MVP

### **Future Production Approach**:
- Replace with token-based authentication
- Implement user provisioning API
- Generate unique credentials per user

## **Reference Implementation** 📚

You can reference the `lounge-autoconnect` fork:
- **Repository**: https://github.com/libertysoft3/lounge-autoconnect
- **Branch**: `v2.4.0-autoconnect`
- **Key features**: Proven autologin implementation

## **Testing the Implementation** 🧪

### **Test URL**:
```
http://localhost:9000?autologin&user=admin&al-password=adminpass123&autoconnect&nick=testuser&username=admin/commonground&realname=testuser&join=%23general&lockchannel&nofocus
```

### **Expected Behavior**:
1. **No login form shown**
2. **Immediate IRC connection**
3. **Auto-join #general channel**
4. **Ready to chat immediately**

### **Fallback Behavior** (if autologin fails):
1. **Show normal login form**
2. **Pre-fill with provided credentials**
3. **Allow manual connection**

---

## **Next Steps** 🚀

1. **✅ ChatModal Ready**: Already implemented and waiting
2. **🔄 Fork Implementation**: Your custom Lounge fork with autologin
3. **⏳ Identity Bridge**: Full user provisioning API (next phase)

**The moment your fork supports autologin, our integration will work seamlessly!**