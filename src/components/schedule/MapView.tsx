import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { ExternalLink, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppointments } from '@/hooks/useAppointments'
import { useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'

interface MapViewProps {
  selectedDate: Date
  filterType: 'all' | 'confirmed' | 'completed'
}

export function MapView({ selectedDate, filterType }: MapViewProps) {
  const googleMapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
  
  // Fetch appointments for the selected date
  const { data: allAppointments = [], isLoading } = useAppointments(selectedDate)

  // Filter appointments based on filterType
  const filteredAppointments = useMemo(() => {
    if (filterType === 'confirmed') {
      return allAppointments.filter(apt => apt.status === 'scheduled') // scheduled = confirmed
    } else if (filterType === 'completed') {
      return allAppointments.filter(apt => apt.status === 'completed')
    }
    return allAppointments
  }, [allAppointments, filterType])

  // Transform appointments for map display (only include those with location data)
  // Note: Requires clients table to have latitude, longitude, address, suburb fields
  const appointments = useMemo(() => {
    return filteredAppointments
      .filter(apt => {
        const client = apt.clients as any
        return client?.latitude && client?.longitude
      })
      .map(apt => {
        const startTime = new Date(apt.start_time)
        const timeString = formatInTimeZone(startTime, 'Australia/Sydney', 'h:mm a')
        const client = apt.clients as any
        
        return {
          id: apt.id,
          client_name: apt.client_name || 'Unknown Client',
          address: client?.address || '',
          suburb: client?.suburb || '',
          latitude: client.latitude,
          longitude: client.longitude,
          time: timeString,
          service: apt.service_name || '',
          color: '#9333ea', // Purple theme
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time)) // Sort by time
  }, [filteredAppointments])

  // Calculate center of all appointments
  const center =
    appointments.length > 0
      ? {
          lat:
            appointments.reduce((sum, apt) => sum + apt.latitude, 0) / appointments.length,
          lng:
            appointments.reduce((sum, apt) => sum + apt.longitude, 0) / appointments.length,
        }
      : { lat: -33.8688, lng: 151.2093 } // Sydney default

  const openInGoogleMaps = () => {
    if (appointments.length === 0) return

    // Create waypoints URL for Google Maps
    const origin = `${appointments[0].latitude},${appointments[0].longitude}`
    const destination = `${appointments[appointments.length - 1].latitude},${appointments[appointments.length - 1].longitude}`
    const waypoints = appointments
      .slice(1, -1)
      .map((apt) => `${apt.latitude},${apt.longitude}`)
      .join('|')

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`
    window.open(url, '_blank')
  }

  if (!googleMapsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MapPin className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500 mb-2">Google Maps API Key not configured</p>
        <p className="text-sm text-gray-400">
          Add VITE_GOOGLE_MAPS_API_KEY to your .env file
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <MapPin className="h-12 w-12 text-gray-300 mb-3" />
        <p className="font-medium text-gray-600 mb-1">No locations to display</p>
        <p className="text-sm text-gray-400 text-center">
          {filteredAppointments.length === 0 
            ? 'No appointments scheduled for this date'
            : 'Appointments don\'t have location data. Add addresses in client details.'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <APIProvider apiKey={googleMapsApiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={12}
          mapId="maya-pet-grooming-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
        >
          {appointments.map((apt, index) => (
            <AdvancedMarker
              key={apt.id}
              position={{ lat: apt.latitude, lng: apt.longitude }}
            >
              <div className="relative">
                <Pin
                  background={apt.color}
                  borderColor="#fff"
                  glyphColor="#fff"
                >
                  <div className="font-bold text-sm">{index + 1}</div>
                </Pin>
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      {/* Appointment List Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg max-h-[40vh] overflow-y-auto">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Today's Route ({appointments.length})</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={openInGoogleMaps}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Navigate
          </Button>
        </div>
        <div className="divide-y divide-gray-100">
          {appointments.map((apt, index) => (
            <div key={apt.id} className="p-3 flex items-start gap-3">
              <div
                className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: apt.color }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{apt.client_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {apt.time} • {apt.service}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {apt.address}, {apt.suburb}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

