import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientList } from './ClientList'
import { ClientDialog } from './ClientDialog'
import { ClientDetailsView } from './ClientDetailsView'
import type { Client } from '@/hooks/useClients'

export function ClientsView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // If a client is selected, show details view
  if (selectedClient) {
    return (
      <ClientDetailsView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onEdit={() => {
          // Edit is handled within ClientDetailsView
        }}
      />
    )
  }

  // Otherwise show list view
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Clients</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAddClientOpen(true)}
            className="h-11 w-11 hover:bg-transparent"
          >
            <Plus className="h-8 w-8 text-primary" strokeWidth={2.5} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto">
        <ClientList 
          searchQuery={searchQuery}
          onClientClick={setSelectedClient}
        />
      </div>

      {/* Add Client Dialog */}
      <ClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        mode="create"
      />
    </div>
  )
}

