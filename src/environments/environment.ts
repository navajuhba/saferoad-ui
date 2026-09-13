// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

const apiUrl = 'https://saferoad-api-3vfl.onrender.com/api/v1';
// const apiUrl = 'http://localhost:8000/api/v1'; // local backend

export const environment = {
  production: false,
  // Deployed backend on Render. For a local backend, swap in the line above.
  apiUrl,
  // Origin of the backend (no /api/v1 suffix) — used to resolve server-relative
  // paths returned by the API, such as a violation's image_url.
  apiOrigin: apiUrl.replace(/\/api\/v1\/?$/, ''),

  // Users endpoints
  users: {
    register: '/users/register',
    login: '/users/login',
    listAllUsers: '/users/',
    getUserDetails: (userId: string) => `/users/${userId}`,
    updateUser: (userId: string) => `/users/${userId}`,
    deleteUser: (userId: string) => `/users/${userId}`,
    getUserWallet: (userId: string) => `/users/${userId}/wallet`,
    getUsersByType: (typeId: string) => `/users/by-type/${typeId}`,
  },

  // Violations endpoints
  violations: {
    reportViolation: '/violations/',
    getViolationDetails: (id: string) => `/violations/${id}`,
    deleteViolation: (id: string) => `/violations/${id}`,
    listAllViolations: '/violations/',
    listPendingViolations: '/violations/pending/list',
    listViolationsByReporter: (userId: string) => `/violations/reporter/${userId}`,
    listViolationsByPlate: (plateNumber: string) => `/violations/plate/${encodeURIComponent(plateNumber)}`,
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
