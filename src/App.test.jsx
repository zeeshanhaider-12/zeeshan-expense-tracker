import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

const storageKeys = [
  'ghar-ka-hisaab-transactions',
  'ghar-ka-hisaab-budgets',
  'ghar-ka-hisaab-settings',
]

describe('Family Budget Tracker', () => {
  beforeEach(() => {
    storageKeys.forEach((key) => localStorage.removeItem(key))
  })

  it('shows empty state when no transactions exist', () => {
    render(<App />)

    expect(screen.getByText('Recent Transactions')).toBeInTheDocument()
    expect(screen.getByText('No records yet!')).toBeInTheDocument()
  })

  it('adds a new income transaction from modal', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Add transaction' }))
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))
    fireEvent.change(screen.getByPlaceholderText('Amount (PKR)'), { target: { value: '5000' } })
    fireEvent.change(screen.getByPlaceholderText('Title / Note'), { target: { value: 'Salary payment' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Recent 1 Transactions')).toBeInTheDocument()
    expect(screen.getByText(/Salary payment/i)).toBeInTheDocument()
  })
})
