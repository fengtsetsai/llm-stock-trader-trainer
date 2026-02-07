import React from 'react'
import type { Trade, TradingAccountStatus } from '../../types'
import './PerformanceAnalysis.css'

interface PerformanceAnalysisProps {
  trades: Trade[]
  accountStatus: TradingAccountStatus | null
}

interface TradeStats {
  totalTrades: number
  buyCount: number
  sellCount: number
  totalBuyValue: number
  totalSellValue: number
  grossProfit: number
  grossLoss: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  largestWin: number
  largestLoss: number
}

const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({ trades, accountStatus }) => {
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

  const calculateStats = (): TradeStats => {
    const buyTrades = trades.filter(t => t.type === 'buy')
    const sellTrades = trades.filter(t => t.type === 'sell')

    const totalBuyValue = buyTrades.reduce((sum, t) => sum + t.total, 0)
    const totalSellValue = sellTrades.reduce((sum, t) => sum + t.total, 0)

    // Calculate P/L for each sell trade
    const sellPLs: number[] = []
    sellTrades.forEach(sellTrade => {
      // Find corresponding buy trades (FIFO)
      const sellPrice = sellTrade.price
      const buyPrice = buyTrades.length > 0 ? buyTrades[buyTrades.length - 1].price : 0
      const pl = (sellPrice - buyPrice) * sellTrade.shares
      sellPLs.push(pl)
    })

    const profits = sellPLs.filter(pl => pl > 0)
    const losses = sellPLs.filter(pl => pl < 0)

    const grossProfit = profits.reduce((sum, p) => sum + p, 0)
    const grossLoss = Math.abs(losses.reduce((sum, l) => sum + l, 0))

    const winningTrades = profits.length
    const losingTrades = losses.length
    const completedTrades = sellTrades.length
    const winRate = completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0

    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

    const largestWin = profits.length > 0 ? Math.max(...profits) : 0
    const largestLoss = losses.length > 0 ? Math.min(...losses) : 0

    return {
      totalTrades: trades.length,
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      totalBuyValue,
      totalSellValue,
      grossProfit,
      grossLoss,
      winningTrades,
      losingTrades,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      largestWin,
      largestLoss,
    }
  }

  const stats = calculateStats()

  if (!accountStatus) {
    return (
      <div className="performance-analysis">
        <div className="analysis-header">
          <h3>績效分析 / Performance Analysis</h3>
        </div>
        <div className="no-data">
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="performance-analysis">
      <div className="analysis-header">
        <h3>績效分析 / Performance Analysis</h3>
      </div>

      <div className="analysis-body">
        {/* Account Summary */}
        <div className="stats-section">
          <h4 className="section-title">帳戶概況</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">初始資金</span>
              <span className="stat-value">{formatCurrency(accountStatus.initial_cash)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">當前現金</span>
              <span className="stat-value">{formatCurrency(accountStatus.current_cash)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">總資產</span>
              <span className="stat-value highlight">{formatCurrency(accountStatus.total_value)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">總損益</span>
              <span className={`stat-value ${accountStatus.total_pl >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(accountStatus.total_pl)} ({formatPercent(accountStatus.total_pl_pct)})
              </span>
            </div>
          </div>
        </div>

        {/* P/L Breakdown */}
        <div className="stats-section">
          <h4 className="section-title">損益分析</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">已實現損益</span>
              <span className={`stat-value ${accountStatus.realized_pl >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(accountStatus.realized_pl)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">未實現損益</span>
              <span className={`stat-value ${accountStatus.unrealized_pl >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(accountStatus.unrealized_pl)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">毛利</span>
              <span className="stat-value profit">{formatCurrency(stats.grossProfit)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">毛損</span>
              <span className="stat-value loss">{formatCurrency(stats.grossLoss)}</span>
            </div>
          </div>
        </div>

        {/* Trading Statistics */}
        <div className="stats-section">
          <h4 className="section-title">交易統計</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">總交易數</span>
              <span className="stat-value">{stats.totalTrades}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">買入 / 賣出</span>
              <span className="stat-value">{stats.buyCount} / {stats.sellCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">勝率</span>
              <span className={`stat-value ${stats.winRate >= 50 ? 'profit' : 'neutral'}`}>
                {stats.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">獲利 / 虧損交易</span>
              <span className="stat-value">{stats.winningTrades} / {stats.losingTrades}</span>
            </div>
          </div>
        </div>

        {/* Trade Performance */}
        <div className="stats-section">
          <h4 className="section-title">交易表現</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">平均獲利</span>
              <span className="stat-value profit">{formatCurrency(stats.avgWin)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均虧損</span>
              <span className="stat-value loss">{formatCurrency(stats.avgLoss)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最大獲利</span>
              <span className="stat-value profit">{formatCurrency(stats.largestWin)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最大虧損</span>
              <span className="stat-value loss">{formatCurrency(stats.largestLoss)}</span>
            </div>
          </div>
        </div>

        {/* Advanced Metrics */}
        <div className="stats-section">
          <h4 className="section-title">進階指標</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">獲利因子</span>
              <span className={`stat-value ${stats.profitFactor >= 1 ? 'profit' : 'loss'}`}>
                {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">報酬風險比</span>
              <span className="stat-value">
                {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">總交易量</span>
              <span className="stat-value">{formatCurrency(stats.totalBuyValue)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均交易金額</span>
              <span className="stat-value">
                {stats.totalTrades > 0 ? formatCurrency(stats.totalBuyValue / stats.buyCount) : '$0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceAnalysis
