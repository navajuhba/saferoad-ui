# SafeRoad API Integration Guide

## Environment Files

Two environment files have been created to handle different deployment scenarios:

### 1. Development Environment (`src/environments/environment.ts`)
- **API Base URL**: `http://localhost:8000/api/v1`
- Used automatically during development (`ng serve`)
- Perfect for local API development and testing

### 2. Production Environment (`src/environments/environment.prod.ts`)
- **API Base URL**: `https://api.saferoad.com/api/v1`
- Used when building for production (`ng build --configuration production`)
- Update the URL to your actual production API domain

## Endpoint Organization

All endpoints are organized by feature domain in the environment files:

- **Users**: Registration, login, user details, wallet
- **Violations**: Report, list, filter, categories
- **Rewards**: Create, approve, pay, list user rewards
- **Verifications**: Create verifications, approve/reject violations
- **Transactions**: Transaction history and details
- **Lookups**: Reference data (statuses, types, methods, etc.)

## Services Created

### 1. UserService
Handles user authentication and profile operations.

```typescript
import { UserService } from './services';

constructor(private userService: UserService) {}

// Example usage
this.userService.login(credentials).subscribe(
  response => console.log('Login successful', response),
  error => console.error('Login failed', error)
);
```

**Available Methods:**
- `register(userData)` - Register new user
- `login(credentials)` - User login
- `getUserDetails(userId)` - Get user profile
- `getUserWallet(userId)` - Get user wallet info

### 2. ViolationService
Manages violation reporting and retrieval.

```typescript
import { ViolationService } from './services';

constructor(private violationService: ViolationService) {}

// Example usage
this.violationService.listAllViolations(1, 10).subscribe(
  violations => console.log('Violations:', violations),
  error => console.error('Error:', error)
);
```

**Available Methods:**
- `reportViolation(violationData)` - Report a new violation
- `getViolationDetails(id)` - Get specific violation
- `listAllViolations(page, limit, filters)` - List all violations
- `listPendingViolations(page, limit)` - List pending violations
- `listViolationsByReporter(userId, page, limit)` - List user's violations
- `createViolationCategory(categoryData)` - Create category
- `listViolationCategories()` - Get all categories

### 3. RewardService
Manages reward operations and approvals.

```typescript
import { RewardService } from './services';

constructor(private rewardService: RewardService) {}

// Example usage
this.rewardService.listUserRewards(userId).subscribe(
  rewards => console.log('Rewards:', rewards),
  error => console.error('Error:', error)
);
```

**Available Methods:**
- `createReward(rewardData)` - Create new reward
- `getRewardDetails(id)` - Get reward details
- `listUserRewards(userId, page, limit)` - List user's rewards
- `listPendingRewards(page, limit)` - List pending rewards
- `approveReward(id, approvalData)` - Approve reward
- `payReward(id, paymentData)` - Pay/settle reward

### 4. VerificationService
Handles violation verification workflow.

```typescript
import { VerificationService } from './services';

constructor(private verificationService: VerificationService) {}

// Example usage
this.verificationService.approveViolation(approvalData).subscribe(
  response => console.log('Approved:', response),
  error => console.error('Error:', error)
);
```

**Available Methods:**
- `createVerification(verificationData)` - Create verification record
- `approveViolation(approvalData)` - Approve violation (with verification)
- `rejectViolation(rejectionData)` - Reject violation with reason

### 5. TransactionService
Manages transaction history and details.

```typescript
import { TransactionService } from './services';

constructor(private transactionService: TransactionService) {}

// Example usage
this.transactionService.listUserTransactions(userId).subscribe(
  transactions => console.log('Transactions:', transactions),
  error => console.error('Error:', error)
);
```

**Available Methods:**
- `getTransactionDetails(id)` - Get transaction details
- `listUserTransactions(userId, page, limit, filters)` - Get user's transactions

### 6. LookupService
Fetches reference/lookup data for dropdowns and enums.

```typescript
import { LookupService } from './services';

constructor(private lookupService: LookupService) {}

// Example usage - Load all lookups
this.lookupService.getAllLookups().subscribe(
  lookups => console.log('Lookups:', lookups),
  error => console.error('Error:', error)
);

// Or load specific lookups
this.lookupService.getViolationStatuses().subscribe(
  statuses => console.log('Violation Statuses:', statuses),
  error => console.error('Error:', error)
);
```

**Available Methods:**
- `getAllLookups()` - Get all lookup data at once
- `getStatusValues()` - Get status values
- `getUserTypes()` - Get user types
- `getViolationStatuses()` - Get violation statuses
- `getRewardStatuses()` - Get reward statuses
- `getTransactionStatuses()` - Get transaction statuses
- `getVerificationStatuses()` - Get verification statuses
- `getVerificationMethods()` - Get verification methods
- `getVehicleTypes()` - Get vehicle types
- `getNotificationTypes()` - Get notification types
- `getPaymentMethods()` - Get payment methods
- `getTransactionTypes()` - Get transaction types
- `getLicenseStatuses()` - Get license statuses
- `getWarningStatuses()` - Get warning statuses

## Using Services in Components

### Basic Import and Injection
```typescript
import { Component, OnInit } from '@angular/core';
import { UserService, ViolationService, RewardService } from '../services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: '...'
})
export class DashboardComponent implements OnInit {
  constructor(
    private userService: UserService,
    private violationService: ViolationService,
    private rewardService: RewardService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load user wallet
    this.userService.getUserWallet('user123').subscribe(
      wallet => {
        console.log('Wallet:', wallet);
      },
      error => console.error('Error:', error)
    );
  }
}
```

### With Error Handling and Loading States
```typescript
import { Component, OnInit, signal } from '@angular/core';
import { ViolationService } from '../services';

@Component({
  selector: 'app-violations',
  standalone: true,
  template: '...'
})
export class ViolationsComponent implements OnInit {
  violations = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private violationService: ViolationService) {}

  ngOnInit() {
    this.loadViolations();
  }

  loadViolations() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.violationService.listAllViolations(1, 20).subscribe({
      next: (response) => {
        this.violations.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load violations');
        this.isLoading.set(false);
      }
    });
  }
}
```

## Angular Configuration

The `app.config.ts` has been updated to include `provideHttpClient()`, which is required for all HTTP services to work properly.

## API Response Patterns

All services follow these response patterns:

### Success Response
```typescript
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### Error Response
```typescript
{
  "success": false,
  "error": "Error code",
  "message": "Error description"
}
```

## Next Steps

1. **Test Endpoints**: Update specific service methods based on actual API response structure
2. **Add Interceptors**: Create HTTP interceptors for:
   - Adding authentication tokens to requests
   - Global error handling
   - Loading state management
3. **Add Loading/Error States**: Implement global loading and error handling
4. **Replace Mock Data**: Update components to use services instead of hardcoded data
5. **Add Authentication**: Implement login/logout functionality with token storage

## File Structure
```
src/
├── environments/
│   ├── environment.ts          (Development - localhost:8000)
│   └── environment.prod.ts     (Production - api.saferoad.com)
├── app/
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── violation.service.ts
│   │   ├── reward.service.ts
│   │   ├── verification.service.ts
│   │   ├── transaction.service.ts
│   │   ├── lookup.service.ts
│   │   └── index.ts            (Barrel export)
│   ├── models/
│   │   └── index.ts            (All TypeScript interfaces)
│   └── ...
```

