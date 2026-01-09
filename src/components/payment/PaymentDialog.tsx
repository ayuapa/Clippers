import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreditCard, Banknote, Smartphone, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateAppointment } from '@/hooks/useAppointments'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  clientName: string
  serviceName: string
  amount: number
}

type PaymentMethod = 'cash' | 'card' | 'payid'

export function PaymentDialog({
  open,
  onOpenChange,
  appointmentId,
  clientName,
  serviceName,
  amount,
}: PaymentDialogProps) {
  const updateAppointmentMutation = useUpdateAppointment()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const paymentMethods: {
    id: PaymentMethod
    label: string
    icon: typeof CreditCard
    color: string
  }[] = [
    {
      id: 'cash',
      label: 'Cash',
      icon: Banknote,
      color: 'bg-green-500',
    },
    {
      id: 'card',
      label: 'Card',
      icon: CreditCard,
      color: 'bg-blue-500',
    },
    {
      id: 'payid',
      label: 'PayID',
      icon: Smartphone,
      color: 'bg-purple-500',
    },
  ]

  const handlePayment = async () => {
    if (!selectedMethod) return

    setIsProcessing(true)

    try {
      // Update appointment with payment info
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        payment_status: 'paid',
        payment_method: selectedMethod,
        status: 'completed',
      })

      setIsProcessing(false)
      setIsComplete(true)

      // Close after showing success
      setTimeout(() => {
        onOpenChange(false)
        // Reset state
        setTimeout(() => {
          setIsComplete(false)
          setSelectedMethod(null)
        }, 300)
      }, 1500)
    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {!isComplete ? (
          <>
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-500">Client</div>
              <div className="font-semibold text-lg">{clientName}</div>
              <div className="text-sm text-gray-600 mt-1">{serviceName}</div>
              <div className="text-2xl font-bold text-primary mt-3">
                ${amount.toFixed(2)}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Payment Method</div>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  const isSelected = selectedMethod === method.id

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'h-12 w-12 rounded-full flex items-center justify-center text-white',
                          method.color
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="py-8 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Recorded!</h3>
            <p className="text-gray-600 text-center">
              ${amount.toFixed(2)} via {selectedMethod}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

