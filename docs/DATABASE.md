# Database Schema

TakaTrack uses SQLite for local data storage. Below are the table structures:

## Tables

### 1. users

Stores user account information.

| Column     | Type    | Constraints               | Description          |
| ---------- | ------- | ------------------------- | -------------------- |
| id         | INTEGER | PRIMARY KEY               | Auto-increment ID    |
| name       | TEXT    | NOT NULL                  | User's full name     |
| phone      | TEXT    | NOT NULL, UNIQUE          | Phone number (login) |
| password   | TEXT    | NOT NULL                  | User password        |
| created_at | TEXT    | DEFAULT CURRENT_TIMESTAMP | Registration date    |

### 2. auth_tokens

Manages user authentication sessions.

| Column     | Type    | Constraints               | Description         |
| ---------- | ------- | ------------------------- | ------------------- |
| id         | INTEGER | PRIMARY KEY               | Auto-increment ID   |
| user_id    | INTEGER | NOT NULL, FK              | Reference to users  |
| token      | TEXT    | NOT NULL, UNIQUE          | Auth token string   |
| created_at | TEXT    | DEFAULT CURRENT_TIMESTAMP | Token creation time |
| expires_at | TEXT    | NOT NULL                  | Token expiry time   |

### 3. transactions

Records all income and expense entries.

| Column   | Type    | Constraints | Description           |
| -------- | ------- | ----------- | --------------------- |
| id       | INTEGER | PRIMARY KEY | Auto-increment ID     |
| user_id  | INTEGER | -           | Reference to users    |
| amount   | REAL    | NOT NULL    | Transaction amount    |
| type     | TEXT    | NOT NULL    | 'income' or 'expense' |
| category | TEXT    | NOT NULL    | Category name         |
| date     | TEXT    | NOT NULL    | ISO date string       |
| note     | TEXT    | -           | Optional note         |
| icon     | TEXT    | -           | Icon name             |
| color    | TEXT    | -           | Color hex code        |

### 4. categories

Custom user-defined categories.

| Column  | Type    | Constraints | Description           |
| ------- | ------- | ----------- | --------------------- |
| id      | INTEGER | PRIMARY KEY | Auto-increment ID     |
| user_id | INTEGER | -           | Reference to users    |
| name    | TEXT    | NOT NULL    | Category name         |
| type    | TEXT    | NOT NULL    | 'income' or 'expense' |
| icon    | TEXT    | NOT NULL    | Icon name             |
| color   | TEXT    | NOT NULL    | Color hex code        |

### 5. budgets

Monthly budget limits per category.

| Column       | Type    | Constraints | Description        |
| ------------ | ------- | ----------- | ------------------ |
| id           | INTEGER | PRIMARY KEY | Auto-increment ID  |
| user_id      | INTEGER | -           | Reference to users |
| category     | TEXT    | NOT NULL    | Category name      |
| limit_amount | REAL    | NOT NULL    | Budget limit       |

## Entity Relationship Diagram

```
┌──────────┐       ┌─────────────┐
│  users   │───────│ auth_tokens │
└──────────┘       └─────────────┘
     │
     ├─────────────┬─────────────┬─────────────┐
     │             │             │             │
     ▼             ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│transactions│ │categories│ │ budgets  │
└──────────┘ └──────────┘ └──────────┘
```
