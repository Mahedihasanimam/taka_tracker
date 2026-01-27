# Core Features Documentation

## 1. Transaction Management

### Add Transaction

- Select type: Income or Expense
- Enter amount with numeric keypad
- Choose category from grid
- Select date (defaults to today)
- Add optional note
- Saves to local SQLite database

### View Transactions

- Grouped by date (Today, Yesterday, Date)
- Filter by type (All/Income/Expense)
- Search by category or note
- Date range filtering
- Pull-to-refresh

### Edit/Delete Transaction

- Tap to edit
- Long-press for quick actions
- Confirm delete with alert

## 2. Category Management

### Default Categories

**Expense:**

- Food, Transport, Rent, Shopping, Bills, Others

**Income:**

- Salary, Gift, Investment, Others

### Custom Categories

- Create with custom name
- Select from 20+ icons
- Choose from 15 colors
- Edit or delete anytime

## 3. Budget Management

### Create Budget

- Select expense category
- Set monthly limit
- Suggested limits based on income (10%, 20%, 30%)

### Track Progress

- Visual progress bars
- Color-coded status:
  - Green: < 80% used
  - Orange: 80-99% used
  - Red: 100%+ exceeded
- Alerts for over-budget categories

## 4. Dashboard Analytics

### Today Card

- Donut chart showing category breakdown
- Daily spending vs budget
- Category legend

### Weekly Card

- Bar chart for 7-day spending
- Highlights highest spending day
- Average daily calculation

### Monthly Card

- Line chart showing spending trend
- Total balance (Income - Expense)
- Savings indicator

## 5. Data Export

### CSV Export

- All transactions with headers
- Summary with totals
- Shareable via system share sheet

### PDF Export

- Professional report layout
- Color-coded income/expense
- Summary statistics
- Date-filtered exports

## 6. Multi-language Support

### Supported Languages

- English (en)
- Bengali (bn) - বাংলা

### Implementation

- LanguageContext for state
- AsyncStorage for persistence
- Dynamic translation function `t(key)`
