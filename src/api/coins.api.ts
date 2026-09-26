import { axiosInstance } from './axiosInstance';

export interface CoinBalance {
  balance: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface CoinTransactionsResponse {
  transactions: CoinTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const coinsApi = {
  getBalance: async () => {
    const res = await axiosInstance.get<CoinBalance>('/coins/me');
    return res.data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const res = await axiosInstance.get<CoinTransactionsResponse>('/coins/transactions', {
      params: { page, limit },
    });
    return res.data;
  },
};
