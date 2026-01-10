import { useState } from 'react'
import { Settings, Scissors, DollarSign, Bell, HelpCircle, ChevronLeft, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServicesView } from '@/components/services/ServicesView'
import { ItemsView } from '@/components/items/ItemsView'

type SubView = 'menu' | 'services' | 'items' | 'payments' | 'notifications' | 'settings' | 'help'

export function MoreView() {
  const [currentSubView, setCurrentSubView] = useState<SubView>('menu')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const menuItems = [
    { id: 'services' as const, label: 'Services', icon: Scissors },
    { id: 'items' as const, label: 'Items & Discount', icon: Package },
    { id: 'payments' as const, label: 'Payment History', icon: DollarSign },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'help' as const, label: 'Help & Support', icon: HelpCircle },
  ]

  // Show the Services view
  if (currentSubView === 'services') {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCurrentSubView('menu')}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Services</h1>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Add service"
          >
            <Plus className="h-6 w-6 text-primary" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ServicesView 
            showAddDialog={showAddDialog}
            onAddDialogChange={setShowAddDialog}
          />
        </div>
      </div>
    )
  }

  // Show the Items & Discount view
  if (currentSubView === 'items') {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCurrentSubView('menu')}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Items & Discount</h1>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Add item or discount"
          >
            <Plus className="h-6 w-6 text-primary" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ItemsView 
            showAddDialog={showAddDialog}
            onAddDialogChange={setShowAddDialog}
          />
        </div>
      </div>
    )
  }

  // Show placeholder for other views
  if (currentSubView !== 'menu') {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCurrentSubView('menu')}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold capitalize">{currentSubView}</h1>
        </div>
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Coming Soon</p>
        </div>
      </div>
    )
  }

  // Default: Show menu
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-xl font-bold">More</h1>
      </div>

      {/* Menu Items */}
      <div className="divide-y divide-gray-100">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setCurrentSubView(item.id)}
              className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors active:bg-gray-100 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-gray-900">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* App Info */}
      <div className="mt-auto p-4 text-center text-sm text-gray-500">
        <p>Maya Pet Grooming Pro</p>
        <p className="mt-1">Version 0.1.0 (MVP)</p>
      </div>
    </div>
  )
}

