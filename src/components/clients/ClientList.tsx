import { Phone, MapPin } from 'lucide-react'
import { useClients, type Client } from '@/hooks/useClients'

interface ClientListProps {
  searchQuery: string
  onClientClick: (client: Client) => void
}

export function ClientList({ searchQuery, onClientClick }: ClientListProps) {
  const { data: clients, isLoading } = useClients()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading clients...</div>
      </div>
    )
  }

  // Filter clients based on search query
  const filteredClients = (clients || []).filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return (
      fullName.includes(query) ||
      client.phone.includes(query) ||
      client.suburb.toLowerCase().includes(query)
    )
  })

  if (filteredClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <p className="text-center">
          {searchQuery ? 'No clients found' : 'No clients yet'}
        </p>
        <p className="text-sm text-center mt-2">
          {searchQuery ? 'Try a different search' : 'Add your first client to get started'}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {filteredClients.map((client) => {
        const isInactive = !client.is_active
        return (
          <button
            key={client.id}
            onClick={() => onClientClick(client)}
            className={`w-full text-left px-4 py-4 transition-colors ${
              isInactive
                ? 'bg-gray-100 hover:bg-gray-150 opacity-60'
                : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base ${isInactive ? 'text-gray-500' : 'text-gray-900'}`}>
                  {isInactive && '** '}
                  {client.first_name} {client.last_name}
                </h3>
                <div className={`flex items-center gap-4 mt-2 text-sm ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{client.suburb}</span>
                  </div>
                </div>
                {isInactive && (
                  <div className="mt-1 text-xs text-red-500 font-medium">Inactive</div>
                )}
              </div>
              <div className={`ml-4 text-sm ${isInactive ? 'text-gray-400' : 'text-gray-500'}`}>
                {client.petCount} {client.petCount === 1 ? 'pet' : 'pets'}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

