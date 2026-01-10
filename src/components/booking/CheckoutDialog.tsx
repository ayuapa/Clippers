import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Package, Percent } from 'lucide-react'
import { useAppointments } from '@/hooks/useAppointments'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { ServiceSelectorDialog } from './ServiceSelectorDialog'
import { ItemDiscountSelectorDialog } from './ItemDiscountSelectorDialog'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
}

type PaymentMethod = 'cash' | 'card' | 'payid'

interface ExtraService {
  service_id: string
  service_name: string
  duration_minutes: number
  price: number
}

interface ExtraItem {
  id: string
  name: string
  amount: number
}

interface Discount {
  id: string
  name: string
  amount: number
  is_percentage: boolean
}

export function CheckoutDialog({
  open,
  onOpenChange,
  appointmentId,
}: CheckoutDialogProps) {
  const { data: allAppointments = [] } = useAppointments()
  const appointment = allAppointments.find((apt) => apt.id === appointmentId)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [extraServices, setExtraServices] = useState<ExtraService[]>([])
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [showDiscountSelector, setShowDiscountSelector] = useState(false)

  if (!appointment) return null

  // Get current services from appointment_pets
  const appointmentPets = Array.isArray(appointment.appointment_pets)
    ? appointment.appointment_pets
    : []

  const currentServices = appointmentPets.map((ap: any) => ({
    pet_name: ap.pets?.name || 'Unknown',
    service_name: ap.services?.name || 'Unknown',
    duration_minutes: ap.services?.duration_minutes || 0,
    price: ap.price || 0,
  }))

  // Get service IDs already in booking (to exclude from selector)
  const existingServiceIds = appointmentPets.map((ap: any) => ap.service_id)
  const extraServiceIds = extraServices.map(es => es.service_id)
  const allExcludedServiceIds = [...existingServiceIds, ...extraServiceIds]

  // Calculate totals
  const servicesTotal = currentServices.reduce((sum, s) => sum + s.price, 0)
  const extrasTotal = extraServices.reduce((sum, s) => sum + s.price, 0)
  const itemsTotal = extraItems.reduce((sum, item) => sum + item.amount, 0)
  
  const subtotalBeforeDiscount = servicesTotal + extrasTotal + itemsTotal
  
  // Calculate discount amount
  const discountAmount = discounts.reduce((sum, discount) => {
    if (discount.is_percentage) {
      return sum + (subtotalBeforeDiscount * (discount.amount / 100))
    } else {
      return sum + discount.amount
    }
  }, 0)
  
  const subtotal = subtotalBeforeDiscount - discountAmount
  const gst = subtotal - (subtotal / 1.1)
  const total = subtotal

  const handleAddExtraService = (serviceId: string, serviceName: string, duration: number, price: number) => {
    setExtraServices([
      ...extraServices,
      {
        service_id: serviceId,
        service_name: serviceName,
        duration_minutes: duration,
        price: price,
      },
    ])
  }

  const handleRemoveExtraService = (serviceId: string) => {
    setExtraServices(extraServices.filter(es => es.service_id !== serviceId))
  }

  const handleAddItem = (id: string, name: string, defaultAmount: number | null, _isPercentage: boolean, customAmount?: number) => {
    const amount = customAmount || defaultAmount || 0
    setExtraItems([...extraItems, { id, name, amount }])
  }

  const handleRemoveItem = (id: string) => {
    setExtraItems(extraItems.filter(item => item.id !== id))
  }

  const handleAddDiscount = (id: string, name: string, defaultAmount: number | null, isPercentage: boolean, customAmount?: number) => {
    const amount = customAmount || defaultAmount || 0
    setDiscounts([...discounts, { id, name, amount, is_percentage: isPercentage }])
  }

  const handleRemoveDiscount = (id: string) => {
    setDiscounts(discounts.filter(discount => discount.id !== id))
  }

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      // Step 1: If there are extra services, add them to appointment_pets
      if (extraServices.length > 0) {
        const extraServiceData = extraServices.map(es => ({
          appointment_id: appointmentId,
          pet_id: appointmentPets[0]?.pet_id || '', // Use first pet as default
          service_id: es.service_id,
          price: es.price,
        }))

        const { error: insertError } = await supabase
          .from('appointment_pets')
          // @ts-expect-error - Supabase generated types are too strict
          .insert(extraServiceData)

        if (insertError) throw insertError
      }

      // Step 2: Update appointment status and payment info
      const { error: updateError } = await supabase
        .from('appointments')
        // @ts-expect-error - Supabase generated types are too strict
        .update({
          status: 'completed',
          payment_status: 'paid',
          payment_method: paymentMethod,
          price: total,
        })
        .eq('id', appointmentId)

      if (updateError) throw updateError

      // Success!
      toast({
        title: 'Checkout Complete',
        description: `Payment of $${total.toFixed(0)} received via ${paymentMethod}.`,
      })

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['appointments'] }).catch(err => {
        console.error('Failed to invalidate queries:', err)
      })

      // Close dialog
      onOpenChange(false)
    } catch (error: any) {
      console.error('Checkout failed:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to complete checkout. Please try again.',
      })
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">CHECKOUT</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Total at Top */}
          <div className="text-center py-4 border-2 border-gray-300 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">
              Total ${total.toFixed(2)}
            </p>
          </div>

          {/* Services & Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 underline">
              Services & Items
            </h3>
            <div className="space-y-2">
              {currentServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">
                      {service.service_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {service.pet_name} • {service.duration_minutes}min
                    </p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    ${service.price.toFixed(0)}
                  </p>
                </div>
              ))}

              {/* Extra Services */}
              {extraServices.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-3 pt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Extras:</p>
                  </div>
                  {extraServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-900">
                          {service.service_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {service.duration_minutes}min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900">
                          ${service.price.toFixed(0)}
                        </p>
                        <button
                          onClick={() => handleRemoveExtraService(service.service_id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Extra Items */}
              {extraItems.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-3 pt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Items:</p>
                  </div>
                  {extraItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-900">
                          {item.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900">
                          ${item.amount.toFixed(0)}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Discounts */}
              {discounts.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-3 pt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Discounts:</p>
                  </div>
                  {discounts.map((discount) => (
                    <div key={discount.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-base font-medium text-green-600">
                          {discount.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-green-600">
                          -{discount.is_percentage ? `${discount.amount}%` : `$${discount.amount.toFixed(0)}`}
                        </p>
                        <button
                          onClick={() => handleRemoveDiscount(discount.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* GST and Total */}
              <div className="border-t border-gray-200 my-3" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">GST (included)</p>
                <p className="text-sm font-medium text-gray-900">
                  ${gst.toFixed(0)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xl font-bold text-gray-900">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  ${total.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Add Extras */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Add Extras
            </h3>
            
            <div className="space-y-3">
              {/* Add Service Button */}
              <button
                onClick={() => setShowServiceSelector(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">Add Service</span>
              </button>

              {/* Add Item Button */}
              <button
                onClick={() => setShowItemSelector(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Package className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-500">Add Item</span>
              </button>

              {/* Add Discount Button */}
              <button
                onClick={() => setShowDiscountSelector(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <Percent className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-500">Add Discount</span>
              </button>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Payment Type
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-3 px-4 rounded-full font-medium text-base transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-primary text-white border-2 border-primary'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 px-4 rounded-full font-medium text-base transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-primary text-white border-2 border-primary'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod('payid')}
                className={`flex-1 py-3 px-4 rounded-full font-medium text-base transition-all ${
                  paymentMethod === 'payid'
                    ? 'bg-primary text-white border-2 border-primary'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                }`}
              >
                PayID
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 text-base font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="h-12 text-base font-semibold bg-gray-900 hover:bg-gray-800"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'CHECKOUT'}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Service Selector Dialog */}
      <ServiceSelectorDialog
        open={showServiceSelector}
        onOpenChange={setShowServiceSelector}
        excludeServiceIds={allExcludedServiceIds}
        onServiceSelect={handleAddExtraService}
      />

      {/* Item Selector Dialog */}
      <ItemDiscountSelectorDialog
        open={showItemSelector}
        onOpenChange={setShowItemSelector}
        type="item"
        onSelect={handleAddItem}
      />

      {/* Discount Selector Dialog */}
      <ItemDiscountSelectorDialog
        open={showDiscountSelector}
        onOpenChange={setShowDiscountSelector}
        type="discount"
        onSelect={handleAddDiscount}
      />
    </Dialog>
  )
}
