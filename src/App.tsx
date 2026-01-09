import { useState } from 'react'
import { ScheduleView } from './components/schedule/ScheduleView'
import { ClientsView } from './components/clients/ClientsView'
import { MoreView } from './components/more/MoreView'
import { BottomNav } from './components/navigation/BottomNav'
import { Toaster } from './components/ui/toaster'

type View = 'schedule' | 'clients' | 'more'

function App() {
  const [currentView, setCurrentView] = useState<View>('schedule')

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'schedule' && <ScheduleView />}
        {currentView === 'clients' && <ClientsView />}
        {currentView === 'more' && <MoreView />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

export default App

