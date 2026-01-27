# Quick Reference

## Common Patterns

### Using Database

```typescript
import { addTransaction, getTransactions } from "@/services/db";

// Add
await addTransaction(
  userId,
  1000,
  "expense",
  "Food",
  date,
  "Lunch",
  "Utensils",
  "#f97316",
);

// Get
const transactions = await getTransactions(userId);
```

### Using Auth

```typescript
import { useAuth } from "@/context/AuthContext";

const { user, login, logout, isAuthenticated } = useAuth();
```

### Using Translations

```typescript
import { useLanguage } from '@/context/LanguageContext';

const { t, lang, switchLanguage } = useLanguage();
<Text>{t('hello')}</Text>
```

### Navigation

```typescript
import { router } from "expo-router";

// Navigate
router.push("/transactions");
router.push({ pathname: "/transaction/edit", params: { id: 123 } });

// Go back
router.back();

// Replace
router.replace("/auth/signIn");
```

### Styling with Tailwind

```typescript
import tw from 'twrnc';

<View style={tw`flex-1 bg-white p-4`}>
  <Text style={tw`text-lg font-bold text-gray-800`}>Hello</Text>
</View>
```

## Icon Names Available

```
Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal
```

## Color Palette

```
Primary: #e2136e (bKash Pink)
Success: #10b981 (Green)
Warning: #f59e0b (Orange)
Error: #ef4444 (Red)
Info: #3b82f6 (Blue)
```

## Date Formatting

```typescript
// ISO string for database
const dateStr = new Date().toISOString();

// Display format
const displayDate = new Date(dateStr).toLocaleDateString("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
```
