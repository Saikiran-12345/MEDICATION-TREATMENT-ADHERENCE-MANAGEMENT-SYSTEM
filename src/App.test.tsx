import { render, screen } from '@testing-library/react'
import App from './App'
import { expect, test } from 'vitest'

test('renders MTAMS header', () => {
  render(<App />)
  const headerElement = screen.getByText(/MTAMS/i)
  expect(headerElement).toBeInTheDocument()
})
