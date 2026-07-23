export type CommitmentType = 'monthly' | 'annual' | 'once';

export interface Commitment {
  id: string;
  description: string;
  month: number;
  year?: number;
  type: CommitmentType;
  category?: string;
  amount?: number;
  isEstimated?: boolean;
}
