// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',

  // Users endpoints
  users: {
    register: '/users/register',
    login: '/users/login',
    listAllUsers: '/users/',
    getUserDetails: (userId: string) => `/users/${userId}`,
    updateUser: (userId: string) => `/users/${userId}`,
    deleteUser: (userId: string) => `/users/${userId}`,
    getUserWallet: (userId: string) => `/users/${userId}/wallet`,
  },

  // Violations endpoints
  violations: {
    reportViolation: '/violations/',
    getViolationDetails: (id: string) => `/violations/${id}`,
    listAllViolations: '/violations/',
    listPendingViolations: '/violations/pending/list',
    listViolationsByReporter: (userId: string) => `/violations/reporter/${userId}`,
    createViolationCategory: '/violations/categories/',
    listViolationCategories: '/violations/categories/',
  },

  // Rewards endpoints
  rewards: {
    createReward: '/rewards/',
    getRewardDetails: (id: string) => `/rewards/${id}`,
    listUserRewards: (userId: string) => `/rewards/user/${userId}`,
    listPendingRewards: '/rewards/pending/all',
    approveReward: (id: string) => `/rewards/${id}/approve`,
    payReward: (id: string) => `/rewards/${id}/pay`,
  },

  // Verifications endpoints
  verifications: {
    createVerification: '/verifications/',
    listAllVerifications: '/verifications/',
    listVerificationsByViolation: (violationId: string) => `/verifications/violation/${violationId}`,
    approveViolation: '/verifications/approve',
    rejectViolation: '/verifications/reject',
  },

  // Transactions endpoints
  transactions: {
    getTransactionDetails: (id: string) => `/transactions/${id}`,
    listUserTransactions: (userId: string) => `/transactions/user/${userId}`,
  },

  // Lookups endpoints
  lookups: {
    getAllLookups: '/lookups/all',
    getStatusValues: '/lookups/status',
    getUserTypes: '/lookups/user-types',
    getViolationStatuses: '/lookups/violation-status',
    getRewardStatuses: '/lookups/reward-status',
    getTransactionStatuses: '/lookups/transaction-status',
    getVerificationStatuses: '/lookups/verification-status',
    getVerificationMethods: '/lookups/verification-methods',
    getVehicleTypes: '/lookups/vehicle-types',
    getNotificationTypes: '/lookups/notification-types',
    getPaymentMethods: '/lookups/payment-methods',
    getTransactionTypes: '/lookups/transaction-types',
    getLicenseStatuses: '/lookups/license-status',
    getWarningStatuses: '/lookups/warning-status',
  },
};
