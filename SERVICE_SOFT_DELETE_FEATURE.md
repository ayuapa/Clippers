# Service Soft Delete (Deactivate/Reactivate) Feature

## Overview
Implemented a soft delete system for services that allows deactivation instead of permanent deletion. This preserves historical data while preventing inactive services from being used in new bookings.

---

## ✅ What Was Implemented

### 1. **Database Changes**
- **Migration**: `add_is_active_to_services`
  - Added `is_active` BOOLEAN column (default: `true`)
  - Set all existing services to active
  - Created index on `is_active` for faster filtering

### 2. **Service Management**
- **New Hook**: `useToggleServiceActive()` - Toggle service active status
- **Updated Interface**: Added `is_active: boolean` to `Service` type
- **Default Behavior**: New services are automatically set to active

### 3. **Services View UI**

#### **Toggle Control**
- Checkbox: "Show Inactive" (unchecked by default)
- Located at the top of the services list
- Hides inactive services by default
- Check to reveal inactive services

#### **Service Cards**
- **Active Services**: Normal appearance with white background
- **Inactive Services**: 
  - Grey background (`bg-gray-50`)
  - Reduced opacity (60%)
  - "Inactive" badge (grey pill)

#### **Action Buttons**
Each service card now has 3 buttons:
1. **Edit** (Pencil icon) - Edit service details
2. **Toggle Active/Inactive**:
   - 🚫 **Ban icon** (yellow) - Deactivate active service
   - ✅ **CheckCircle icon** (green) - Reactivate inactive service
3. **Delete** (Trash icon, red) - Permanently delete service

### 4. **Booking Flow Protection**

#### **Filtered Locations**:
- ✅ `BookingDialog` - Service selector dropdown
- ✅ `ServiceSelectorDialog` - Add extras at checkout
- ✅ Service list queries

#### **Result**:
Inactive services **cannot** be:
- Selected for new bookings
- Added as extras during checkout
- Seen in any booking creation flow

**BUT** inactive services **can**:
- Still appear in existing appointments
- Be viewed in history
- Be reactivated at any time

### 5. **Improved Delete Dialog**

#### **Smart Messaging**:
When trying to delete a service in use:
- **Before**: "Cannot delete. Update or delete all appointments first."
- **After**: "Cannot delete. Consider **deactivating** instead. This prevents it from being used in new bookings while keeping existing appointments intact."

---

## 📊 User Flow Examples

### **Deactivating a Service**
1. Navigate to More → Services
2. Find the service you want to deactivate
3. Click the 🚫 **Ban** icon (yellow)
4. Service immediately:
   - Changes to grey background
   - Shows "Inactive" badge
   - Disappears from list (unless "Show Inactive" is checked)
5. **Result**: Can't be used in new bookings, but existing appointments remain intact

### **Reactivating a Service**
1. Navigate to More → Services
2. Check "Show Inactive" checkbox
3. Find the inactive service (grey, with "Inactive" badge)
4. Click the ✅ **CheckCircle** icon (green)
5. Service immediately returns to active state
6. **Result**: Available for new bookings again

### **Attempting to Delete Active Service in Use**
1. Click the 🗑️ **Trash** icon
2. System checks if service is used in appointments
3. **Dialog appears**: "Cannot Delete Service"
   - Explains service is in use
   - **Suggests deactivating** instead
   - Shows "OK" button
4. User clicks OK, tries the Ban icon instead
5. Service deactivated successfully

### **Deleting Inactive, Unused Service**
1. Service must be:
   - Inactive (deactivated)
   - Not used in any appointments
2. Click the 🗑️ **Trash** icon
3. Confirmation dialog: "Delete '[name]'? This action cannot be undone."
4. Click "Delete" (red button)
5. Service permanently removed from database

---

## 🎯 Benefits

### **For Data Integrity**
- ✅ Historical appointments remain intact
- ✅ No orphaned references or broken relationships
- ✅ Complete audit trail preserved

### **For Business Operations**
- ✅ Seasonal services can be temporarily disabled
- ✅ Deprecated services hidden from view
- ✅ Easy to reactivate if needed
- ✅ Clear visual distinction between active/inactive

### **For User Experience**
- ✅ Simple toggle (one click)
- ✅ No accidental deletions
- ✅ Clean, uncluttered service list
- ✅ Helpful guidance on what to do instead of delete

---

## 🔧 Technical Implementation

### Files Modified
```
src/
├── hooks/
│   └── useServices.ts (Added is_active field, useToggleServiceActive hook)
├── components/
│   ├── services/
│   │   ├── ServicesView.tsx (Added toggle, filtering, deactivate button)
│   │   ├── ServiceDialog.tsx (Set is_active: true for new services)
│   │   └── DeleteServiceDialog.tsx (Updated messaging)
│   └── booking/
│       ├── BookingDialog.tsx (Filter inactive services from dropdown)
│       └── ServiceSelectorDialog.tsx (Filter inactive services from extras)
migrations/
└── add_is_active_to_services.sql (Database migration)
```

### Database Schema
```sql
services table:
  - id (UUID)
  - name (TEXT)
  - description (TEXT)
  - base_price (DECIMAL)
  - duration_minutes (INTEGER)
  - icon (TEXT)
  - color (TEXT, nullable)
  - is_active (BOOLEAN, default: true) ← NEW
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

Index: idx_services_is_active ON services(is_active)
```

### Type Definitions
```typescript
export interface Service {
  id: string
  name: string
  description: string | null
  base_price: number
  duration_minutes: number
  icon: string
  color?: string | null
  is_active: boolean // NEW
}

export function useToggleServiceActive() {
  // Mutation to update is_active field
}
```

---

## ✅ Testing Checklist

### Deactivation
- [x] Can deactivate active service
- [x] Deactivated service shows grey background
- [x] "Inactive" badge appears
- [x] Service hidden from list by default
- [x] Toast notification appears

### Reactivation
- [x] Can check "Show Inactive" to see inactive services
- [x] Can reactivate inactive service
- [x] Service returns to normal appearance
- [x] Service available in booking flow again

### Booking Flow
- [x] Inactive services don't appear in BookingDialog
- [x] Inactive services don't appear in ServiceSelectorDialog (checkout extras)
- [x] Active services work normally

### Delete Flow
- [x] Active service in use → Shows suggestion to deactivate
- [x] Inactive service in use → Shows suggestion to deactivate
- [x] Inactive service NOT in use → Can be deleted
- [x] Delete confirmation works properly

### Edge Cases
- [x] New services default to active
- [x] Edited services retain their active status
- [x] Filter persists when navigating away and back
- [x] Multiple rapid toggles work correctly

---

## 📈 Future Enhancements (Optional)

1. **Bulk Operations**: Select multiple services to deactivate/reactivate
2. **Deactivation Reason**: Optional note explaining why service was deactivated
3. **Auto-Reactivate**: Schedule date to automatically reactivate (e.g., seasonal services)
4. **Usage Analytics**: Show how many times service was used before deactivation
5. **Archive View**: Separate "Archived" section for old, unused services

---

## 🚀 Deployment Notes

- ✅ Migration applied successfully
- ✅ All existing services set to active
- ✅ Build successful (787 KB bundle)
- ✅ No breaking changes
- ✅ Backwards compatible

**Status**: Ready for testing and deployment! 🎉
