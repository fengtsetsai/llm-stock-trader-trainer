import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react'

interface PlaybackControlsProps {
  isPlaying: boolean
  currentIndex: number
  totalCount: number
  playbackSpeed: number
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
  onReset: () => void
  onSeek: (index: number) => void
  onSpeedChange: (speed: number) => void
}

export default function PlaybackControls({
  isPlaying,
  currentIndex,
  totalCount,
  playbackSpeed,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onReset,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) {
  const progress = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value)
    onSeek(index)
  }

  return (
    <div className="cyber-panel p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold neon-text text-cyber-primary">
          ▶ PLAYBACK CONTROL
        </h3>
        <div className="text-cyber-primary font-mono text-sm">
          {currentIndex} / {totalCount}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-2 bg-cyber-bg rounded-full overflow-hidden border border-cyber-primary">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyber-primary to-cyber-secondary transition-all duration-300 shadow-cyber"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <input
          type="range"
          min="0"
          max={Math.max(0, totalCount - 1)}
          value={currentIndex}
          onChange={handleSliderChange}
          disabled={totalCount === 0}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-transparent
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-primary 
                     [&::-webkit-slider-thumb]:shadow-cyber [&::-webkit-slider-thumb]:cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onReset}
          disabled={totalCount === 0}
          className="cyber-button p-3 rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={onPrevious}
          disabled={currentIndex === 0 || totalCount === 0}
          className="cyber-button p-3 rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Previous"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={totalCount === 0}
          className={`p-4 rounded-full hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            isPlaying ? 'cyber-button-secondary animate-pulse' : 'cyber-button'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalCount - 1 || totalCount === 0}
          className="cyber-button p-3 rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Next"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-cyber-primary text-sm font-mono">SPEED:</span>
        <div className="flex gap-2">
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              disabled={totalCount === 0}
              className={`px-3 py-1 rounded font-mono text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                playbackSpeed === speed
                  ? 'bg-cyber-primary text-cyber-bg font-bold shadow-cyber'
                  : 'border border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-cyber-bg'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="text-center text-cyber-primary text-sm font-mono">
        {isPlaying ? (
          <span className="animate-pulse">► PLAYING @ {playbackSpeed}x...</span>
        ) : (
          <span>|| PAUSED</span>
        )}
      </div>
    </div>
  )
}
