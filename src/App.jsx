import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  FilePenLine,
  HandCoins,
  Home,
  Moon,
  Plus,
  Sun,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { Bar, Line } from 'react-chartjs-2'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

const STORAGE_KEYS = {
  transactions: 'ghar-ka-hisaab-transactions',
  profileSettings: 'ghar-ka-hisaab-profile-settings',
  customCategories: 'ghar-ka-hisaab-custom-categories',
}

const defaultExpenseCategories = [
  { key: 'khana', label: 'Groceries/Food', emoji: '🍚' },
  { key: 'bijli', label: 'Electricity Bill', emoji: '💡' },
  { key: 'kiraya', label: 'House Rent', emoji: '🏠' },
  { key: 'dawai', label: 'Medicine', emoji: '💊' },
  { key: 'transport', label: 'Transport/Petrol', emoji: '🚗' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { key: 'mahemanwazi', label: 'Guests/Hospitality', emoji: '👨‍👩‍👧' },

  // Additional categories requested
  { key: 'water-tanker', label: 'Water Tanker', emoji: '🚰' },
  { key: 'gas-cylinder', label: 'Gas Cylinder', emoji: '🔥' },
  { key: 'internet', label: 'Internet', emoji: '🌐' },
  { key: 'extra-spending', label: 'Extra Spending', emoji: '🎯' },
]

const defaultIncomeCategories = [
  { key: 'salary', label: 'Salary', emoji: '💼' },
  { key: 'pension', label: 'Pension', emoji: '💰' },
  { key: 'national-saving-profit', label: 'National Saving Profit', emoji: '🏦' },
  { key: 'rent-income', label: 'Rental Income', emoji: '🏘️' },
  { key: 'other-income', label: 'Other Income', emoji: '➕' },
]

const tabs = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'transactions', label: 'Transactions', icon: HandCoins },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
]

const readLocal = (key, fallback) => {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const getMonthKey = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const toMonthLabel = (month) => {
  const [y, m] = month.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
  })
}

const addMonth = (month, shift) => {
  const [y, m] = month.split('-').map(Number)
  const next = new Date(y, m - 1 + shift, 1)
  return getMonthKey(next)
}

const formatPKR = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`

function App() {
  const [currentTab, setCurrentTab] = useState('home')
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey())
  const [transactions, setTransactions] = useState(() => {
    const existing = readLocal(STORAGE_KEYS.transactions, null)
    return existing?.length ? existing : []
  })
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [customCategories, setCustomCategories] = useState(() =>
    readLocal(STORAGE_KEYS.customCategories, { income: [], expense: [] }),
  )
  const [categoryType, setCategoryType] = useState('expense')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('')
  const [profileSettings, setProfileSettings] = useState(() =>
    readLocal(STORAGE_KEYS.profileSettings, {
      familyName: 'Muhammad Zeeshan Haider',
      darkMode: false,
      monthlyReminder: true,
    }),
  )

  const allIncomeCategories = useMemo(
    () => [...defaultIncomeCategories, ...customCategories.income],
    [customCategories.income],
  )
  const allExpenseCategories = useMemo(
    () => [...defaultExpenseCategories, ...customCategories.expense],
    [customCategories.expense],
  )

  const categories = useMemo(
    () => ({
      income: allIncomeCategories,
      expense: allExpenseCategories,
      byKey: [...allIncomeCategories, ...allExpenseCategories].reduce((acc, item) => {
        acc[item.key] = item
        return acc
      }, {}),
    }),
    [allExpenseCategories, allIncomeCategories],
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profileSettings, JSON.stringify(profileSettings))
  }, [profileSettings])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.customCategories, JSON.stringify(customCategories))
  }, [customCategories])

  useEffect(() => {
    if (profileSettings.darkMode) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [profileSettings.darkMode])

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => tx.month === selectedMonth)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [selectedMonth, transactions],
  )

  const totalIncome = monthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalExpense = monthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const savings = totalIncome - totalExpense
  const overallIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const overallExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const overallSavings = overallIncome - overallExpense

  const displayedTransactions =
    filterType === 'all'
      ? monthTransactions
      : monthTransactions.filter((tx) => tx.type === filterType)

  const addTransaction = (payload) => {
    if (editingTransaction) {
      const updatedMonth = payload.date.slice(0, 7)
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === editingTransaction.id
            ? { ...tx, ...payload, month: updatedMonth }
            : tx,
        ),
      )
      setEditingTransaction(null)
      setShowModal(false)
      return
    }
    const month = payload.date.slice(0, 7)
    setTransactions((prev) => [...prev, { ...payload, id: crypto.randomUUID(), month }])
    setShowModal(false)
  }

  const deleteTransaction = (id) => {
    if (!window.confirm('Are you sure? This entry will be deleted.')) return
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  const addCustomCategory = () => {
    const label = newCategoryLabel.trim()
    const emoji = newCategoryEmoji.trim() || '📌'
    if (!label) return

    const existing = (categoryType === 'income' ? categories.income : categories.expense).some(
      (item) => item.label.toLowerCase() === label.toLowerCase(),
    )
    if (existing) {
      window.alert('Category with this name already exists.')
      return
    }

    const newItem = {
      key: `custom-${categoryType}-${Date.now()}`,
      label,
      emoji,
    }
    setCustomCategories((prev) => ({
      ...prev,
      [categoryType]: [...prev[categoryType], newItem],
    }))
    setNewCategoryLabel('')
    setNewCategoryEmoji('')
  }

  const removeCustomCategory = (type, key) => {
    const isUsed = transactions.some((tx) => tx.category === key)
    if (isUsed) {
      window.alert('This category is used in transactions and cannot be deleted.')
      return
    }
    setCustomCategories((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.key !== key),
    }))
  }

  const monthlyHistory = useMemo(() => {
    const out = []
    for (let i = 5; i >= 0; i -= 1) {
      const month = addMonth(selectedMonth, -i)
      const group = transactions.filter((tx) => tx.month === month)
      out.push({
        month,
        income: group.filter((tx) => tx.type === 'income').reduce((a, b) => a + b.amount, 0),
        expense: group.filter((tx) => tx.type === 'expense').reduce((a, b) => a + b.amount, 0),
      })
    }
    return out
  }, [selectedMonth, transactions])

  const expenseBreakdown = useMemo(() => {
    const map = {}
    monthTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount
      })
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [monthTransactions])

  const incomeBreakdown = useMemo(() => {
    const map = {}
    monthTransactions
      .filter((tx) => tx.type === 'income')
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount
      })
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [monthTransactions])

  const topExpenses = [...expenseBreakdown]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((item) => `${categories.byKey[item.category]?.emoji || '💸'} ${categories.byKey[item.category]?.label || 'Expense'}: ${formatPKR(item.amount)}`)

  const shareText = `📊 *Family Budget Tracker - ${toMonthLabel(selectedMonth)}*\n💰 Income: ${formatPKR(totalIncome)}\n💸 Expenses: ${formatPKR(totalExpense)}\n✅ Savings: ${formatPKR(savings)}\n\nTop Expenses:\n${topExpenses.join('\n') || 'No expense records yet.'}`
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-')

  const updateMonthKeepingYear = (monthNumber) => {
    setSelectedMonth(`${selectedYear}-${String(monthNumber).padStart(2, '0')}`)
  }

  const updateYearKeepingMonth = (year) => {
    const safeYear = Math.max(1900, Math.min(2100, Number(year) || Number(selectedYear)))
    setSelectedMonth(`${safeYear}-${selectedMonthNumber}`)
  }
  const flowByDate = useMemo(() => {
    const map = {}
    monthTransactions.forEach((tx) => {
      if (!map[tx.date]) {
        map[tx.date] = { income: 0, expense: 0, count: 0 }
      }
      map[tx.date][tx.type] += tx.amount
      map[tx.date].count += 1
    })
    return map
  }, [monthTransactions])

  const calendarCells = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const cells = Array.from({ length: firstDay }, () => null)
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day)
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [selectedMonth])

  return (
    <div className={`neon-shell mx-auto min-h-screen w-full max-w-[430px] shadow-xl ${profileSettings.darkMode ? 'dark-theme bg-slate-900 text-slate-100' : ''}`}>
      <div className="px-4 pb-28 pt-4">
        <header className="neon-header mb-4 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-90">Welcome back, Muhammad Zeeshan Haider 🔥</p>
          <h1 className="text-2xl font-bold">{profileSettings.familyName || 'Muhammad Zeeshan Haider'} Budget Tracker</h1>
        </header>

        <div className="glass-neon mb-4 flex items-center justify-between rounded-xl p-3">
          <button aria-label="Previous month" className="rounded-full p-2 hover:bg-slate-100" onClick={() => setSelectedMonth((prev) => addMonth(prev, -1))}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="font-semibold">{toMonthLabel(selectedMonth)}</p>
            <div className="flex items-center gap-1">
              <select
                value={selectedMonthNumber}
                onChange={(e) => updateMonthKeepingYear(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-1 py-1 text-xs"
                aria-label="Select month"
              >
                {[
                  ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'],
                  ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'],
                  ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-md bg-slate-100 px-2 py-1 text-xs"
                onClick={() => updateYearKeepingMonth(Number(selectedYear) - 1)}
                aria-label="Previous year"
              >
                -Y
              </button>
              <input
                type="number"
                min="1900"
                max="2100"
                value={selectedYear}
                onChange={(e) => updateYearKeepingMonth(e.target.value)}
                className="w-16 rounded-md border border-slate-300 bg-white px-1 py-1 text-center text-xs"
                aria-label="Jump to year"
              />
              <button
                type="button"
                className="rounded-md bg-slate-100 px-2 py-1 text-xs"
                onClick={() => updateYearKeepingMonth(Number(selectedYear) + 1)}
                aria-label="Next year"
              >
                +Y
              </button>
            </div>
          </div>
          <button aria-label="Next month" className="rounded-full p-2 hover:bg-slate-100" onClick={() => setSelectedMonth((prev) => addMonth(prev, 1))}>
            <ArrowRight size={18} />
          </button>
        </div>

        {currentTab === 'home' && (
          <section className="slide-fade space-y-4">
            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-3 text-lg font-semibold">Monthly Summary</h2>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-blue-50 p-2">
                  <p className="text-slate-500">Income</p>
                  <p className="font-semibold text-blue-700">{formatPKR(totalIncome)}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-2">
                  <p className="text-slate-500">Expenses</p>
                  <p className="font-semibold text-red-600">{formatPKR(totalExpense)}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-2">
                  <p className="text-slate-500">Savings</p>
                  <p className={`font-semibold ${savings >= 0 ? 'text-brand-700' : 'text-red-600'}`}>{formatPKR(savings)}</p>
                </div>
              </div>
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">
                {monthTransactions.length > 0
                  ? `Recent ${Math.min(5, monthTransactions.length)} Transactions`
                  : 'Recent Transactions'}
              </h3>
              {monthTransactions.slice(0, 5).length === 0 ? (
                <p className="text-sm text-slate-500">No records yet!</p>
              ) : (
                <div className="space-y-2">
                  {monthTransactions.slice(0, 5).map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      category={categories.byKey[tx.category]}
                      onDelete={deleteTransaction}
                      onEdit={(item) => {
                        setEditingTransaction(item)
                        setShowModal(true)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">Income Sources (This Month)</h3>
              {incomeBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">No income records yet.</p>
              ) : (
                <div className="space-y-2">
                  {incomeBreakdown.map((item) => (
                    <div
                      key={item.category}
                      className={`flex items-center justify-between rounded-xl p-2 ${
                        profileSettings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-blue-50'
                      }`}
                    >
                      <p className={`text-sm font-medium ${profileSettings.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {categories.byKey[item.category]?.emoji} {categories.byKey[item.category]?.label || 'Income source'}
                      </p>
                      <p className={`text-sm font-semibold ${profileSettings.darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        {formatPKR(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {currentTab === 'transactions' && (
          <section className="slide-fade space-y-4">
            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-3 text-lg font-semibold">All Entries</h2>
              <div className="mb-3 flex gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'income', label: 'Income' },
                  { key: 'expense', label: 'Expense' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilterType(item.key)}
                    className={`rounded-full px-3 py-1 text-sm transition ${filterType === item.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {displayedTransactions.length === 0 ? (
                <p className="text-sm text-slate-500">No records yet!</p>
              ) : (
                <div className="space-y-2">
                  {displayedTransactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      category={categories.byKey[tx.category]}
                      onDelete={deleteTransaction}
                      onEdit={(item) => {
                        setEditingTransaction(item)
                        setShowModal(true)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {currentTab === 'reports' && (
          <section className="slide-fade space-y-4">
            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-3 text-lg font-semibold">Last 6 Months Trend</h2>
              <Bar
                data={{
                  labels: monthlyHistory.map((m) => toMonthLabel(m.month).split(' ')[0]),
                  datasets: [
                    { label: 'Income', data: monthlyHistory.map((m) => m.income), backgroundColor: '#3b82f6' },
                    { label: 'Expense', data: monthlyHistory.map((m) => m.expense), backgroundColor: '#ef4444' },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
              />
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-3 text-lg font-semibold">Expense Category Graph</h2>
              {expenseBreakdown.length ? (
                <Bar
                  data={{
                    labels: expenseBreakdown.map((item) => `${categories.byKey[item.category]?.emoji} ${categories.byKey[item.category]?.label}`),
                    datasets: [
                      {
                        label: 'Expense by Category',
                        data: expenseBreakdown.map((i) => i.amount),
                        backgroundColor: '#ef4444',
                        borderRadius: 8,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              ) : (
                <p className="text-sm text-slate-500">No expense data found.</p>
              )}
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-3 text-lg font-semibold">Income Sources Graph</h2>
              {incomeBreakdown.length ? (
                <Line
                  data={{
                    labels: incomeBreakdown.map((item) => `${categories.byKey[item.category]?.emoji} ${categories.byKey[item.category]?.label}`),
                    datasets: [
                      {
                        label: 'Income by Source',
                        data: incomeBreakdown.map((i) => i.amount),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        fill: true,
                        tension: 0.35,
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                />
              ) : (
                <p className="text-sm text-slate-500">No income data found.</p>
              )}
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-2 text-lg font-semibold">Month Summary</h2>
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1 text-left">Month</th>
                    <th className="py-1 text-right">Income</th>
                    <th className="py-1 text-right">Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyHistory.map((row) => (
                    <tr key={row.month} className="border-t">
                      <td className="py-1">{toMonthLabel(row.month).split(' ')[0]}</td>
                      <td className="py-1 text-right text-blue-700">{formatPKR(row.income)}</td>
                      <td className="py-1 text-right text-red-600">{formatPKR(row.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="mt-3 w-full rounded-xl bg-brand-600 py-2 font-medium text-white transition hover:bg-brand-700"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
              >
                Share on WhatsApp
              </button>
            </div>
          </section>
        )}

        {currentTab === 'profile' && (
          <section className="slide-fade space-y-4">
            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-3 text-lg font-semibold">Profile & Settings</h2>
              <label className="mb-2 block text-sm font-medium">Family Name</label>
              <input
                value={profileSettings.familyName}
                onChange={(e) =>
                  setProfileSettings((prev) => ({ ...prev, familyName: e.target.value }))
                }
                className="w-full rounded-xl border p-2"
                placeholder="Enter family name"
              />
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">Overall Total Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-blue-50 p-2">
                  <p className="text-slate-500">Total Income</p>
                  <p className="font-semibold text-blue-700">{formatPKR(overallIncome)}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-2">
                  <p className="text-slate-500">Total Expenses</p>
                  <p className="font-semibold text-red-600">{formatPKR(overallExpense)}</p>
                </div>
                <div className="col-span-2 rounded-xl bg-brand-50 p-2">
                  <p className="text-slate-500">Net Balance</p>
                  <p className={`font-semibold ${overallSavings >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatPKR(overallSavings)}</p>
                </div>
              </div>
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">Total Summary Graph</h3>
              <Bar
                data={{
                  labels: ['Income', 'Expenses', 'Net Balance'],
                  datasets: [
                    {
                      label: 'PKR',
                      data: [overallIncome, overallExpense, overallSavings],
                      backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6'],
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
              />
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">Manage Categories</h3>
              <div className="mb-2 flex gap-2">
                <button
                  onClick={() => setCategoryType('expense')}
                  className={`rounded-full px-3 py-1 text-sm ${categoryType === 'expense' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setCategoryType('income')}
                  className={`rounded-full px-3 py-1 text-sm ${categoryType === 'income' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  Income
                </button>
              </div>
              <div className="mb-3 grid grid-cols-[72px_1fr_auto] gap-2">
                <input
                  value={newCategoryEmoji}
                  onChange={(e) => setNewCategoryEmoji(e.target.value)}
                  className="rounded-xl border p-2 text-center"
                  placeholder="Emoji"
                  maxLength={3}
                />
                <input
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  className="rounded-xl border p-2"
                  placeholder="New category name"
                />
                <button onClick={addCustomCategory} className="rounded-xl bg-brand-600 px-3 py-2 text-white">
                  Add
                </button>
              </div>

              <p className="mb-2 text-xs text-slate-500">Custom categories only (default ones cannot be deleted).</p>
              <div className="space-y-2">
                {(categoryType === 'income' ? customCategories.income : customCategories.expense).length === 0 ? (
                  <p className="text-sm text-slate-500">No custom categories yet.</p>
                ) : (
                  (categoryType === 'income' ? customCategories.income : customCategories.expense).map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                      <p className="text-sm">{cat.emoji} {cat.label}</p>
                      <button
                        onClick={() => removeCustomCategory(categoryType, cat.key)}
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-red-600"
                        aria-label={`Delete category ${cat.label}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">App Preferences</h3>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => setProfileSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2"
                >
                  <span>Dark Mode</span>
                  <span className="inline-flex items-center gap-1">{profileSettings.darkMode ? <Moon size={14} /> : <Sun size={14} />}{profileSettings.darkMode ? 'On' : 'Off'}</span>
                </button>
                <button
                  onClick={() => setProfileSettings((prev) => ({ ...prev, monthlyReminder: !prev.monthlyReminder }))}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2"
                >
                  <span>Monthly Reminder</span>
                  <span>{profileSettings.monthlyReminder ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'calendar' && (
          <section className="slide-fade space-y-4">
            <div className="glass-neon soft-pop rounded-2xl p-4">
              <h2 className="mb-2 text-lg font-semibold">Finance Calendar</h2>
              <p className="text-sm text-slate-500">Visualize daily money flow for {toMonthLabel(selectedMonth)}.</p>
            </div>

            <div className="glass-neon soft-pop rounded-2xl p-3">
              <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="h-16 rounded-lg bg-slate-100/40" />
                  }
                  const dateKey = `${selectedMonth}-${String(day).padStart(2, '0')}`
                  const flow = flowByDate[dateKey] || { income: 0, expense: 0, count: 0 }
                  const net = flow.income - flow.expense
                  const tone =
                    flow.count === 0
                      ? 'bg-slate-100 text-slate-500'
                      : net >= 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-700'
                  return (
                    <div key={dateKey} className={`h-16 rounded-lg p-1 text-[10px] ${tone}`}>
                      <p className="text-xs font-semibold">{day}</p>
                      {flow.count > 0 ? (
                        <>
                          <p>+{formatPKR(flow.income).replace('Rs. ', '')}</p>
                          <p>-{formatPKR(flow.expense).replace('Rs. ', '')}</p>
                        </>
                      ) : (
                        <p className="mt-2 text-center">No flow</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

      </div>

      <button
        aria-label="Add transaction"
        onClick={() => setShowModal(true)}
        className="neon-fab fixed bottom-24 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white transition hover:scale-105"
      >
        <Plus />
      </button>

      <nav className="glass-neon fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-2 py-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = currentTab === tab.key
            return (
              <button key={tab.key} onClick={() => setCurrentTab(tab.key)} className={`rounded-xl py-2 text-xs transition ${active ? 'bg-brand-100 text-brand-700' : 'text-slate-500'}`}>
                <Icon size={18} className="mx-auto mb-1" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {showModal && (
        <AddTransactionModal
          onClose={() => {
            setShowModal(false)
            setEditingTransaction(null)
          }}
          onSave={addTransaction}
          categories={categories}
          editingTransaction={editingTransaction}
        />
      )}
    </div>
  )
}

function AddTransactionModal({ onClose, onSave, categories, editingTransaction }) {
  const [type, setType] = useState(editingTransaction?.type || 'expense')
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '')
  const [category, setCategory] = useState(editingTransaction?.category || categories.expense[0]?.key || '')
  const [title, setTitle] = useState(editingTransaction?.title || '')
  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().slice(0, 10))

  const activeCategories = type === 'income' ? categories.income : categories.expense

  return (
    <div className="fixed inset-0 z-40 bg-black/35 px-3">
      <div className="glass-neon slide-fade mx-auto mt-20 max-w-[430px] rounded-2xl p-4">
        <h3 className="mb-3 text-lg font-semibold">{editingTransaction ? 'Edit Entry' : 'Add New Entry'}</h3>
        <div className="mb-3 flex gap-2">
          {[
            { key: 'income', label: 'Income' },
            { key: 'expense', label: 'Expense' },
          ].map((option) => (
            <button
              key={option.key}
              className={`rounded-full px-3 py-1 text-sm ${type === option.key ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}
              onClick={() => {
                setType(option.key)
                setCategory((option.key === 'income' ? categories.income : categories.expense)[0]?.key || '')
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (PKR)"
          className="mb-2 w-full rounded-xl border p-2"
        />
        <div className="relative mb-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none rounded-xl border p-2 pr-10"
          >
            {activeCategories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / Note" className="mb-2 w-full rounded-xl border p-2" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3 w-full rounded-xl border p-2" />

        <div className="flex gap-2">
          <button className="flex-1 rounded-xl bg-slate-100 py-2" onClick={onClose}>Cancel</button>
          <button
            className="flex-1 rounded-xl bg-brand-600 py-2 font-medium text-white"
            onClick={() => {
              if (!amount || Number(amount) <= 0) return
              onSave({
                type,
                amount: Number(amount),
                category,
                title: title.trim() || 'Untitled',
                date,
              })
            }}
          >
            {editingTransaction ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TransactionItem({ tx, category, onDelete, onEdit }) {
  return (
    <div className="soft-pop flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
      <div>
        <p className="text-sm font-medium">{category?.emoji || '🧾'} {tx.title}</p>
        <p className="text-xs text-slate-500">{category?.label || tx.category} - {new Date(tx.date).toLocaleDateString('en-PK')}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-blue-700' : 'text-red-600'}`}>
          {tx.type === 'income' ? '+' : '-'} {formatPKR(tx.amount)}
        </p>
        <button
          aria-label={`Edit ${tx.title}`}
          onClick={() => onEdit(tx)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-brand-600"
        >
          <FilePenLine size={16} />
        </button>
        <button aria-label={`Delete ${tx.title}`} onClick={() => onDelete(tx.id)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default App
