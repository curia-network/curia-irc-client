# IRC User Provision Endpoint Specification

## **🎯 Endpoint Overview**

**Endpoint**: `POST /api/irc-user-provision`  
**Purpose**: Create/update IRC users in Soju bouncer for seamless chat integration  
**Authentication**: JWT Bearer token (using existing Curia auth system)  

## **📋 Research Findings**

### **✅ Authentication System Analysis**
- **JWT Secret**: Uses `process.env.JWT_SECRET`
- **Middleware**: `withAuth` from `@/lib/withAuth.ts` 
- **Pattern**: `export const POST = withAuth(handler, false);`
- **User Context**: `req.user` contains `{ sub, name, picture, adm, cid, ... }`

### **✅ Database Integration Analysis** 
- **Main DB**: Uses `query()` from `@/lib/db.ts` with PostgreSQL Pool
- **IRC DB**: Need separate connection via `IRC_DATABASE_URL` 
- **Pattern**: `await query('SELECT ...', [param1, param2])`

### **✅ Soju Database Schema Analysis**
```sql
-- User table (Primary identity)
User {
  id: SERIAL PRIMARY KEY,
  username: VARCHAR(255) UNIQUE,
  password: VARCHAR(255), -- bcrypt hash ($2a$10$...)
  admin: BOOLEAN DEFAULT false,
  nick: VARCHAR(255),
  realname: VARCHAR(255), 
  enabled: BOOLEAN DEFAULT true
}

-- Network table (IRC networks per user)
Network {
  id: SERIAL PRIMARY KEY,
  name: VARCHAR(255), -- "commonground"
  user: INTEGER REFERENCES User(id),
  addr: VARCHAR(255), -- "irc+insecure://ergo:6667"
  nick: VARCHAR(255),
  username: VARCHAR(255),
  enabled: BOOLEAN DEFAULT true
}
```

### **✅ Password Hashing Analysis**
- **Format**: bcrypt with `$2a$10$` prefix (cost factor 10)
- **Length**: 60 characters
- **Library**: Need to install `bcryptjs` in curia project
- **Current**: `admin` user has bcrypt password

## **🏗️ Implementation Specification**

### **1. Dependencies Required**
```bash
# Add to chat modal package (cleaner organization)
cd /Users/florian/Git/curia/curia-chat-modal
yarn add bcryptjs
yarn add -D @types/bcryptjs
```

### **2. Environment Variables**
Already available: `IRC_DATABASE_URL="postgresql://soju:soju_dev_password@localhost:5433/soju"`

### **3. Chat Modal Utilities**

**File**: `/Users/florian/Git/curia/curia-chat-modal/src/utils/irc-auth.ts`

```typescript
import bcrypt from 'bcryptjs';

export function generateIrcUsername(name: string, userId: string): string {
  // Clean name and add user ID suffix for uniqueness
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const userSuffix = userId.slice(-4);
  return `${cleanName}_${userSuffix}`.slice(0, 32); // IRC username limit
}

export function generateSecurePassword(): string {
  // Generate 16-character password for IRC login
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function hashIrcPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export interface IrcProvisioningUtils {
  generateIrcUsername: typeof generateIrcUsername;
  generateSecurePassword: typeof generateSecurePassword;
  hashIrcPassword: typeof hashIrcPassword;
}
```

**Export from main package**: `/Users/florian/Git/curia/curia-chat-modal/src/index.ts`

```typescript
// ... existing exports ...
export { 
  generateIrcUsername, 
  generateSecurePassword, 
  hashIrcPassword,
  type IrcProvisioningUtils 
} from './utils/irc-auth';
```

### **4. API Endpoint Structure**

**File**: `/Users/florian/Git/curia/curia/src/app/api/irc-user-provision/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { AuthenticatedRequest, withAuth } from '@/lib/withAuth';
import { query as curiaQuery } from '@/lib/db';
import { Pool } from 'pg';
// 🚀 Import IRC utilities from chat modal package
import { 
  generateIrcUsername, 
  generateSecurePassword, 
  hashIrcPassword 
} from '@curia_/curia-chat-modal';

// IRC Database Connection
const ircPool = new Pool({
  connectionString: process.env.IRC_DATABASE_URL,
  max: 5, // Smaller pool for IRC operations
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function ircQuery(text: string, values?: any[]): Promise<any> {
  const client = await ircPool.connect();
  try {
    const res = await client.query(text, values);
    return res;
  } finally {
    client.release();
  }
}

interface ProvisionRequest {
  communityId: string;
  // userId comes from JWT token
}

interface ProvisionResponse {
  success: boolean;
  ircUsername: string;
  ircPassword: string; // Generated password for The Lounge
  networkName: string;
}

async function provisionIrcUserHandler(req: AuthenticatedRequest) {
  const user = req.user;
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const body = await req.json() as ProvisionRequest;
    const { communityId } = body;

    if (!communityId) {
      return NextResponse.json(
        { error: 'communityId is required' }, 
        { status: 400 }
      );
    }

    // Generate IRC username (avoid conflicts)
    const ircUsername = generateIrcUsername(user.name || user.sub, user.sub);
    
    // Generate secure password for IRC
    const ircPassword = generateSecurePassword();
    const hashedPassword = await hashIrcPassword(ircPassword);

    // Upsert user in Soju database
    const ircUser = await upsertSojuUser({
      curiaUserId: user.sub,
      ircUsername,
      hashedPassword,
      nickname: user.name || ircUsername,
      realname: user.name || ircUsername,
      communityId
    });

    return NextResponse.json({
      success: true,
      ircUsername,
      ircPassword, // Plain password for The Lounge login
      networkName: 'commonground'
    } as ProvisionResponse);
    
  } catch (error) {
    console.error('[IRC Provision] Error:', error);
    return NextResponse.json(
      { error: 'Failed to provision IRC user' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(provisionIrcUserHandler, false);
```

### **5. Database Helper Function**

```typescript
async function upsertSojuUser({
  curiaUserId,
  ircUsername,
  hashedPassword,
  nickname,
  realname,
  communityId
}: {
  curiaUserId: string;
  ircUsername: string;
  hashedPassword: string;
  nickname: string;
  realname: string;
  communityId: string;
}) {
  // Check if user exists
  const existingUser = await ircQuery(
    'SELECT id FROM "User" WHERE username = $1',
    [ircUsername]
  );

  let userId: number;

  if (existingUser.rows.length > 0) {
    // Update existing user
    userId = existingUser.rows[0].id;
    await ircQuery(
      'UPDATE "User" SET password = $2, nick = $3, realname = $4 WHERE id = $1',
      [userId, hashedPassword, nickname, realname]
    );
  } else {
    // Create new user
    const newUser = await ircQuery(
      'INSERT INTO "User" (username, password, nick, realname, admin, enabled) VALUES ($1, $2, $3, $4, false, true) RETURNING id',
      [ircUsername, hashedPassword, nickname, realname]
    );
    userId = newUser.rows[0].id;
  }

  // Ensure network exists for user
  await ircQuery(
    `INSERT INTO "Network" (name, "user", addr, nick, username, enabled) 
     VALUES ($1, $2, $3, $4, $5, true) 
     ON CONFLICT (name, "user") DO UPDATE SET
       nick = EXCLUDED.nick,
       username = EXCLUDED.username`,
    ['commonground', userId, 'irc+insecure://ergo:6667', nickname, ircUsername]
  );

  return { userId, ircUsername };
}
```

## **🎯 Next Steps for Implementation**

### **Phase 1: Chat Modal Utilities** (20 mins)
1. **Install dependencies**: `cd curia-chat-modal && yarn add bcryptjs @types/bcryptjs`
2. **Create utilities**: `/src/utils/irc-auth.ts` with IRC helper functions
3. **Export utilities**: Add exports to `/src/index.ts` 
4. **Test utilities**: Verify functions work independently

### **Phase 2: API Endpoint Setup** (30 mins)
5. **Create endpoint file**: `/api/irc-user-provision/route.ts`
6. **Import utilities**: From `@curia_/curia-chat-modal` package
7. **Add basic structure**: Authentication + request validation
8. **Test authentication**: Verify withAuth works correctly

### **Phase 3: Database Integration** (35 mins)
9. **Add IRC database connection**: Pool setup with IRC_DATABASE_URL
10. **Add upsert logic**: User + Network table management
11. **Test database operations**: Verify user creation works
12. **Test end-to-end**: From JWT token to IRC user creation

### **Phase 4: Error Handling & Polish** (20 mins)
13. **Add comprehensive error handling**: Database errors, auth failures
14. **Add logging**: Track successful/failed provisioning
15. **Validate response format**: Ensure auth bridge can consume it
16. **Update chat modal package**: `yarn add file:../curia-chat-modal` in main curia app

## **🔒 Security Considerations**

- ✅ **Authentication**: JWT validation via withAuth
- ✅ **Password Security**: bcrypt hashing with cost factor 10
- ✅ **Connection Security**: Use connection pooling for IRC database
- ✅ **Input Validation**: Validate communityId and user context
- ✅ **Error Handling**: Don't expose internal database errors

## **📊 Success Criteria**

- [ ] **Authentication**: Only authenticated users can provision IRC accounts
- [ ] **User Creation**: Successfully creates/updates Soju users
- [ ] **Network Setup**: Automatically configures commonground network
- [ ] **Password Generation**: Secure passwords for IRC login
- [ ] **Error Handling**: Graceful failure with helpful error messages
- [ ] **Performance**: < 500ms response time for provisioning

---

**READY FOR IMPLEMENTATION** 🚀

All research complete. The endpoint specification is comprehensive and ready for development. Start with Phase 1 to establish the foundation.