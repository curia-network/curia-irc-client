# Identity Bridge Integration Points - REVISED ARCHITECTURE

**Goal**: Document exact integration points for implementing IRC user provisioning in the identity bridge system.

## **🚨 ARCHITECTURE REVISION**

### **❌ Original Plan (Host-Service Integration)**
- **Problem**: CORS/CSP issues on embedded sites with strict security policies
- **Risk**: API calls from iframe context would be blocked by many sites
- **Complexity**: Need to work around security restrictions in embedded environment

### **✅ RECOMMENDED APPROACH (Curia Backend Integration)**
- **Solution**: Move IRC user provisioning to main Curia backend
- **Benefits**: 
  - No CORS issues (server-to-server communication)
  - Curia backend already has user context and authentication
  - Direct database connection to IRC postgres
  - Cleaner separation of concerns

## **🎯 REVISED INTEGRATION POINTS**

### **Primary Integration Location**: 
**File**: `/Users/florian/Git/curia/curia/src/components/SidebarActionListener.tsx`  
**Trigger**: When `sidebar_action: 'messages'` postMessage is received  
**Implementation**: Add IRC user provisioning BEFORE opening chat modal

### **Current Flow**:
```
User clicks Messages (host-service) → postMessage → SidebarActionListener → Chat Modal Opens
```

### **Enhanced Flow**:
```
User clicks Messages (host-service) → postMessage → SidebarActionListener → 
Chat Modal Opens with Auth Bridge Page → Provisioning + Loading UI → 
Redirect to The Lounge with credentials
```

## **🏗️ AUTH BRIDGE APPROACH - SUPERIOR IMPLEMENTATION**

### **🎯 Core Concept**: Custom Auth Bridge Page
Instead of blocking the modal opening, create a dedicated auth bridge page that handles provisioning with proper loading states.

### **Implementation Architecture**:

```
Chat Modal Opens → /irc-auth-bridge → Provisioning + UI → Redirect to The Lounge
```

### **1. Update ChatModal URL**:
**File**: `/Users/florian/Git/curia/curia-chat-modal/src/components/ChatModal.tsx`

```typescript
const getChatUrl = () => {
  const baseUrl = chatBaseUrl || 'https://chat.curia.network';
  const communityParam = `community=${encodeURIComponent(community.id)}`;
  const userParam = `user=${encodeURIComponent(user.id)}`;
  
  // 🚀 NEW: Point to auth bridge instead of direct Lounge URL
  return `${curiaBaseUrl}/irc-auth-bridge?${communityParam}&${userParam}`;
};
```

### **2. Auth Bridge Page**:
**File**: `/Users/florian/Git/curia/curia/src/app/irc-auth-bridge/page.tsx`

```typescript
'use client';

export default function IrcAuthBridge({ searchParams }: { searchParams: { community: string, user: string } }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Setting up your IRC account...');
  
  useEffect(() => {
    const provisionAndRedirect = async () => {
      try {
        setMessage('Creating your IRC account...');
        
        const response = await fetch('/api/irc-user-provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            communityId: searchParams.community,
            userId: searchParams.user 
          })
        });
        
        if (!response.ok) throw new Error('Provisioning failed');
        
        const { ircUsername, ircPassword } = await response.json();
        
        setMessage('Connecting to IRC...');
        setStatus('success');
        
        // 🚀 Redirect to The Lounge with credentials
        const loungeUrl = buildLoungeUrl(ircUsername, ircPassword, searchParams.community);
        window.location.href = loungeUrl;
        
      } catch (error) {
        setStatus('error');
        setMessage('Failed to set up IRC account. Please try again.');
      }
    };
    
    provisionAndRedirect();
  }, []);
  
  return (
    <div className="auth-bridge-container">
      {status === 'loading' && <LoadingSpinner message={message} />}
      {status === 'error' && <ErrorDisplay message={message} onRetry={() => window.location.reload()} />}
      {status === 'success' && <SuccessMessage message="Redirecting to chat..." />}
    </div>
  );
}

function buildLoungeUrl(ircUsername: string, ircPassword: string, communityId: string): string {
  const baseUrl = 'http://localhost:9000'; // or https://chat.curia.network in prod
  const channelName = communityId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  return `${baseUrl}?autologin&user=${ircUsername}&al-password=${ircPassword}&autoconnect&nick=${ircUsername}&username=${ircUsername}/commonground&realname=${ircUsername}&join=%23${channelName}&lockchannel&nofocus`;
}
```

### **3. Loading/Error Components**:
**File**: `/Users/florian/Git/curia/curia/src/components/irc-auth/LoadingSpinner.tsx`

```typescript
export function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <h2 className="text-xl font-semibold mb-2">Setting up IRC Chat</h2>
      <p className="text-slate-300">{message}</p>
      <div className="mt-6 text-sm text-slate-400">
        This usually takes just a few seconds...
      </div>
    </div>
  );
}

export function ErrorDisplay({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold mb-2 text-red-400">Setup Failed</h2>
      <p className="text-slate-300 mb-6 text-center max-w-md">{message}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-green-500 text-6xl mb-4">✅</div>
      <h2 className="text-xl font-semibold mb-2 text-green-400">Ready!</h2>
      <p className="text-slate-300">{message}</p>
    </div>
  );
}
```

## **🎉 AUTH BRIDGE APPROACH BENEFITS**

### **✅ Superior User Experience**:
- **Immediate Response**: Modal opens instantly, no waiting
- **Progressive Feedback**: Clear status messages during each step
- **Error Recovery**: Retry button for failed provisioning
- **Professional Polish**: Loading states match your app's design

### **✅ Technical Advantages**:
- **No Blocking**: SidebarActionListener stays simple and fast
- **Security**: Credentials never in initial URL, only after successful auth
- **Flexibility**: Can add welcome messages, user onboarding, tutorials
- **Debugging**: Easy to see exactly where provisioning fails
- **Caching**: Could cache credentials for repeat visits

### **✅ Implementation Benefits**:
- **Separation of Concerns**: Auth logic isolated in dedicated page
- **Reusable Components**: Loading/error components useful elsewhere
- **Clean Architecture**: Each piece has single responsibility
- **Easy Testing**: Can test auth bridge independently

## **🚀 IMPLEMENTATION STEPS**

### **Phase 1: Auth Bridge Foundation** (1-2 hours)
1. **Create auth bridge page**: `/irc-auth-bridge/page.tsx`
2. **Create UI components**: LoadingSpinner, ErrorDisplay, SuccessMessage
3. **Add URL building helper**: `buildLoungeUrl()` function
4. **Test standalone page**: Verify it loads and shows UI correctly

### **Phase 2: Backend Integration** (1-2 hours)  
1. **Implement API endpoint**: `/api/irc-user-provision/route.ts`
2. **Add IRC database helpers**: Connection and user creation logic
3. **Test API independently**: Verify user creation works via curl/Postman
4. **Add authentication**: Ensure only valid sessions can provision users

### **Phase 3: Frontend Integration** (30 minutes)
1. **Update ChatModal URL**: Point to auth bridge instead of direct Lounge
2. **Add environment variables**: `NEXT_PUBLIC_CURIA_BASE_URL` for URL building
3. **Test end-to-end flow**: User clicks → sees loading → redirects to chat
4. **Polish loading messages**: Make them community-specific if desired

### **Phase 4: Production Hardening** (1 hour)
1. **Error handling**: Comprehensive error messages and recovery
2. **Rate limiting**: Prevent abuse of provisioning endpoint  
3. **Logging**: Track provisioning success/failure rates
4. **Performance**: Optimize database queries and connection pooling

## **🎯 READY FOR IMPLEMENTATION**

This auth bridge approach is **significantly better** than the original plan. It provides:

- **Better UX** with immediate feedback and clear status
- **Cleaner architecture** with proper separation of concerns  
- **Enhanced security** with credential protection
- **Easier debugging** and error handling
- **Future extensibility** for onboarding and features

**The implementation is straightforward and all pieces are well-defined. Ready to build when you are!** 🚀

### **Remaining Backend API Endpoint**:
**File**: `/Users/florian/Git/curia/curia/src/app/api/irc-user-provision/route.ts`

export async function POST(request: NextRequest) {
  try {
    // 1. Validate user session
    const session = await getCurrentUser(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communityId } = await request.json();

    // 2. Connect to IRC postgres database
    const ircPassword = generateSecurePassword();
    const ircUsername = generateIrcUsername(session.name, session.id);

    // 3. Upsert user in Soju database
    const ircUser = await upsertSojuUser({
      curiaUserId: session.id,
      ircUsername,
      ircPassword,
      nickname: session.name,
      realname: session.name,
      communityId
    });

    // 4. Return credentials for auto-login
    return Response.json({
      success: true,
      ircUsername,
      ircPassword,
      networkName: 'commonground'
    });
    
  } catch (error) {
    console.error('IRC user provisioning failed:', error);
    return Response.json({ error: 'Provisioning failed' }, { status: 500 });
  }
}
```

### **Database Connection Setup**:
**Environment Variable**: Add to `/Users/florian/Git/curia/curia/.env`
```bash
# IRC Database Connection
IRC_DATABASE_URL="postgresql://soju:password@localhost:5432/soju"
```

### **Database Helper Functions**:
**File**: `/Users/florian/Git/curia/curia/src/lib/irc-db.ts`

```typescript
import { Client } from 'pg';

const ircDb = new Client({
  connectionString: process.env.IRC_DATABASE_URL
});

export async function upsertSojuUser({
  curiaUserId,
  ircUsername,
  ircPassword,
  nickname,
  realname,
  communityId
}: {
  curiaUserId: string;
  ircUsername: string;
  ircPassword: string;
  nickname: string;
  realname: string;
  communityId: string;
}) {
  await ircDb.connect();
  
  try {
    // Check if user exists
    const existingUser = await ircDb.query(
      'SELECT id FROM "User" WHERE username = $1',
      [ircUsername]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      await ircDb.query(
        'UPDATE "User" SET password = $2, nick = $3, realname = $4 WHERE username = $1',
        [ircUsername, ircPassword, nickname, realname]
      );
      return existingUser.rows[0];
    } else {
      // Create new user
      const newUser = await ircDb.query(
        'INSERT INTO "User" (username, password, nick, realname, admin, enabled) VALUES ($1, $2, $3, $4, false, true) RETURNING id',
        [ircUsername, ircPassword, nickname, realname]
      );
      
      // Ensure network exists for user
      await ircDb.query(
        'INSERT INTO "Network" (name, "user", addr, nick, username, enabled) VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT DO NOTHING',
        ['commonground', newUser.rows[0].id, 'irc+insecure://ergo:6667', nickname, ircUsername]
      );
      
      return newUser.rows[0];
    }
  } finally {
    await ircDb.end();
  }
}
```

## **🎯 DISCOVERED INTEGRATION POINT**

### **Primary Integration Location**: 
**File**: `/Users/florian/Git/curia/host-service/src/lib/embed/components/sidebar/CommunitySidebar.ts`  
**Method**: `handleNavItemClick()` - Line 544  
**Specific Case**: `'messages'` case - Line 558  

### **Current Implementation Flow**:
```typescript
private async handleNavItemClick(iconName: 'search' | 'messages' | 'notifications', label: string): Promise<void> {
  // ... validation code ...
  
  switch (iconName) {
    case 'messages':
      this.messageRouter.sendSidebarAction('messages');  // 🎯 INTEGRATION POINT
      break;
    // ... other cases ...
  }
}
```

### **Required Implementation**:
```typescript
case 'messages':
  // 🚀 NEW: IRC User Provisioning API Call
  try {
    await this.provisionIrcUser();
    this.messageRouter.sendSidebarAction('messages');
  } catch (error) {
    console.error('[CommunitySidebar] IRC user provisioning failed:', error);
    // Optionally show error to user or fallback behavior
  }
  break;
```

## **🔄 COMPLETE USER FLOW**

### **Current Flow**:
1. **User clicks Messages icon** in host-service sidebar
2. **`createNavItem()`** handles click via event listener (line 534-536)
3. **`handleNavItemClick('messages')`** is called (line 558)
4. **`sendSidebarAction('messages')`** sends postMessage to parent window
5. **`SidebarActionListener`** in curia app receives message (line 55-68)
6. **Chat modal opens** via `openChat()` call

### **Required Enhanced Flow**:
1. **User clicks Messages icon** in host-service sidebar
2. **`createNavItem()`** handles click via event listener
3. **`handleNavItemClick('messages')`** is called
4. **🆕 IRC User Provisioning API Call** - Call private service to create/verify IRC user
5. **🆕 Wait for API response** - Get IRC credentials or confirmation
6. **`sendSidebarAction('messages')`** sends postMessage with IRC user data
7. **`SidebarActionListener`** receives message with provisioning status
8. **Chat modal opens** with auto-login URL containing IRC credentials

## **🏗️ IMPLEMENTATION ARCHITECTURE**

### **Private Network API Service**

**Service Location**: Railway private network (not publicly accessible)  
**Authentication**: API key or JWT-based service-to-service auth  
**Database Access**: Direct connection to Soju PostgreSQL database  

### **API Endpoint Design**:
```typescript
// Internal API - only accessible from host-service backend
POST /internal/irc-user-provision
Authorization: Bearer <service-token>
Content-Type: application/json

{
  "curiaUserId": "user123",
  "curiaUserName": "john_doe", 
  "communityId": "community456",
  "sessionToken": "session_token_here"
}

Response:
{
  "success": true,
  "ircUsername": "john_doe_1234",
  "ircPassword": "secure-generated-password",
  "networkName": "commonground",
  "expiresAt": "2025-08-02T12:00:00Z"
}
```

### **Host Service Integration**:
```typescript
// In CommunitySidebar.ts
private async provisionIrcUser(): Promise<IrcCredentials> {
  const activeSession = sessionManager.getActiveSession();
  if (!activeSession) {
    throw new Error('No active session for IRC provisioning');
  }

  const response = await fetch('/api/irc-user-provision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeSession.sessionToken}`
    },
    body: JSON.stringify({
      curiaUserId: activeSession.userId,
      curiaUserName: activeSession.userName,
      communityId: this.currentCommunityId
    })
  });

  if (!response.ok) {
    throw new Error(`IRC provisioning failed: ${response.status}`);
  }

  return await response.json();
}
```

### **Backend API Handler**:
**File**: `/Users/florian/Git/curia/host-service/src/app/api/irc-user-provision/route.ts`  

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Validate user session
    const sessionToken = extractBearerToken(request);
    const user = await validateSession(sessionToken);
    
    // 2. Call private identity bridge service
    const response = await fetch(`${PRIVATE_IDENTITY_SERVICE_URL}/internal/irc-user-provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
      },
      body: JSON.stringify({
        curiaUserId: user.id,
        curiaUserName: user.name,
        communityId: request.body.communityId,
        sessionToken
      })
    });

    // 3. Return IRC credentials
    const ircCredentials = await response.json();
    return Response.json(ircCredentials);
    
  } catch (error) {
    return Response.json({ error: 'IRC provisioning failed' }, { status: 500 });
  }
}
```

## **🛡️ SECURITY CONSIDERATIONS**

### **Network Security**:
- ✅ **Identity Bridge Service**: Railway private network only
- ✅ **Service-to-Service Auth**: Internal API keys/JWT
- ✅ **User Session Validation**: Required for all requests
- ✅ **No Public Exposure**: IRC credentials never exposed publicly

### **User Authentication**:
- ✅ **Session Validation**: Only authenticated users can provision IRC accounts
- ✅ **User Context**: Tied to real Curia user accounts
- ✅ **Audit Trails**: Log all IRC user creation events

### **Credential Management**:
- ✅ **Temporary Credentials**: Optional expiration times
- ✅ **Secure Generation**: Strong password generation
- ✅ **Encrypted Storage**: Hash passwords in database
- ✅ **Cleanup Process**: Remove unused IRC accounts

## **📋 IMPLEMENTATION CHECKLIST**

### **Phase 1: Infrastructure Setup**
- [ ] Create private identity bridge service on Railway
- [ ] Set up Soju database connection in private service
- [ ] Implement user provisioning logic
- [ ] Add service-to-service authentication

### **Phase 2: Host Service Integration** 
- [ ] Add `/api/irc-user-provision` endpoint to host-service
- [ ] Implement `provisionIrcUser()` method in `CommunitySidebar.ts`
- [ ] Update `handleNavItemClick('messages')` to call provisioning
- [ ] Add error handling and fallback behavior

### **Phase 3: Frontend Integration**
- [ ] Update `SidebarActionListener` to handle IRC credentials
- [ ] Modify ChatModal URL generation to use provisioned credentials
- [ ] Test end-to-end user flow
- [ ] Add loading states and error handling

### **Phase 4: Production Hardening**
- [ ] Add rate limiting and abuse prevention
- [ ] Implement credential expiration and cleanup
- [ ] Add comprehensive audit logging
- [ ] Performance testing and monitoring

## **🎯 SUCCESS CRITERIA**

### **User Experience**:
- ✅ **One-Click Access**: User clicks Messages → Immediately connects to IRC
- ✅ **No Manual Setup**: Automatic user creation and authentication
- ✅ **Consistent Identity**: Same username in Curia and IRC
- ✅ **Error Recovery**: Graceful handling of provisioning failures

### **Technical Metrics**:
- ✅ **API Response Time**: < 500ms for user provisioning
- ✅ **Success Rate**: > 99% successful provisioning
- ✅ **Security**: Zero credential exposure, proper authentication
- ✅ **Scalability**: Handle concurrent user provisioning

---

**READY FOR IMPLEMENTATION**: All integration points identified and documented. The core implementation requires modifying the `handleNavItemClick` method in `CommunitySidebar.ts` to call the provisioning API before opening the chat modal.