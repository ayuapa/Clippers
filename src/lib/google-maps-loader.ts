// Global Google Maps loader with Places library
// Ensures Google Maps is loaded only once and includes Places API

let isLoading = false
let isLoaded = false
const callbacks: Array<() => void> = []

export function loadGoogleMapsAPI(): Promise<void> {
  console.log('🚀 loadGoogleMapsAPI called')
  
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isLoaded && window.google?.maps?.places) {
      console.log('✅ Google Maps and Places already loaded')
      resolve()
      return
    }

    // Currently loading, queue the callback
    if (isLoading) {
      console.log('⏳ Google Maps currently loading, queueing callback')
      callbacks.push(resolve)
      return
    }

    // Start loading
    console.log('📥 Starting to load Google Maps API...')
    isLoading = true

    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
    
    if (!apiKey) {
      console.error('❌ Google Maps API key not configured')
      isLoading = false
      reject(new Error('Google Maps API key not configured'))
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      console.log('⚠️ Google Maps script already in DOM, waiting for Places...')
      
      // Wait for Places library to be ready
      let attempts = 0
      const maxAttempts = 50 // 5 seconds total
      
      const checkPlaces = setInterval(() => {
        attempts++
        
        if (window.google?.maps?.places) {
          console.log(`✅ Places library ready after ${attempts} attempts`)
          clearInterval(checkPlaces)
          
          isLoaded = true
          isLoading = false
          resolve()
          
          callbacks.forEach(cb => cb())
          callbacks.length = 0
        } else if (attempts >= maxAttempts) {
          console.error('❌ Timeout waiting for Places library')
          clearInterval(checkPlaces)
          isLoading = false
          reject(new Error('Places library failed to load'))
        }
      }, 100)
      return
    }

    // Load Google Maps with Places library
    const script = document.createElement('script')
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    console.log('📝 Creating script element:', scriptSrc)
    script.src = scriptSrc
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log('✅ Script loaded, waiting for Places library...')
      
      // Wait for Places library to be ready (it takes a moment after script load)
      let attempts = 0
      const maxAttempts = 50 // 5 seconds total
      
      const checkPlaces = setInterval(() => {
        attempts++
        
        if (window.google?.maps?.places) {
          console.log(`✅ Places library ready after ${attempts} attempts`)
          clearInterval(checkPlaces)
          
          isLoaded = true
          isLoading = false
          resolve()
          
          // Resolve all queued callbacks
          console.log(`✅ Resolving ${callbacks.length} queued callbacks`)
          callbacks.forEach(cb => cb())
          callbacks.length = 0
        } else if (attempts >= maxAttempts) {
          console.error('❌ Timeout waiting for Places library')
          clearInterval(checkPlaces)
          isLoading = false
          reject(new Error('Places library failed to load'))
        }
      }, 100) // Check every 100ms
    }

    script.onerror = (error) => {
      console.error('❌ Script onerror fired:', error)
      isLoading = false
      reject(new Error('Failed to load Google Maps API'))
    }

    console.log('📌 Appending script to document head')
    document.head.appendChild(script)
  })
}

// Check if Google Maps is ready
export function isGoogleMapsLoaded(): boolean {
  return !!(window.google?.maps?.places)
}

