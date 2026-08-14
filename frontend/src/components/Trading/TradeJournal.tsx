import React from 'react'
import type { Trade } from '../../types'
import './TradeJournal.css'

interface TradeJournalProps {
  trades: Trade[]
}

const TradeJournal: React.FC<TradeJournalProps> = ({ trades }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatShares = (value: number): string => {
    return value.toLocaleString('en-US')
  }

  const formatDate = (timestamp: string): string => {
    // Extract YYYY-MM-DD directly to avoid timezone conversion mismatches
    return timestamp.split('T')[0]
  }

  // Sort trades by timestamp string (YYYY-MM-DD prefix is sortable), newest first
  const sortedTrades = [...trades].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  )

  return (
    <div className="trade-journal">
      <div className="journal-header">
        <h3>交易日誌</h3>
        <span className="trade-count">總共 {trades.length} 筆交易</span>
      </div>

      {trades.length === 0 ? (
        <div className="no-trades">
          <p>尚未進行任何交易</p>
          <p className="hint">點擊買入或賣出按鈕開始交易</p>
        </div>
      ) : (
        <div className="journal-body">
          <div className="journal-table-wrapper">
            <table className="journal-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>類型</th>
                  <th>股數</th>
                  <th>價格</th>
                  <th>金額</th>
                  <th>現金餘額</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade) => (
                  <tr key={trade.id} className={`trade-row ${trade.type}`}>
                    <td className="timestamp">{formatDate(trade.timestamp)}</td>
                    <td className="trade-type">
                      <span className={`type-badge ${trade.type}`}>
                        {trade.type === 'buy' ? '買入' : '賣出'}
                      </span>
                    </td>
                    <td className="shares">{formatShares(trade.shares)}</td>
                    <td className="price">{formatCurrency(trade.price)}</td>
                    <td className={`total ${trade.type === 'sell' ? 'profit' : 'expense'}`}>
                      {trade.type === 'buy' ? '-' : '+'}{formatCurrency(trade.total)}
                    </td>
                    <td className="cash-after">{formatCurrency(trade.cash_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeJournal
