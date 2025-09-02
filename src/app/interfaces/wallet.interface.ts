export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'locked';
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  metadata?: WalletMetadata;
}

export interface WalletMetadata {
  totalTransactions: number;
  totalSpent: number;
  totalReceived: number;
  lastTransactionDate?: string;
  preferredPaymentMethod?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit' | 'transfer' | 'refund' | 'bonus' | 'fee';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  category: 'airtime' | 'data' | 'transfer' | 'payment' | 'recharge' | 'withdrawal' | 'bonus' | 'fee';
  metadata?: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionMetadata {
  recipientPhone?: string;
  recipientName?: string;
  operatorName?: string;
  bundleName?: string;
  paymentMethod?: string;
  gateway?: string;
  fee?: number;
  tax?: number;
  exchangeRate?: number;
  sourceCurrency?: string;
  targetCurrency?: string;
}

export interface WalletBalance {
  available: number;
  pending: number;
  reserved: number;
  total: number;
  currency: string;
  lastUpdated: string;
}

export interface WalletStats {
  totalTransactions: number;
  totalSpent: number;
  totalReceived: number;
  averageTransaction: number;
  monthlySpending: number;
  monthlyReceiving: number;
  topCategories: CategorySpending[];
  spendingTrend: SpendingTrend[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface SpendingTrend {
  date: string;
  spent: number;
  received: number;
  net: number;
}

export interface WalletSettings {
  notifications: {
    lowBalance: boolean;
    largeTransactions: boolean;
    failedTransactions: boolean;
    successfulTransactions: boolean;
  };
  limits: {
    dailySpending: number;
    monthlySpending: number;
    singleTransaction: number;
  };
  security: {
    requirePin: boolean;
    requireBiometric: boolean;
    autoLock: boolean;
    lockTimeout: number;
  };
}

export interface WalletRecharge {
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'mobile_money' | 'bank_transfer' | 'crypto';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  gateway: string;
  metadata?: any;
}

export interface WalletWithdrawal {
  amount: number;
  currency: string;
  destination: 'bank_account' | 'mobile_money' | 'crypto_wallet';
  accountDetails: any;
  reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fee: number;
  netAmount: number;
  metadata?: any;
}

export interface WalletTransfer {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  fee: number;
  metadata?: any;
}

export interface WalletAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  data: {
    balance: number[];
    spending: number[];
    receiving: number[];
    transactions: number[];
    dates: string[];
  };
  insights: {
    topSpendingCategory: string;
    averageDailySpending: number;
    spendingGrowth: number;
    receivingGrowth: number;
    peakSpendingDay: string;
    peakSpendingTime: string;
  };
}
