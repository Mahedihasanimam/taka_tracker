# Screen Documentation

## Tab Screens

### 1. Home (index.tsx)

**Path:** `/(tabs)/`

**Purpose:** Dashboard with financial overview

**Components:**

- Header with language toggle
- Horizontal scrollable cards (Daily/Weekly/Monthly)
- Quick action buttons
- Recent activity list
- Budget status widget

**Data Sources:**

- `getBalance()` - Total income/expense
- `getTransactions()` - Recent transactions
- `getBudgets()` - Budget data
- `getTransactionsByCategory()` - Category spending

---

### 2. Transactions (transactions.tsx)

**Path:** `/(tabs)/transactions`

**Purpose:** Full transaction history

**Features:**

- Search bar
- Type filter (All/Income/Expense)
- Date filter with presets
- Grouped list by date
- FAB for adding new
- Export modal

**Modals:**

- Date filter modal
- Export modal (CSV/PDF)
- Action modal (Edit/Delete)

---

### 3. Add Transaction (add.tsx)

**Path:** `/(tabs)/add`

**Purpose:** Create new transaction

**Flow:**

1. Enter amount
2. Select type (Income/Expense)
3. Choose category
4. Select date
5. Add note (optional)
6. Save

---

### 4. Budget (budget.tsx)

**Path:** `/(tabs)/budget`

**Purpose:** Budget management

**Features:**

- Income utilization meter
- Total budget overview
- Category budget list with progress
- Add/Edit/Delete budgets
- Suggested limits

---

### 5. Profile (profile.tsx)

**Path:** `/(tabs)/profile`

**Purpose:** User settings and account

**Sections:**

- User info card
- General settings (Edit Profile, Language)
- Security (Change Password)
- Support (Help, Privacy)
- Logout

---

## Auth Screens

### Sign In (auth/signIn.tsx)

- Phone + password login
- Forgot password link
- Sign up navigation

### Sign Up (auth/signUp.tsx)

- Name, phone, password fields
- Password confirmation
- Terms acceptance

### Forgot Password (auth/forgotPassword.tsx)

- Phone number input
- Validates phone exists

### Reset Password (auth/resetPassword.tsx)

- New password input
- Confirmation field
- Strength indicator

---

## Other Screens

### Edit Profile (profile/edit.tsx)

- Profile picture upload
- Name editing
- Phone display (read-only)

### Change Password (profile/changePassword.tsx)

- Current password
- New password with strength meter
- Confirmation

### Categories (screens/categories.tsx)

- Tab toggle (Expense/Income)
- Category list with icons
- Add/Edit/Delete categories
- Icon and color pickers
