import TradingSimulator from './pages/TradingSimulator'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-cyber-bg">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none" 
           style={{ backgroundSize: '40px 40px' }} />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none opacity-10" />
      
      {/* Main Content */}
      <div className="relative z-10">
        <TradingSimulator />
      </div>
    </div>
  )
}

export default App
