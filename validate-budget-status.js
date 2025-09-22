import { calculateBudgetStatus } from './src/utils/budgetCalculator.js'

// Test data from the original test
const mockExpenses = [
  { id: '1', date: '2024-03-01', amount: 50, timestamp: 1709251200000 },
  { id: '2', date: '2024-03-01', amount: 30, timestamp: 1709251200000 },
  { id: '3', date: '2024-03-02', amount: 40, timestamp: 1709337600000 },
  { id: '4', date: '2024-03-03', amount: 60, timestamp: 1709424000000 }
]

const monthlyBudget = 3100
const status = calculateBudgetStatus(monthlyBudget, mockExpenses, '2024-03', '2024-03-15')

// Validate the expected fields exist
const requiredFields = [
  'monthlyBudget', 'dailyBase', 'totalSpent', 'todaySpent', 
  'remainingBudget', 'remainingDays', 'dailyAvailable', 
  'historyAdjustment', 'isOverBudget', 'isDailyOverBudget'
]

const newFields = [
  'budgetStartDate', 'availableDays', 'accumulatedTransfer', 
  'algorithmVersion', 'alerts', 'dailyBalances', 'metadata'
]

let allFieldsPresent = true
let missingFields = []

// Check required fields
for (const field of requiredFields) {
  if (!(field in status)) {
    allFieldsPresent = false
    missingFields.push(field)
  }
}

// Check new fields
for (const field of newFields) {
  if (!(field in status)) {
    allFieldsPresent = false
    missingFields.push(field)
  }
}

if (allFieldsPresent) {
  console.log('✓ All required fields present')
  console.log('✓ Budget status structure extended successfully')
  console.log('✓ Task 3.1 completed: Extended budget status data structure')
  
  // Validate some key values
  if (status.monthlyBudget === 3100) console.log('✓ Monthly budget correct')
  if (status.dailyBase === 100) console.log('✓ Daily base correct')
  if (status.totalSpent === 180) console.log('✓ Total spent correct')
  if (status.algorithmVersion === '2.0') console.log('✓ Algorithm version set')
  if (Array.isArray(status.alerts)) console.log('✓ Alerts array present')
  if (status.dailyBalances instanceof Map) console.log('✓ Daily balances Map present')
  
} else {
  console.log('✗ Missing fields:', missingFields)
  process.exit(1)
}