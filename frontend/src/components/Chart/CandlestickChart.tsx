import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import type { CandleData, Trade } from '../../types'

interface CandlestickChartProps {
  data: CandleData[]
  height?: number
  priceRange?: {
    min_price: number
    max_price: number
  }
  totalCount?: number
  trades?: Trade[]
  newsMarkers?: Set<string> // Set of dates (YYYY-MM-DD) with news
  // Indicator display controls
  showMA?: boolean
  maPeriods?: number[]
  showBB?: boolean
}

export default function CandlestickChart({
  data,
  height = 400,
  priceRange,
  totalCount,
  trades = [],
  newsMarkers = new Set(),
  showMA = false,
  maPeriods = [10, 20],
  showBB = false,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const currentPriceRangeRef = useRef<{ min: number; max: number } | null>(null)
  const maSeriesRef = useRef<Map<number, ISeriesApi<'Line'>>>(new Map())
  const bbSeriesRef = useRef<{
    upper: ISeriesApi<'Line'> | null
    middle: ISeriesApi<'Line'> | null
    lower: ISeriesApi<'Line'> | null
  }>({ upper: null, middle: null, lower: null })

  // Initialize chart only once
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart with default settings
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#0a0e27' },
        textColor: '#00ffff',
      },
      grid: {
        vertLines: { color: '#2d3561' },
        horzLines: { color: '#2d3561' },
      },
      rightPriceScale: {
        borderColor: '#2d3561',
      },
      timeScale: {
        borderColor: '#2d3561',
        timeVisible: true,
        barSpacing: 10,
        minBarSpacing: 0.5,
        rightOffset: 5,
      },
    })

    chartRef.current = chart

    // Add candlestick series with custom colors (紅漲綠跌 - 台灣/亞洲風格)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ff0055',        // 上漲紅色
      downColor: '#00ff00',      // 下跌綠色
      borderUpColor: '#ff0055',
      borderDownColor: '#00ff00',
      wickUpColor: '#ff0055',
      wickDownColor: '#00ff00',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    candlestickSeriesRef.current = candlestickSeries

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    volumeSeriesRef.current = volumeSeries

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [height])

  // Update data when it changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !data.length) return

    // Calculate price range - use provided range if available, otherwise calculate from data
    let minPrice: number
    let maxPrice: number
    
    if (priceRange) {
      // Use the price range from backend (all data)
      minPrice = priceRange.min_price
      maxPrice = priceRange.max_price
    } else {
      // Fallback: calculate from current data
      const allHighs = data.map(d => d.high)
      const allLows = data.map(d => d.low)
      minPrice = Math.min(...allLows)
      maxPrice = Math.max(...allHighs)
    }
    
    const priceRangeValue = maxPrice - minPrice
    const padding = priceRangeValue * 0.1 // 10% padding

    // Store current price range
    currentPriceRangeRef.current = { min: minPrice, max: maxPrice }

    // Transform data - show all data
    const visibleData = data.map((item) => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))

    candlestickSeriesRef.current.setData(visibleData)

    // Combine trade markers and news markers
    const allMarkers = []
    
    // Add trade markers
    if (trades && trades.length > 0) {
      const tradeMarkers = trades.map(trade => ({
        time: (new Date(trade.timestamp).getTime() / 1000) as Time,
        position: trade.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
        color: trade.type === 'buy' ? '#ff0055' : '#00ff00', // Red for buy, green for sell (Taiwan style)
        shape: trade.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
        text: `${trade.type.toUpperCase()} ${trade.shares}@${trade.price.toFixed(2)}`,
      }))
      allMarkers.push(...tradeMarkers)
    }
    
    // Add news markers
    if (newsMarkers.size > 0) {
      data.forEach(item => {
        const dateStr = new Date(item.timestamp).toISOString().split('T')[0]
        if (newsMarkers.has(dateStr)) {
          allMarkers.push({
            time: (new Date(item.timestamp).getTime() / 1000) as Time,
            position: 'aboveBar' as const,
            color: '#ffff00', // Yellow for news
            shape: 'circle' as const,
            text: '📰',
          })
        }
      })
    }
    
    if (allMarkers.length > 0) {
      // Sort markers by time to avoid overlapping issues
      allMarkers.sort((a, b) => (a.time as number) - (b.time as number))
      candlestickSeriesRef.current.setMarkers(allMarkers)
    } else {
      candlestickSeriesRef.current.setMarkers([])
    }

    // Update volume - show all data (紅漲綠跌)
    const visibleVolumeData = data.map((item) => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      value: item.volume,
      color: item.close >= item.open ? 'rgba(255, 0, 85, 0.5)' : 'rgba(0, 255, 0, 0.5)', // 上漲紅色，下跌綠色
    }))

    volumeSeriesRef.current.setData(visibleVolumeData)

    // Set fixed price range based on all data
    if (chartRef.current) {
      // Always use autoscaleInfoProvider with current data range
      candlestickSeriesRef.current.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: minPrice - padding,
            maxValue: maxPrice + padding,
          },
          margins: {
            above: 10,
            below: 10,
          },
        }),
      })

      // Calculate bar spacing based on fixed 70 bars capacity
      if (chartContainerRef.current) {
        const chartWidth = chartContainerRef.current.clientWidth
        const effectiveWidth = chartWidth - 100 // Reserve for axis
        const targetBarCount = 70 // Fixed: optimal size to show 70 bars
        const calculatedBarSpacing = Math.max(2, Math.floor(effectiveWidth / targetBarCount))
        
        chartRef.current.timeScale().applyOptions({
          barSpacing: calculatedBarSpacing,
        })
      }

      // Fit all content without scrolling
      const timeScale = chartRef.current.timeScale()
      timeScale.fitContent()
    }
  }, [data, priceRange, totalCount, trades, newsMarkers])

  // Handle MA and BB indicators
  useEffect(() => {
    if (!chartRef.current || !data.length) return

    // MA colors
    const maColors: Record<number, string> = {
      10: '#ffff00', // Yellow
      20: '#00ffff', // Cyan
      50: '#ff00ff', // Magenta
    }

    // Add/update MA lines
    if (showMA && maPeriods.length > 0) {
      maPeriods.forEach((period) => {
        // Remove existing series if it exists
        const existingSeries = maSeriesRef.current.get(period)
        if (existingSeries) {
          chartRef.current!.removeSeries(existingSeries)
        }

        // Create new MA series
        const maSeries = chartRef.current!.addLineSeries({
          color: maColors[period] || '#888888',
          lineWidth: 2,
          title: `MA${period}`,
        })

        // Prepare MA data
        const maData = data
          .filter((item) => item[`ma_${period}` as keyof CandleData] !== undefined &&
item[`ma_${period}` as keyof CandleData] !== null)
          .map((item) => ({
            time: (new Date(item.timestamp).getTime() / 1000) as Time,
            value: item[`ma_${period}` as keyof CandleData] as number,
          }))

        if (maData.length > 0) {
          maSeries.setData(maData)
          maSeriesRef.current.set(period, maSeries)
        }
      })
    } else {
      // Remove all MA series if showMA is false
      maSeriesRef.current.forEach((series) => {
        chartRef.current!.removeSeries(series)
      })
      maSeriesRef.current.clear()
    }

    // Add/update BB lines
    if (showBB) {
      // Remove existing BB series if they exist
      if (bbSeriesRef.current.upper) {
        chartRef.current!.removeSeries(bbSeriesRef.current.upper)
      }
      if (bbSeriesRef.current.middle) {
        chartRef.current!.removeSeries(bbSeriesRef.current.middle)
      }
      if (bbSeriesRef.current.lower) {
        chartRef.current!.removeSeries(bbSeriesRef.current.lower)
      }

      // Create BB upper band
      const bbUpperSeries = chartRef.current!.addLineSeries({
        color: '#ff5722',
        lineWidth: 1,
        lineStyle: 2, // dashed
        title: 'BB Upper',
      })

      const bbUpperData = data
        .filter((item) => item.bb_upper !== undefined && item.bb_upper !== null)
        .map((item) => ({
          time: (new Date(item.timestamp).getTime() / 1000) as Time,
          value: item.bb_upper!,
        }))

      if (bbUpperData.length > 0) {
        bbUpperSeries.setData(bbUpperData)
        bbSeriesRef.current.upper = bbUpperSeries
      }

      // Create BB middle band
      const bbMiddleSeries = chartRef.current!.addLineSeries({
        color: '#ffc107',
        lineWidth: 1,
        title: 'BB Middle',
      })

      const bbMiddleData = data
        .filter((item) => item.bb_middle !== undefined && item.bb_middle !== null)
        .map((item) => ({
          time: (new Date(item.timestamp).getTime() / 1000) as Time,
          value: item.bb_middle!,
        }))

      if (bbMiddleData.length > 0) {
        bbMiddleSeries.setData(bbMiddleData)
        bbSeriesRef.current.middle = bbMiddleSeries
      }

      // Create BB lower band
      const bbLowerSeries = chartRef.current!.addLineSeries({
        color: '#ff5722',
        lineWidth: 1,
        lineStyle: 2, // dashed
        title: 'BB Lower',
      })

      const bbLowerData = data
        .filter((item) => item.bb_lower !== undefined && item.bb_lower !== null)
        .map((item) => ({
          time: (new Date(item.timestamp).getTime() / 1000) as Time,
          value: item.bb_lower!,
        }))

      if (bbLowerData.length > 0) {
        bbLowerSeries.setData(bbLowerData)
        bbSeriesRef.current.lower = bbLowerSeries
      }
    } else {
      // Remove BB series if showBB is false
      if (bbSeriesRef.current.upper) {
        chartRef.current!.removeSeries(bbSeriesRef.current.upper)
        bbSeriesRef.current.upper = null
      }
      if (bbSeriesRef.current.middle) {
        chartRef.current!.removeSeries(bbSeriesRef.current.middle)
        bbSeriesRef.current.middle = null
      }
      if (bbSeriesRef.current.lower) {
        chartRef.current!.removeSeries(bbSeriesRef.current.lower)
        bbSeriesRef.current.lower = null
      }
    }
  }, [data, showMA, maPeriods, showBB])

  return (
    <div className="cyber-panel p-4">
      <div
        ref={chartContainerRef}
        className="rounded-lg border border-cyber-primary overflow-hidden shadow-cyber"
      />
    </div>
  )
}
