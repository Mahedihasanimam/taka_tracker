# Context Providers Documentation

## AuthContext

**File:** `context/AuthContext.tsx`

**Purpose:** Manages user authentication state globally.

### State

```typescript
interface AuthContextType {
  user: User | null; // Current logged-in user
  isAuthenticated: boolean; // Auth status
  isLoading: boolean; // Loading state
  login: (phone, password) => Promise<{ success; message }>;
  register: (name, phone, password) => Promise<{ success; message }>;
  logout: () => Promise<void>;
  updateUser: (user) => Promise<void>;
}
```

### Usage

```tsx
import { useAuth } from "@/context/AuthContext";

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use auth state and functions
};
```

### Flow

1. On mount: Check AsyncStorage for token
2. If token exists: Validate with `validateToken()`
3. If valid: Set user state, `isAuthenticated = true`
4. If invalid: Clear token, `isAuthenticated = false`

---

## LanguageContext

**File:** `context/LanguageContext.tsx`

**Purpose:** Manages app language and translations.

### State

```typescript
interface LanguageContextType {
  lang: "en" | "bn"; // Current language
  switchLanguage: (lang) => void; // Change language
  t: (key: string) => string; // Translation function
}
```

### Usage

```tsx
import { useLanguage } from '@/context/LanguageContext';

const MyComponent = () => {
  const { t, lang, switchLanguage } = useLanguage();

  return (
    <Text>{t('hello')}</Text>
    <Button onPress={() => switchLanguage('bn')} />
  );
};
```

### Persistence

- Language preference saved to AsyncStorage
- Loaded on app start
- Persists across sessions
