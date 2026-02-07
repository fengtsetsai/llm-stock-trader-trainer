import { useState, useEffect, useRef, useCallback } from 'react'
import CandlestickChart from '../components/Chart/CandlestickChart'
import PlaybackControls from '../components/Player/PlaybackControls'
import TradingPanel from '../components/Trading/TradingPanel'
import TradeJournal from '../components/Trading/TradeJournal'
import PerformanceAnalysis from '../components/Trading/PerformanceAnalysis'
import NewsModal from '../components/News/NewsModal'
import StockSearch from '../components/StockSearch'
import { 
  startPlayback, 
  getNextCandle, 
  seekPlayback,
  createTradingAccount,
  getTradingAccountStatus,
  executeBuy,
  executeSell,
  fetchNews,
  getTradingDatesWithNews,
  getNewsByDate,
} from '../services/api'
import type { CandleData, TradingAccountStatus, Trade, DailyNews } from '../types'

export default function TradingSimulator() {
  const [symbol, setSymbol] = useState('AAPL')
  const [period, setPeriod] = useState('1mo')
  const [useDateRange, setUseDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [playbackId, setPlaybackId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [priceRange, setPriceRange] = useState<{ min_price: number; max_price: number } | undefined>()
  
  // Trading account state
  const [tradingAccountId, setTradingAccountId] = useState<string | null>(null)
  const [accountStatus, setAccountStatus] = useState<TradingAccountStatus | null>(null)
  const [isTrading, setIsTrading] = useState(false)
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  
  // News state
  const [newsEnabled, setNewsEnabled] = useState(false)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsProgress, setNewsProgress] = useState({ percent: 0, message: '' })
  const [newsMarkers, setNewsMarkers] = useState<Set<string>>(new Set())
  const [currentNewsList, setCurrentNewsList] = useState<DailyNews[]>([])
  const [showNewsModal, setShowNewsModal] = useState(false)

  // Technical indicators state
  const [showMA, setShowMA] = useState(false)
  const [maPeriods] = useState<number[]>([10, 20])
  const [showBB, setShowBB] = useState(false)

  const playIntervalRef = useRef<number | null>(null)

  // Initialize playback session
  const initializePlayback = async (withNews: boolean = false) => {
    setLoading(true)
    setError(null)
    setChartData([])
    setTradeHistory([]) // Clear trade history for new session
    setNewsEnabled(withNews)
    setNewsMarkers(new Set())
    setCurrentNewsList([])
    setShowNewsModal(false)
    
    try {
      const requestData: any = { symbol }
      
      if (useDateRange && startDate && endDate) {
        requestData.start_date = startDate
        requestData.end_date = endDate
        console.log('[initializePlayback] Using date range:', { startDate, endDate })
      } else {
        requestData.period = period
        console.log('[initializePlayback] Using period:', period)
      }
      
      console.log('[initializePlayback] Request data:', requestData)
      const response = await startPlayback(requestData)
      console.log('[initializePlayback] Response:', response)
      
      setPlaybackId(response.playback_id)
      setTotalCount(response.total_count)
      setCurrentIndex(response.current_index)
      setSessionKey(prev => prev + 1)
      setPriceRange(response.price_range)
      
      if (response.current_data) {
        setChartData([response.current_data])
      }

      // Create trading account automatically
      await initializeTradingAccount(response.playback_id)
      
      // Fetch news if enabled
      if (withNews && response.all_dates) {
        await initializeNews(requestData, response.all_dates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize playback')
      console.error('Playback initialization error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Initialize news data
  const initializeNews = async (requestData: any, tradingDates: string[]) => {
    setNewsLoading(true)
    setNewsProgress({ percent: 10, message: '準備獲取新聞...' })
    
    try {
      // Determine date range
      let start_date: string, end_date: string
      
      if (requestData.start_date && requestData.end_date) {
        start_date = requestData.start_date
        end_date = requestData.end_date
      } else {
        // Calculate date range from period
        const end = new Date()
        const start = new Date()
        
        switch (requestData.period) {
          case '1mo':
            start.setMonth(start.getMonth() - 1)
            break
          case '3mo':
            start.setMonth(start.getMonth() - 3)
            break
          case '6mo':
            start.setMonth(start.getMonth() - 6)
            break
          case '1y':
            start.setFullYear(start.getFullYear() - 1)
            break
        }
        
        start_date = start.toISOString().split('T')[0]
        end_date = end.toISOString().split('T')[0]
      }
      
      setNewsProgress({ percent: 30, message: '搜尋新聞中...' })
      
      // Fetch news (will use cache if available)
      const fetchResponse = await fetchNews({
        symbol,
        start_date,
        end_date,
        max_pages: 20,
        max_articles: 300
      })
      
      console.log('[initializeNews] Fetch response:', fetchResponse)
      
      setNewsProgress({ percent: 70, message: '載入新聞標記...' })
      
      console.log('[initializeNews] Trading dates:', tradingDates.length)
      
      // Get dates with news mapped to trading days
      const dates = await getTradingDatesWithNews(symbol, start_date, end_date, tradingDates)
      setNewsMarkers(new Set(dates))
      
      setNewsProgress({ percent: 100, message: '完成!' })
      
      console.log('[initializeNews] News markers (trading days):', dates)
      console.log('[initializeNews] Total news dates:', dates.length)
      
      setTimeout(() => {
        setNewsLoading(false)
        setNewsProgress({ percent: 0, message: '' })
      }, 500)
      
    } catch (err) {
      console.error('[initializeNews] Error:', err)
      setError('Failed to load news data')
      setNewsLoading(false)
      setNewsProgress({ percent: 0, message: '' })
    }
  }

  // Initialize trading account
  const initializeTradingAccount = async (playback_id: string) => {
    try {
      const response = await createTradingAccount({
        playback_id,
        symbol,
        initial_cash: 10000000, // $10,000,000 initial capital
      })
      
      setTradingAccountId(response.account_id)
      setAccountStatus(response.status)
      console.log('[initializeTradingAccount] Created account:', response.account_id)
    } catch (err) {
      console.error('Failed to create trading account:', err)
    }
  }

  // Handle buy operation
  const handleBuy = async () => {
    if (!tradingAccountId || !chartData.length || isTrading) return
    
    const currentCandle = chartData[chartData.length - 1]
    const currentPrice = currentCandle.close
    setIsTrading(true)
    
    try {
      const response = await executeBuy(tradingAccountId, { current_price: currentPrice })
      setAccountStatus(response.status)
      
      // Update the trade timestamp to match the current candle
      const updatedTrade = {
        ...response.trade,
        timestamp: currentCandle.timestamp
      }
      
      // Update trade history with corrected timestamp
      setTradeHistory(prev => [...prev, updatedTrade])
      
      console.log('[handleBuy] Trade executed:', response.message)
    } catch (err: any) {
      console.error('Buy operation failed:', err)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to execute buy'
      setError(errorMessage)
      console.error('Error details:', err?.response?.data)
    } finally {
      setIsTrading(false)
    }
  }

  // Handle sell operation
  const handleSell = async () => {
    if (!tradingAccountId || !chartData.length || isTrading) return
    
    const currentCandle = chartData[chartData.length - 1]
    const currentPrice = currentCandle.close
    setIsTrading(true)
    
    try {
      const response = await executeSell(tradingAccountId, { current_price: currentPrice })
      setAccountStatus(response.status)
      
      // Update the trade timestamp to match the current candle
      const updatedTrade = {
        ...response.trade,
        timestamp: currentCandle.timestamp
      }
      
      // Update trade history with corrected timestamp
      setTradeHistory(prev => [...prev, updatedTrade])
      
      console.log('[handleSell] Trade executed:', response.message)
    } catch (err: any) {
      console.error('Sell operation failed:', err)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to execute sell'
      setError(errorMessage)
      console.error('Error details:', err?.response?.data)
    } finally {
      setIsTrading(false)
    }
  }

  // Get next candle
  const getNext = useCallback(async () => {
    if (!playbackId) return
    
    try {
      const response = await getNextCandle(playbackId, 1)
      
      if (response.current_data) {
        const timestamp = new Date(response.current_data.timestamp).getTime()
        const newCandle = response.current_data
        
        setChartData(prev => {
          const lastTimestamp = prev.length > 0 
            ? new Date(prev[prev.length - 1].timestamp).getTime() 
            : 0
          
          if (timestamp !== lastTimestamp) {
            return [...prev, newCandle]
          }
          return prev
        })
        setCurrentIndex(response.current_index)
        
        // Update account status with new price if we have a position
        if (accountStatus?.position && tradingAccountId) {
          try {
            const status = await getTradingAccountStatus(tradingAccountId, newCandle.close)
            setAccountStatus(status)
          } catch (err) {
            console.error('Failed to update account status:', err)
          }
        }
        
        // Check for news on this date (if news enabled)
        if (newsEnabled) {
          const dateStr = new Date(newCandle.timestamp).toISOString().split('T')[0]
          console.log('[getNext] Checking news for date:', dateStr, 'Has marker:', newsMarkers.has(dateStr))
          
          if (newsMarkers.has(dateStr)) {
            // Pause playback
            setIsPlaying(false)
            
            // Fetch and show news
            try {
              console.log('[getNext] Fetching news for:', symbol, dateStr)
              const newsList = await getNewsByDate(symbol, dateStr)
              console.log('[getNext] News fetched:', newsList)
              
              if (newsList && newsList.length > 0) {
                setCurrentNewsList(newsList)
                setShowNewsModal(true)
              } else {
                console.warn('[getNext] No news returned for date:', dateStr)
              }
            } catch (err) {
              console.error('Failed to fetch news for date:', dateStr, err)
            }
          }
        }
        
        if (!response.has_more) {
          setIsPlaying(false)
        }
      }
    } catch (err) {
      console.error('Error getting next candle:', err)
      setIsPlaying(false)
    }
  }, [playbackId, accountStatus, tradingAccountId, newsEnabled, newsMarkers, symbol])

  // Playback controls
  const handlePlay = async () => {
    if (!playbackId) {
      await initializePlayback()
    }
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleNext = () => {
    getNext()
  }

  const handlePrevious = async () => {
    if (currentIndex <= 0 || !playbackId) return
    
    setIsPlaying(false)
    
    try {
      const newIndex = currentIndex - 1
      const response = await seekPlayback(playbackId, { index: newIndex })
      
      // Remove the last K-bar from chartData
      if (response.current_data) {
        setChartData(prev => prev.slice(0, -1))
        setCurrentIndex(response.current_index)
      }
    } catch (err) {
      console.error('Error going to previous:', err)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    initializePlayback(false)
  }
  
  const handleResetWithNews = () => {
    setIsPlaying(false)
    initializePlayback(true)
  }
  
  const handleCloseNews = () => {
    setShowNewsModal(false)
    setCurrentNewsList([])
  }
  
  const handleContinueFromNews = () => {
    setShowNewsModal(false)
    setCurrentNewsList([])
    // Don't auto-resume, let user click play
  }

  const handleSeek = async (index: number) => {
    if (!playbackId || index < 0 || index >= totalCount) return
    
    try {
      setIsPlaying(false)
      const response = await seekPlayback(playbackId, { index })
      
      // Rebuild chartData up to the new index
      if (response.current_data) {
        setChartData(prev => prev.slice(0, index + 1))
        setCurrentIndex(response.current_index)
      }
    } catch (err) {
      console.error('Error seeking:', err)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && playbackId) {
      const intervalDuration = 1000 / playbackSpeed // Calculate interval based on speed
      const interval = setInterval(() => {
        getNext()
      }, intervalDuration)
      playIntervalRef.current = interval
      
      return () => {
        clearInterval(interval)
      }
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }
  }, [isPlaying, playbackId, getNext, playbackSpeed])

  // Initialize on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    initializePlayback()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold neon-text text-cyber-primary tracking-wider">
          ⚡ CYBER TRADER ⚡
        </h1>
        <p className="text-cyber-secondary text-sm font-mono">
          LLM Stock Trader Training System v0.1.0
        </p>
        <div className="flex justify-center gap-2 text-xs font-mono">
          <span className="text-cyber-accent">SYSTEM:</span>
          <span className="text-cyber-success animate-pulse">ONLINE</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="cyber-panel p-6 space-y-4">
        <h2 className="text-2xl font-bold text-cyber-primary flex items-center gap-2">
          <span className="text-cyber-accent">►</span>
          SESSION CONFIG
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-cyber-primary text-sm font-mono">
              TICKER SYMBOL
            </label>
            <StockSearch
              value={symbol}
              onChange={setSymbol}
              placeholder="Enter stock code or Chinese name (e.g., 8033 or 雷虎)"
              className="cyber-input w-full font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-cyber-primary text-sm font-mono">
              TIME RANGE MODE
            </label>
            <select
              value={useDateRange ? 'custom' : 'period'}
              onChange={(e) => setUseDateRange(e.target.value === 'custom')}
              className="cyber-input w-full font-mono"
            >
              <option value="period">PERIOD</option>
              <option value="custom">CUSTOM DATE RANGE</option>
            </select>
          </div>
        </div>

        {!useDateRange ? (
          <div className="space-y-2">
            <label className="block text-cyber-primary text-sm font-mono">
              TIME PERIOD
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="cyber-input w-full font-mono"
            >
              <option value="1mo">1 MONTH</option>
              <option value="3mo">3 MONTHS</option>
              <option value="6mo">6 MONTHS</option>
              <option value="1y">1 YEAR</option>
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-cyber-primary text-sm font-mono">
                START DATE
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="cyber-input w-full font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-cyber-primary text-sm font-mono">
                END DATE
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="cyber-input w-full font-mono"
              />
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleReset}
            disabled={loading || newsLoading}
            className="cyber-button flex-1 px-8 py-3 font-mono font-bold"
          >
            {loading ? '⟳ LOADING...' : '▶ START NEW SESSION'}
          </button>
          
          <button
            onClick={handleResetWithNews}
            disabled={loading || newsLoading}
            className="cyber-button-secondary flex-1 px-8 py-3 font-mono font-bold"
          >
            {newsLoading ? '📰 LOADING NEWS...' : '📰 START WITH NEWS'}
          </button>
        </div>
        
        {/* News Loading Progress */}
        {newsLoading && (
          <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded p-4 space-y-2">
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-cyber-primary">{newsProgress.message}</span>
              <span className="text-cyber-accent">{newsProgress.percent}%</span>
            </div>
            <div className="w-full bg-cyber-bg rounded-full h-2 overflow-hidden">
              <div 
                className="bg-cyber-accent h-full transition-all duration-300"
                style={{ width: `${newsProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="cyber-panel p-4 border-cyber-danger bg-cyber-danger bg-opacity-10">
          <p className="text-cyber-danger font-mono text-sm">⚠ ERROR: {error}</p>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="space-y-4">
          {/* Technical Indicators Control Panel */}
          <div className="cyber-panel p-4">
            <h3 className="text-lg font-bold text-cyber-primary mb-3 flex items-center gap-2">
              <span className="text-cyber-accent">►</span>
              TECHNICAL INDICATORS
            </h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMA}
                  onChange={(e) => setShowMA(e.target.checked)}
                  className="w-4 h-4 accent-cyber-accent"
                />
                <span className="font-mono text-sm text-cyber-secondary">
                  Moving Averages (MA 10, 20)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBB}
                  onChange={(e) => setShowBB(e.target.checked)}
                  className="w-4 h-4 accent-cyber-accent"
                />
                <span className="font-mono text-sm text-cyber-secondary">
                  Bollinger Bands
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart Section */}
            <div className="lg:col-span-2">
              <div className="cyber-panel p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-cyber-primary font-mono">
                    CHART: {symbol}
                  </h3>
                  <div className="text-cyber-secondary text-sm font-mono">
                    {chartData.length} BARS LOADED
                  </div>
                </div>
                <CandlestickChart
                  key={sessionKey}
                  data={chartData}
                  height={500}
                  priceRange={priceRange}
                  totalCount={totalCount}
                  trades={tradeHistory}
                  newsMarkers={newsMarkers}
                  showMA={showMA}
                  maPeriods={maPeriods}
                  showBB={showBB}
                />
              </div>
            </div>

            {/* Trading Panel Section */}
            <div className="lg:col-span-1">
              <TradingPanel
                accountStatus={accountStatus}
                currentPrice={chartData.length > 0 ? chartData[chartData.length - 1].close : null}
                onBuy={handleBuy}
                onSell={handleSell}
                isLoading={isTrading}
              />
            </div>
          </div>

          {/* Playback Controls */}
          <PlaybackControls
            isPlaying={isPlaying}
            currentIndex={currentIndex}
            totalCount={totalCount}
            playbackSpeed={playbackSpeed}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onReset={handleReset}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
          />

          {/* Trade Journal and Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TradeJournal trades={tradeHistory} />
            <PerformanceAnalysis trades={tradeHistory} accountStatus={accountStatus} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-cyber-primary text-xs font-mono opacity-50">
        <p>POWERED BY NEURAL NETWORKS • DATA STREAM ACTIVE</p>
      </div>
      
      {/* News Modal */}
      {showNewsModal && currentNewsList.length > 0 && (
        <NewsModal
          news={currentNewsList[0]}
          allNews={currentNewsList}
          onClose={handleCloseNews}
          onContinue={handleContinueFromNews}
        />
      )}
    </div>
  )
}
