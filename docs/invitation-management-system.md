# Invitation Management System

## Overview
Complete UI implementation for managing team member invitations including viewing pending invitations, resending, and canceling.

## Architecture

### Frontend Components

#### PendingInvitationsPanel Component
**Location:** `resources/js/Components/PendingInvitationsPanel.jsx`

**Purpose:** Display and manage all pending team invitations with full CRUD capabilities.

**Features:**
- Real-time invitation list display
- Status indicators with expiry warnings
- Resend invitation functionality
- Cancel invitation with confirmation modal
- Auto-refresh on invitation changes
- Responsive design with HeroUI components
- Empty state handling
- Loading states and skeletons

**Key Properties:**
```jsx
<PendingInvitationsPanel 
  onInvitationChange={fetchUsers}  // Callback after invitation changes
/>
```

**State Management:**
- `invitations` - Array of pending invitations
- `loading` - Loading state for API calls
- `actionLoading` - Tracks specific action being performed
- `deleteModal` - Controls delete confirmation modal
- `themeRadius` - Theme-aware border radius

**API Integration:**
- GET `/users/invitations/pending` - Fetch pending invitations
- POST `/users/invitations/{invitation}/resend` - Resend invitation email
- DELETE `/users/invitations/{invitation}` - Cancel invitation

### Backend Routes
**Location:** `routes/web.php` (lines 429-434)

```php
Route::prefix('users')->group(function () {
    Route::post('/invite', [UserController::class, 'sendInvitation'])
        ->name('users.invite');
    Route::get('/invitations/pending', [UserController::class, 'pendingInvitations'])
        ->name('users.invitations.pending');
    Route::post('/invitations/{invitation}/resend', [UserController::class, 'resendInvitation'])
        ->name('users.invitations.resend');
    Route::delete('/invitations/{invitation}', [UserController::class, 'cancelInvitation'])
        ->name('users.invitations.cancel');
});
```

### Controller Methods
**Location:** `app/Http/Controllers/UserController.php`

#### 1. pendingInvitations()
```php
public function pendingInvitations(): \Illuminate\Http\JsonResponse
{
    $invitations = TenantInvitation::pending()
        ->with('inviter:id,name,email')
        ->orderBy('created_at', 'desc')
        ->get();
    
    return response()->json([
        'invitations' => $invitations
    ]);
}
```

#### 2. resendInvitation(TenantInvitation $invitation)
```php
public function resendInvitation(TenantInvitation $invitation)
{
    // Extend expiry by 7 days
    $invitation->extend();
    
    // Resend email
    $invitation->inviter->notify(new InviteTeamMember($invitation));
    
    return response()->json([
        'message' => 'Invitation resent successfully',
        'invitation' => $invitation
    ]);
}
```

#### 3. cancelInvitation(TenantInvitation $invitation)
```php
public function cancelInvitation(TenantInvitation $invitation)
{
    $invitation->cancel();
    
    return response()->json([
        'message' => 'Invitation cancelled successfully'
    ]);
}
```

## User Interface

### Visual Flow

```
UsersList Page
├── Stats Cards (Overview)
├── Pending Invitations Panel ← NEW
│   ├── Header (Title + Refresh button)
│   ├── Invitation Cards
│   │   ├── Email + Expiry Status Chip
│   │   ├── Role, Department, Designation
│   │   ├── Sent date + Inviter name
│   │   └── Actions (Resend, Cancel)
│   └── Empty State (No pending invitations)
├── Filters Section
└── Users Table/Grid
```

### Component Layout

#### Header Section
```jsx
<CardHeader>
  <div>
    <EnvelopeIcon /> Pending Invitations
    <p>{count} invitations awaiting acceptance</p>
  </div>
  <Button onPress={refresh}>Refresh</Button>
</CardHeader>
```

#### Invitation Item
```jsx
<div className="invitation-item">
  {/* Left: Details */}
  <div>
    <h4>{email}</h4>
    <Chip color={statusColor}>Expires {timeAgo}</Chip>
    <div>
      <UserGroupIcon /> {role}
      <BuildingOfficeIcon /> Department assigned
      <BriefcaseIcon /> Designation assigned
    </div>
    <div>Sent {timeAgo} • by {inviter.name}</div>
  </div>
  
  {/* Right: Actions */}
  <div>
    <Button onPress={resend}>Resend</Button>
    <Button onPress={cancel}>Cancel</Button>
  </div>
</div>
```

### Status Color Logic
```javascript
const getStatusColor = (invitation) => {
  const daysUntilExpiry = calculateDays(invitation.expires_at);
  
  if (daysUntilExpiry < 1) return 'danger';   // Red: < 24 hours
  if (daysUntilExpiry < 3) return 'warning';  // Yellow: < 3 days
  return 'success';                            // Green: > 3 days
};
```

## Integration Points

### 1. UsersList Page
**Location:** `resources/js/Tenant/Pages/UsersList.jsx`

**Integration:**
```jsx
import PendingInvitationsPanel from "@/Components/PendingInvitationsPanel.jsx";

// In JSX (after stats, before filters)
<div className="mb-6">
  <PendingInvitationsPanel onInvitationChange={fetchUsers} />
</div>
```

### 2. InviteUserForm
**Location:** `resources/js/Forms/InviteUserForm.jsx`

**Relationship:** After successfully sending an invitation via InviteUserForm, the PendingInvitationsPanel automatically refreshes to show the new invitation.

## Data Flow

### 1. Invitation Creation Flow
```
User clicks "Invite User" button
  → Opens InviteUserForm modal
  → User fills: email*, role*, department, designation, message
  → POST /users/invite
  → TenantInvitation created
  → Email sent with signed URL
  → onInviteSent() callback
  → fetchUsers() refreshes list
  → PendingInvitationsPanel shows new invitation
```

### 2. Invitation Display Flow
```
PendingInvitationsPanel mounts
  → GET /users/invitations/pending
  → Receives array of invitations
  → Maps to invitation cards
  → Calculates expiry status
  → Displays with actions
```

### 3. Resend Flow
```
User clicks Resend button
  → actionLoading set to 'resend-{id}'
  → POST /users/invitations/{id}/resend
  → Backend extends expiry (+7 days)
  → Backend resends email
  → fetchInvitations() refreshes
  → Toast success message
  → actionLoading reset
```

### 4. Cancel Flow
```
User clicks Cancel button
  → deleteModal opens with invitation data
  → User confirms cancellation
  → actionLoading set to 'cancel-{id}'
  → DELETE /users/invitations/{id}
  → Backend marks as cancelled
  → fetchInvitations() refreshes
  → Toast success message
  → Modal closes
  → actionLoading reset
```

## Models & Database

### TenantInvitation Model
**Location:** `app/Models/TenantInvitation.php`

**Fields:**
- `email` - Invitee email address
- `token` - Unique 64-character token
- `role` - Assigned role
- `invited_by` - Foreign key to inviter user
- `expires_at` - Expiration timestamp (default: 7 days)
- `accepted_at` - Acceptance timestamp
- `cancelled_at` - Cancellation timestamp
- `metadata` - JSON (department_id, designation_id, message)

**Scopes:**
```php
// Get only pending invitations
TenantInvitation::pending()

// Get expired invitations  
TenantInvitation::expired()

// Find by token
TenantInvitation::byToken($token)
```

**Methods:**
```php
$invitation->extend();           // Extend expiry by 7 days
$invitation->cancel();           // Mark as cancelled
$invitation->markAsAccepted();   // Mark as accepted
```

**Attributes:**
```php
$invitation->is_pending      // Boolean
$invitation->is_expired      // Boolean
$invitation->is_accepted     // Boolean
$invitation->is_cancelled    // Boolean
```

## User Experience

### Loading States
1. **Initial Load:** Full card skeleton with spinner
2. **Action Loading:** Button-specific spinner with disabled state
3. **Empty State:** Friendly message with icon

### Error Handling
- Network errors → Toast error message
- Validation errors → Form-level error display
- Permission errors → HTTP 403 response

### Success Feedback
- Invitation sent → Green toast notification
- Invitation resent → Green toast + expiry extended
- Invitation cancelled → Green toast + removed from list

### Responsive Behavior
- **Desktop:** Full layout with all information
- **Tablet:** Compact layout, icons remain
- **Mobile:** Stacked layout, essential info only

## Theme Integration

### Dynamic Styling
```javascript
// Border radius from CSS variables
borderRadius: `var(--borderRadius, 12px)`

// Font family from CSS variables
fontFamily: `var(--fontFamily, "Inter")`

// Colors with opacity mixing
background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`
```

### Theme-Aware Components
- Button radius: sm/md/lg/xl based on theme
- Card styling: Dynamic border and background
- Chip colors: Semantic (success/warning/danger)
- Icons: Theme-aware color values

## Best Practices

### 1. Performance
- Debounced refresh to prevent API spam
- Optimistic UI updates where possible
- Lazy loading for large invitation lists

### 2. Security
- Signed URLs for invitation acceptance
- Token-based authentication
- Rate limiting on resend actions
- Permission checks on all routes

### 3. User Experience
- Clear status indicators
- Confirmation modals for destructive actions
- Helpful empty states
- Loading states for all async operations

### 4. Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly

## Testing Recommendations

### Unit Tests
```php
// Test invitation creation
test('can create invitation', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->post(route('users.invite'), [
        'email' => 'newuser@example.com',
        'role' => 'employee'
    ]);
    
    $response->assertStatus(201);
    $this->assertDatabaseHas('tenant_invitations', [
        'email' => 'newuser@example.com'
    ]);
});

// Test resend functionality
test('can resend invitation', function () {
    $invitation = TenantInvitation::factory()->create();
    $response = $this->post(route('users.invitations.resend', $invitation));
    
    $response->assertStatus(200);
    $this->assertTrue($invitation->fresh()->expires_at > now()->addDays(6));
});

// Test cancel functionality
test('can cancel invitation', function () {
    $invitation = TenantInvitation::factory()->create();
    $response = $this->delete(route('users.invitations.cancel', $invitation));
    
    $response->assertStatus(200);
    $this->assertNotNull($invitation->fresh()->cancelled_at);
});
```

### Integration Tests
```javascript
// Test pending invitations display
test('displays pending invitations', async () => {
    const { getByText } = render(<PendingInvitationsPanel />);
    await waitFor(() => expect(getByText('user@example.com')).toBeInTheDocument());
});

// Test resend action
test('resends invitation on button click', async () => {
    const { getByTitle } = render(<PendingInvitationsPanel />);
    const resendButton = getByTitle('Resend invitation email');
    
    fireEvent.click(resendButton);
    await waitFor(() => expect(showToast.success).toHaveBeenCalled());
});
```

## Future Enhancements

### Potential Features
1. **Bulk Actions:** Select multiple invitations for bulk resend/cancel
2. **Filtering:** Filter by role, department, expiry status
3. **Search:** Search invitations by email
4. **Sorting:** Sort by date, expiry, role
5. **Pagination:** For organizations with many pending invitations
6. **History:** View accepted/expired invitations
7. **Analytics:** Track invitation acceptance rates
8. **Templates:** Save invitation templates with pre-filled data
9. **Scheduled Invites:** Schedule invitation sending for future date
10. **Custom Expiry:** Allow custom expiration periods per invitation

## Related Documentation
- [Employee Onboarding Wizard](./employee-onboarding-wizard.md)
- [Multi-Tenancy Architecture](./multi-tenancy-requirements.md)
- [User Management System](../app/Http/Controllers/UserController.php)

## Conclusion
The Invitation Management System provides a complete, production-ready UI for managing team invitations. It integrates seamlessly with the existing user management system and follows all Laravel and React best practices.
