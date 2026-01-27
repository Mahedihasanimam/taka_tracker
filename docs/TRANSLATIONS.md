# Translation System

## File Location

`constants/translations.ts`

## Structure

```typescript
export const translations = {
  en: {
    // English translations
    appName: "TakaTrack",
    hello: "Hello",
    // ...
  },
  bn: {
    // Bengali translations
    appName: "টাকাট্র্যাক",
    hello: "হ্যালো",
    // ...
  },
};
```

## Categories

### Common

- error, success, cancel, delete, save, update, loading

### Authentication

- signIn, signUp, login, logout, phoneLabel, passwordLabel...

### Home Screen

- today, thisWeek, thisMonth, spentToday, budget...

### Transactions

- transactions, income, expense, addTransaction...

### Categories

- manageCategories, addCategory, selectIcon, selectColor...

### Budget

- budgetTitle, createBudget, monthlyLimit, exceeded...

### Profile

- profileTitle, editProfile, changePassword, logout...

## Adding New Translations

1. Add key to `en` object:

```typescript
en: {
  newKey: 'New Text',
}
```

2. Add same key to `bn` object:

```typescript
bn: {
  newKey: 'নতুন টেক্সট',
}
```

3. Use in component:

```tsx
const { t } = useLanguage();
<Text>{t("newKey")}</Text>;
```
