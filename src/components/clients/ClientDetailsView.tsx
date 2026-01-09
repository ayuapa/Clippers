import { useState, useMemo } from 'react'
import { ArrowLeft, Phone, Mail, MapPin, User, Dog, BookmarkIcon, Calendar, Download, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PetDialog } from './PetDialog'
import { ClientDialog } from './ClientDialog'
import { usePets } from '@/hooks/usePets'
import { useAppointments } from '@/hooks/useAppointments'
import { useSoftDeleteClient, useHardDeleteClient } from '@/hooks/useClients'
import { useToast } from '@/hooks/use-toast'
import { formatInTimeZone } from 'date-fns-tz'
import type { Client } from '@/hooks/useClients'

interface ClientDetailsViewProps {
  client: Client
  onBack: () => void
}

export function ClientDetailsView({ client, onBack }: ClientDetailsViewProps) {
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [historyView, setHistoryView] = useState<'upcoming' | 'previous'>('upcoming')
  const [showSoftDeleteDialog, setShowSoftDeleteDialog] = useState(false)
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false)
  
  const { data: pets = [], isLoading: petsLoading } = usePets(client.id)
  const { data: allAppointments = [] } = useAppointments()
  const softDeleteClient = useSoftDeleteClient()
  const hardDeleteClient = useHardDeleteClient()
  const { toast } = useToast()
  
  // Filter and split appointments for this client
  const { upcomingAppointments, previousAppointments, incompleteCount } = useMemo(() => {
    const now = new Date()
    const clientAppointments = allAppointments.filter((apt) => apt.client_id === client.id)
    
    const upcoming = clientAppointments
      .filter((apt) => new Date(apt.start_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    
    const previous = clientAppointments
      .filter((apt) => new Date(apt.start_time) < now)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    
    const incomplete = clientAppointments.filter((apt) => apt.status !== 'completed')
    
    return { upcomingAppointments: upcoming, previousAppointments: previous, incompleteCount: incomplete.length }
  }, [allAppointments, client.id])

  // Save contact to phone
  const saveToContacts = () => {
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${client.first_name} ${client.last_name}`,
      `N:${client.last_name};${client.first_name};;;`,
      `TEL;TYPE=CELL:${client.phone}`,
      client.email ? `EMAIL:${client.email}` : '',
      `ADR;TYPE=HOME:;;${client.address};${client.suburb};;${client.postcode};Australia`,
      'END:VCARD'
    ].filter(Boolean).join('\n')
    
    const blob = new Blob([vCardData], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${client.first_name}-${client.last_name}.vcf`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Handle soft delete
  const handleSoftDelete = async () => {
    try {
      await softDeleteClient.mutateAsync(client.id)
      toast({
        title: 'Client Deactivated',
        description: `${client.first_name} ${client.last_name} has been marked as inactive.${incompleteCount > 0 ? ` ${incompleteCount} incomplete appointment(s) deleted.` : ''}`,
      })
      onBack()
    } catch (error) {
      console.error('Failed to deactivate client:', error)
      toast({
        title: 'Error',
        description: 'Failed to deactivate client. Please try again.',
      })
    }
  }

  // Handle hard delete
  const handleHardDelete = async () => {
    try {
      await hardDeleteClient.mutateAsync(client.id)
      toast({
        title: 'Client Deleted',
        description: `${client.first_name} ${client.last_name} has been permanently deleted.`,
      })
      onBack()
    } catch (error) {
      console.error('Failed to delete client:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">
            {client.first_name} {client.last_name}
          </h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditClientOpen(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-white px-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="flex-1 overflow-y-auto">
          {/* Customer Info */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</div>
                <div className="font-medium text-gray-900">
                  {client.first_name} {client.last_name}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                <a href={`tel:${client.phone}`} className="font-medium text-primary hover:underline">
                  {client.phone}
                </a>
              </div>
            </div>

            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</div>
                  <a href={`mailto:${client.email}`} className="font-medium text-primary hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</div>
                <div className="font-medium text-gray-900">
                  {client.address}<br />
                  {client.suburb}, {client.postcode}
                </div>
              </div>
            </div>

            {/* Save to Contacts Button */}
            <Button
              onClick={saveToContacts}
              variant="outline"
              className="w-full mt-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Save to Contacts
            </Button>
          </div>

          {/* Divider */}
          <div className="h-2 bg-gray-100"></div>

          {/* Pets Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Pets ({pets.length})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPetDialogOpen(true)}
                className="h-8"
              >
                <Dog className="h-4 w-4 mr-1" />
                Add Pet
              </Button>
            </div>

            {petsLoading ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Loading pets...</p>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Dog className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No pets yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    {/* Dog icon + Name | Breed */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐕</span>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{pet.name}</span>
                        {pet.breed && (
                          <>
                            <span className="text-gray-400 mx-1.5">|</span>
                            <span className="text-gray-700">{pet.breed}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Temperament (no label) */}
                    {pet.temperament && (
                      <div className="text-xs text-gray-600 mt-1.5">
                        {pet.temperament}
                      </div>
                    )}
                    
                    {/* Medical Notes */}
                    {pet.medical_notes && (
                      <div className="text-xs text-gray-600 mt-1.5 pt-1.5 border-t border-gray-100">
                        <span className="font-medium">Medical:</span> {pet.medical_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Delete Section */}
            <div className="p-4 pt-6 border-t border-gray-200 mt-4">
              {client.is_active ? (
                <Button
                  onClick={() => setShowSoftDeleteDialog(true)}
                  variant="outline"
                  className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate Client
                </Button>
              ) : (
                <Button
                  onClick={() => setShowHardDeleteDialog(true)}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-y-auto">
          {/* Pill-shaped Toggle */}
          <div className="p-4 pb-3">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setHistoryView('upcoming')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  historyView === 'upcoming'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setHistoryView('previous')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  historyView === 'previous'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Previous
              </button>
            </div>
          </div>

          {/* Appointments List */}
          <div className="px-4 pb-4">
            {historyView === 'upcoming' ? (
              upcomingAppointments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No upcoming appointments</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {upcomingAppointments.slice(0, 4).map((apt) => {
                      const startTime = new Date(apt.start_time)
                      const timeString = formatInTimeZone(startTime, 'Australia/Sydney', 'h:mm a')
                      const dateString = formatInTimeZone(startTime, 'Australia/Sydney', 'd MMM yyyy')
                      
                      return (
                        <div
                          key={apt.id}
                          className="border-l-4 border-blue-500 bg-white rounded-lg shadow-sm pl-3 pr-3 py-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{apt.service_name}</div>
                              <div className="text-sm text-gray-600 mt-0.5">{apt.pet_name}</div>
                            </div>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded ${
                                apt.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {apt.status === 'scheduled' ? 'Confirmed' : apt.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-gray-500">
                              {dateString} at {timeString}
                            </div>
                            <div className="font-semibold text-gray-900">${apt.price.toFixed(2)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {upcomingAppointments.length > 4 && (
                    <button className="text-sm text-primary font-medium mt-3 hover:underline">
                      View all ({upcomingAppointments.length})
                    </button>
                  )}
                </>
              )
            ) : (
              previousAppointments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <BookmarkIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No previous appointments</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {previousAppointments.slice(0, 4).map((apt) => {
                      const startTime = new Date(apt.start_time)
                      const timeString = formatInTimeZone(startTime, 'Australia/Sydney', 'h:mm a')
                      const dateString = formatInTimeZone(startTime, 'Australia/Sydney', 'd MMM yyyy')
                      
                      return (
                        <div
                          key={apt.id}
                          className="border-l-4 border-gray-300 bg-white rounded-lg shadow-sm pl-3 pr-3 py-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{apt.service_name}</div>
                              <div className="text-sm text-gray-600 mt-0.5">{apt.pet_name}</div>
                            </div>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded ${
                                apt.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {apt.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-gray-500">
                              {dateString} at {timeString}
                            </div>
                            <div className="font-semibold text-gray-900">${apt.price.toFixed(2)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {previousAppointments.length > 4 && (
                    <button className="text-sm text-primary font-medium mt-3 hover:underline">
                      View all ({previousAppointments.length})
                    </button>
                  )}
                </>
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pet Dialog */}
      <PetDialog
        open={isPetDialogOpen}
        onOpenChange={setIsPetDialogOpen}
        mode="create"
        clientId={client.id}
      />

      {/* Edit Client Dialog */}
      <ClientDialog
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        mode="edit"
        clientId={client.id}
      />

      {/* Soft Delete Confirmation Dialog */}
      <AlertDialog open={showSoftDeleteDialog} onOpenChange={setShowSoftDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Deactivate Client?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to deactivate <strong>{client.first_name} {client.last_name}</strong>?
              </p>
              {incompleteCount > 0 && (
                <p className="text-orange-600 font-medium">
                  ⚠️ This will delete {incompleteCount} incomplete appointment{incompleteCount !== 1 ? 's' : ''}.
                </p>
              )}
              <p className="text-sm text-gray-500">
                The client will be marked as inactive and appear greyed out in the client list. Completed appointments will remain.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSoftDelete}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Client?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to <strong className="text-red-600">permanently delete</strong> <strong>{client.first_name} {client.last_name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                <p className="text-red-700 font-medium text-sm">⚠️ This action cannot be undone!</p>
                {incompleteCount > 0 && (
                  <p className="text-red-600 text-sm">
                    • {incompleteCount} incomplete appointment{incompleteCount !== 1 ? 's' : ''} will be deleted
                  </p>
                )}
                <p className="text-red-600 text-sm">• {pets.length} pet{pets.length !== 1 ? 's' : ''} will be deleted</p>
                <p className="text-gray-600 text-sm">• Completed appointments will remain in history</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

