import React from 'react'
import type { TradingAccountStatus } from '../../types'
import './TradingPanel.css'

interface TradingPanelProps {
  accountStatus: TradingAccountStatus | null
  currentPrice: number | null
  onBuy: () => void
  onSell: () => void
  isLoading: boolean
}

/**
 * TradingPanel displays trading account status and provides buy/sell controls.
 * Shows current cash, position details, and P/L metrics.
 */
const TradingPanel: React.FC<TradingPanelProps> = ({
  accountStatus,
  currentPrice,
  onBuy,
  onSell,
  isLoading,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatShares = (value: number): string => {
    return value.toLocaleString('en-US')
  }

  if (!accountStatus) {
    return (
      <div className="trading-panel">
        <div className="panel-header">交易帳戶</div>
        <div className="panel-body">
          <p className="loading-text">載入帳戶中...</p>
        </div>
      </div>
    )
  }

  const { position, current_cash, total_value, realized_pl, unrealized_pl, total_pl, total_pl_pct } =
    accountStatus

  const hasPosition = position !== null
  const canBuy = current_cash > 0 && currentPrice !== null && !isLoading
  const canSell = hasPosition && position.shares >= 1000 && !isLoading

  return (
    <div className="trading-panel">
      <div className="panel-header">Trading Account</div>

      <div className="panel-body">
        {/* Account Overview */}
        <div className="account-section">
          <h3>帳戶概況</h3>
          <div className="info-row">
            <span className="label">現金：</span>
            <span className="value">{formatCurrency(current_cash)}</span>
          </div>
          <div className="info-row">
            <span className="label">總資產：</span>
            <span className="value total-value">{formatCurrency(total_value)}</span>
          </div>
        </div>

        {/* Position Details */}
        <div className="position-section">
          <h3>持倉部位</h3>
          {hasPosition ? (
            <>
              <div className="info-row">
                <span className="label">股數：</span>
                <span className="value">{formatShares(position.shares)}</span>
              </div>
              <div className="info-row">
                <span className="label">進場價格：</span>
                <span className="value">{formatCurrency(position.entry_price)}</span>
              </div>
              <div className="info-row">
                <span className="label">目前價格：</span>
                <span className="value">{formatCurrency(position.current_price)}</span>
              </div>
              <div className="info-row">
                <span className="label">市值：</span>
                <span className="value">{formatCurrency(position.market_value)}</span>
              </div>
              <div className="info-row">
                <span className="label">未實現損益：</span>
                <span className={`value ${position.unrealized_pl >= 0 ? 'profit' : 'loss'}`}>
                  {formatCurrency(position.unrealized_pl)} ({formatPercent(position.unrealized_pl_pct)})
                </span>
              </div>
            </>
          ) : (
            <p className="no-position">尚無持倉</p>
          )}
        </div>

        {/* P/L Summary */}
        <div className="pl-section">
          <h3>損益摘要</h3>
          <div className="info-row">
            <span className="label">已實現損益：</span>
            <span className={`value ${realized_pl >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(realized_pl)}
            </span>
          </div>
          <div className="info-row">
            <span className="label">未實現損益：</span>
            <span className={`value ${unrealized_pl >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(unrealized_pl)}
            </span>
          </div>
          <div className="info-row total-pl-row">
            <span className="label">總損益：</span>
            <span className={`value total-pl ${total_pl >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(total_pl)} ({formatPercent(total_pl_pct)})
            </span>
          </div>
        </div>

        {/* Trading Controls */}
        <div className="controls-section">
          <button
            className="buy-button"
            onClick={onBuy}
            disabled={!canBuy}
            title={
              !canBuy
                ? current_cash <= 0
                  ? '現金不足'
                  : '無目前價格'
                : '買入 1000 股'
            }
          >
            {isLoading ? '處理中...' : '買入 1000'}
          </button>
          <button
            className="sell-button"
            onClick={onSell}
            disabled={!canSell}
            title={
              !canSell
                ? hasPosition && position.shares < 1000
                  ? `僅有 ${position?.shares || 0} 股可賣`
                  : '尚無持倉可賣出'
                : '賣出 1000 股'
            }
          >
            {isLoading ? '處理中...' : '賣出 1000'}
          </button>
        </div>

        {currentPrice !== null && (
          <div className="current-price-info">
            <span className="label">目前價格：</span>
            <span className="value">{formatCurrency(currentPrice)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TradingPanel
