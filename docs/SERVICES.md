# Services Documentation

## Database Service (services/db.ts)

The main service handling all database operations.

### Initialization

```typescript
initDB(): Promise<boolean>
```

- Creates database file
- Creates all tables
- Runs migrations
- Called on app start

### User Operations

| Function             | Parameters            | Returns                      | Description               |
| -------------------- | --------------------- | ---------------------------- | ------------------------- |
| `registerUser`       | name, phone, password | `{success, message, userId}` | Create new user           |
| `loginUser`          | phone, password       | `{success, user, token}`     | Authenticate user         |
| `getUserById`        | id                    | `User \| null`               | Get user by ID            |
| `updateUserProfile`  | userId, name          | `{success, user}`            | Update user name          |
| `changeUserPassword` | userId, current, new  | `{success, message}`         | Change password           |
| `resetPassword`      | phone, newPassword    | `{success, message}`         | Reset password            |
| `checkPhoneExists`   | phone                 | `boolean`                    | Check if phone registered |

### Token Operations

| Function          | Parameters | Returns              | Description           |
| ----------------- | ---------- | -------------------- | --------------------- |
| `createAuthToken` | userId     | `{token, expiresAt}` | Generate auth token   |
| `validateToken`   | token      | `{valid, user}`      | Validate token        |
| `deleteAuthToken` | token      | `boolean`            | Remove token (logout) |

### Transaction Operations

| Function                    | Parameters                                              | Returns                       | Description          |
| --------------------------- | ------------------------------------------------------- | ----------------------------- | -------------------- |
| `addTransaction`            | userId, amount, type, category, date, note, icon, color | `SQLite.Result`               | Create transaction   |
| `getTransactions`           | userId?                                                 | `Transaction[]`               | Get all transactions |
| `updateTransaction`         | id, ...fields                                           | `SQLite.Result`               | Update transaction   |
| `deleteTransaction`         | id                                                      | `SQLite.Result`               | Delete transaction   |
| `getBalance`                | userId?                                                 | `{totalIncome, totalExpense}` | Get totals           |
| `getTransactionsByCategory` | category, type, userId?                                 | `number`                      | Get category total   |

### Category Operations

| Function         | Parameters                      | Returns         | Description     |
| ---------------- | ------------------------------- | --------------- | --------------- |
| `addCategory`    | userId, name, type, icon, color | `SQLite.Result` | Create category |
| `getCategories`  | type?, userId?                  | `Category[]`    | Get categories  |
| `updateCategory` | id, name, type, icon, color     | `SQLite.Result` | Update category |
| `deleteCategory` | id                              | `SQLite.Result` | Delete category |

### Budget Operations

| Function       | Parameters                    | Returns         | Description     |
| -------------- | ----------------------------- | --------------- | --------------- |
| `addBudget`    | userId, category, limitAmount | `SQLite.Result` | Create budget   |
| `getBudgets`   | userId?                       | `Budget[]`      | Get all budgets |
| `updateBudget` | id, limitAmount               | `SQLite.Result` | Update limit    |
| `deleteBudget` | id                            | `SQLite.Result` | Delete budget   |
