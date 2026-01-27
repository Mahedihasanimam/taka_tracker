# Authentication Flow

## Overview

TakaTrack uses a local authentication system with token-based session management.

## Flow Diagram

```
┌─────────────┐
│   App Start │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Check AsyncStorage  │
│   for auth token    │
└──────────┬──────────┘
       │
       ├── Token exists ──────────────┐
       │                              │
       ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│  Validate Token │          │  Show Login     │
│  in SQLite DB   │          │  Screen         │
└────────┬────────┘          └────────┬────────┘
       │                              │
       ├── Valid ────┐                │
       │             │                │
       ▼             │                ▼
┌──────────────┐     │       ┌─────────────────┐
│ Token Invalid│     │       │  User enters    │
│ or Expired   │     │       │  credentials    │
└──────┬───────┘     │       └────────┬────────┘
       │             │                │
       ▼             │                ▼
┌──────────────┐     │       ┌─────────────────┐
│ Clear token  │     │       │ Validate in DB  │
│ Show Login   │     │       │ Create Token    │
└──────────────┘     │       └────────┬────────┘
                     │                │
                     │                ▼
                     │       ┌─────────────────┐
                     │       │ Store token in  │
                     │       │ AsyncStorage    │
                     │       └────────┬────────┘
                     │                │
                     └────────────────┤
                                      │
                                      ▼
                             ┌─────────────────┐
                             │   Home Screen   │
                             │   (Logged In)   │
                             └─────────────────┘
```

## Key Functions

### Registration

```typescript
registerUser(name, phone, password) → { success, message, userId }
```

### Login

```typescript
loginUser(phone, password) → { success, user, token, expiresAt }
```

### Token Validation

```typescript
validateToken(token) → { valid, user }
```

### Logout

```typescript
deleteAuthToken(token) → boolean
```

## Token Lifecycle

1. **Creation**: Generated on successful login (30-day validity)
2. **Storage**: Saved in AsyncStorage for persistence
3. **Validation**: Checked on app start and API calls
4. **Expiry**: Auto-deleted when expired
5. **Deletion**: Removed on logout or password change
