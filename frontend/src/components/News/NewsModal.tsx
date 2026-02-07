import { DailyNews } from '../../types'

interface NewsModalProps {
  news: DailyNews
  allNews?: DailyNews[] // Optional: all news items for this date range
  onClose: () => void
  onContinue: () => void
}

export default function NewsModal({ news, allNews = [], onClose, onContinue }: NewsModalProps) {
  console.log('[NewsModal] Rendering with news:', news)
  console.log('[NewsModal] All news count:', allNews.length)
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="cyber-panel max-w-2xl w-full p-6 space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyber-accent pb-4">
          <h2 className="text-2xl font-bold text-cyber-primary flex items-center gap-2">
            <span className="text-cyber-accent">📰</span>
            NEWS ALERT
          </h2>
          <button
            onClick={onClose}
            className="text-cyber-secondary hover:text-cyber-primary transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-cyber-accent font-mono text-sm">
          <span>📅</span>
          <span>{news.date}</span>
          {allNews.length > 1 && (
            <span className="text-cyber-secondary">
              (含 {allNews.length - 1} 天前新聞)
            </span>
          )}
        </div>

        {/* News Content */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allNews.length > 0 ? allNews.map((newsItem, index) => (
            <div key={index} className="bg-cyber-bg/50 border border-cyber-accent/30 rounded p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-cyber-success text-xl">►</span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-cyber-secondary font-mono">
                    <span>{newsItem.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-cyber-primary">
                    {newsItem.primary_title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-cyber-secondary">來源:</span>
                    <span className="text-cyber-accent font-mono">{newsItem.primary_source}</span>
                  </div>
                </div>
              </div>
              
              {newsItem.related_count > 0 && (
                <div className="pl-8 pt-2 border-t border-cyber-accent/20">
                  <p className="text-cyber-secondary text-sm font-mono">
                    其他相關報導 ({newsItem.related_count})
                  </p>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-cyber-bg/50 border border-cyber-accent/30 rounded p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-cyber-success text-xl">►</span>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-cyber-primary">
                    {news.primary_title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-cyber-secondary">來源:</span>
                    <span className="text-cyber-accent font-mono">{news.primary_source}</span>
                  </div>
                </div>
              </div>
              
              {news.related_count > 0 && (
                <div className="pl-8 pt-2 border-t border-cyber-accent/20">
                  <p className="text-cyber-secondary text-sm font-mono">
                    其他相關報導 ({news.related_count})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Message */}
        <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded p-4">
          <p className="text-cyber-primary text-sm font-mono">
            <span className="text-cyber-accent">⚠</span> 交易已暫停。請閱讀新聞後繼續播放。
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="cyber-button flex-1 px-6 py-3 font-mono font-bold"
          >
            ▶ CONTINUE PLAYBACK
          </button>
        </div>
      </div>
    </div>
  )
}
