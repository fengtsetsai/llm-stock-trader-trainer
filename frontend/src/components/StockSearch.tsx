import React, { useState, useEffect, useRef } from 'react'
import { getStockInfo, searchStocks } from '../services/api'
import type { StockInfo } from '../types'

interface StockSearchProps {
  value: string
  onChange: (symbol: string) => void
  placeholder?: string
  className?: string
}

/**
 * Stock search component that supports both stock code and Chinese name input
 * Displays results as "8033.TW - 雷虎" but returns the symbol (e.g., "8033.TW")
 */
export const StockSearch: React.FC<StockSearchProps> = ({
  value,
  onChange,
  placeholder = 'Enter stock code or Chinese name (e.g., 8033 or 雷虎)',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('')
  const [displayValue, setDisplayValue] = useState('')
  const [suggestions, setSuggestions] = useState<StockInfo[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Initialize display value from prop
  useEffect(() => {
    if (value) {
      setDisplayValue(value)
      // Try to fetch stock info to get display name
      const fetchInfo = async () => {
        try {
          const info = await getStockInfo(value)
          setDisplayValue(info.display_name)
        } catch {
          // Keep the symbol if fetch fails
          setDisplayValue(value)
        }
      }
      fetchInfo()
    }
  }, [value])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.trim().length === 0) {
        setSuggestions([])
        setShowSuggestions(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Use search API which supports both code and Chinese name
        const results = await searchStocks(inputValue.trim())
        
        if (results.length > 0) {
          setSuggestions(results)
          setShowSuggestions(true)
        } else {
          setError('Stock not found')
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (err) {
        setError('Search failed. Please try again.')
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setError(null)
  }

  const handleSelectStock = (stock: StockInfo) => {
    setDisplayValue(stock.display_name)
    setInputValue('')
    setShowSuggestions(false)
    setError(null)
    onChange(stock.symbol)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleClear = () => {
    setInputValue('')
    setDisplayValue('')
    setSuggestions([])
    setShowSuggestions(false)
    setError(null)
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      {/* Display current stock */}
      {displayValue && !inputValue && (
        <div className="mb-2 flex items-center gap-2">
          <div className="px-3 py-2 bg-cyber-dark/30 border border-cyber-accent/50 rounded text-cyber-accent font-mono text-sm backdrop-blur-sm">
            {displayValue}
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-2 text-xs font-mono bg-cyber-dark/50 hover:bg-cyber-dark/70 text-cyber-primary border border-cyber-primary/30 hover:border-cyber-accent rounded transition-colors backdrop-blur-sm"
          >
            CHANGE
          </button>
        </div>
      )}

      {/* Input field - only show when no stock is selected or user clicked change */}
      {(!displayValue || inputValue) && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-cyber-dark/50 border rounded text-cyber-primary placeholder-cyber-primary/40 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-cyber-accent focus:border-cyber-accent backdrop-blur-sm ${
              error ? 'border-red-500/50' : 'border-cyber-primary/30'
            } ${className}`}
          />

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-2.5 text-cyber-accent">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-1 text-xs font-mono text-red-400">{error}</div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-cyber-dark/95 border border-cyber-accent/50 rounded shadow-lg shadow-cyber-accent/20 max-h-60 overflow-auto backdrop-blur-md"
            >
              {suggestions.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock)}
                  className="w-full px-4 py-2 text-left hover:bg-cyber-accent/20 transition-colors border-b border-cyber-primary/20 last:border-b-0 group"
                >
                  <div className="font-mono font-medium text-cyber-accent text-sm group-hover:text-cyber-accent/90">{stock.display_name}</div>
                  <div className="text-xs font-mono text-cyber-primary/60 group-hover:text-cyber-primary/80">{stock.symbol}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StockSearch
