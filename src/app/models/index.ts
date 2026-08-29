// Generic API Response wrapper
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors: any;
}

// User related models
export interface User {
  user_id: number;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  user_type_id: number;
  status_id?: number;
  created_at?: string;
}

export interface UserWallet {
  wallet_id: number;
  user_id: number;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}

// Violation related models
export interface Violation {
  violation_id: number;
  reporter_id?: number;
  category_id?: number;
  violation_datetime?: string;
  vehicle_plate_number?: string;
  vehicle_type_id?: number;
  vehicle_color?: string;
  vehicle_model?: string;
  description?: string;
  address?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
  location_landmark?: string;
  image_url?: string;
  image_mime_type?: string;
  violation_status_id?: number;
  created_at?: string;
  reporter?: User;
  category?: ViolationCategory;
  verification?: Verification;
  reward?: Reward;
}

export interface ViolationCategory {
  category_id: number;
  category_name: string;
  base_reward_amount?: number;
}

// Verification related models
export interface Verification {
  verification_id: number;
  violation_id: number;
  admin_id: number;
  verification_datetime?: string;
  verification_status_id: number;
  confidence_score?: number;
  verification_method_id: number;
  comments?: string;
  rejection_reason?: string;
  evidence_notes?: string;
  created_at?: string;
  updated_at?: string;
  violation?: Violation;
  admin?: User;
}

// Reward related models
export interface Reward {
  reward_id: number;
  violation_id?: number;
  reporter_id?: number;
  category_id?: number;
  reward_amount?: number;
  reward_status_id?: number;
  payment_method_id?: number;
  created_at?: string;
  violation?: Violation;
  reporter?: User;
  category?: ViolationCategory;
  transactions?: Transaction[];
}

// Transaction related models
export interface Transaction {
  transaction_id: number;
  user_id?: number;
  reward_id?: number;
  transaction_type_id?: number;
  amount?: number;
  transaction_status_id?: number;
  transaction_datetime?: string;
  user?: User;
  reward?: Reward;
}

// Notification related models
export interface Notification {
  notification_id: number;
  user_id?: number;
  notification_type_id?: number;
  title?: string;
  message?: string;
  created_at?: string;
  user?: User;
}

// Admin Log related models
export interface AdminLog {
  log_id: number;
  admin_id: number;
  action_type: string;
  target_user_id?: number;
  target_violation_id?: number;
  action_details: string;
  ip_address?: string;
  status?: string;
  created_at?: string;
  admin?: User;
}

// Violator Profile related models
export interface ViolatorProfile {
  profile_id: number;
  violator_id: number;
  license_number?: string;
  license_status_id?: number;
  total_violations_count: number;
  approved_violations_count: number;
  active_warnings: number;
  last_violation_datetime?: string;
  is_repeat_offender: boolean;
  warning_status_id?: number;
  created_at?: string;
  updated_at?: string;
  violator?: User;
}

// Lookup models
export interface StatusLookup {
  status_id: number;
  status_code: string;
  status_name: string;
  description?: string;
  is_active: boolean;
}

export interface UserTypeLookup {
  user_type_id: number;
  type_code: string;
  type_name: string;
  description?: string;
  is_active: boolean;
}

export interface ViolationStatusLookup {
  violation_status_id: number;
  status_code: string;
  status_name: string;
  description?: string;
}

export interface RewardStatusLookup {
  reward_status_id: number;
  status_code: string;
  status_name: string;
  description?: string;
}

export interface TransactionStatusLookup {
  transaction_status_id: number;
  status_code: string;
  status_name: string;
}

export interface VerificationStatusLookup {
  verification_status_id: number;
  status_code: string;
  status_name: string;
}

export interface VerificationMethodLookup {
  verification_method_id: number;
  method_code: string;
  method_name: string;
}

export interface VehicleTypeLookup {
  vehicle_type_id: number;
  type_code: string;
  type_name: string;
}

export interface NotificationTypeLookup {
  notification_type_id: number;
  type_code: string;
  type_name: string;
}

export interface PaymentMethodLookup {
  payment_method_id: number;
  method_code: string;
  method_name: string;
}

export interface TransactionTypeLookup {
  transaction_type_id: number;
  type_code: string;
  type_name: string;
}

export interface LicenseStatusLookup {
  license_status_id: number;
  status_code: string;
  status_name: string;
}

export interface WarningStatusLookup {
  warning_status_id: number;
  status_code: string;
  status_name: string;
  warning_level?: number;
}
