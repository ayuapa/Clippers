import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, Plus, Check } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { ClientDialog } from '@/components/clients/ClientDialog'

interface ClientSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentClientId: string
  onClientSelect: (clientId: string) => void
}

export function ClientSelectorDialog({
  open,
  onOpenChange,
  currentClientId,
  onClientSelect,
}: ClientSelectorDialogProps) {
  const { data: clients = [] } = useClients()
  const [searchQuery, setSearchQuery] = useState('')
  const [showClientDialog, setShowClientDialog] = useState(false)

  // Filter active clients only
  const activeClients = clients.filter(c => c.is_active !== false)

  // Filter clients based on search
  const filteredClients = activeClients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold">Select Client</DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No clients found</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = client.id === currentClientId
                  return (
                    <button
                      key={client.id}
                      onClick={() => {
                        onClientSelect(client.id)
                      }}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg transition-colors
                        ${
                          isSelected
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'border-2 border-transparent hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                        {client.suburb && (
                          <p className="text-xs text-gray-400">{client.suburb}</p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            <Button
              onClick={() => {
                setShowClientDialog(true)
              }}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Client
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Client Dialog */}
      <ClientDialog
        mode="create"
        open={showClientDialog}
        onOpenChange={(open) => {
          setShowClientDialog(open)
          // If closed and a client was added, we'll pick it up from the clients list refresh
        }}
      />
    </>
  )
}
