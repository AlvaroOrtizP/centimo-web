import { ProjectStatus } from './project-status';

export interface CrowdlendingInvestment {
  id: string;
  platformId: string;
  projectName: string;
  investedAmount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  endDate?: string;
  monthlyReturn: number;
  totalReturned: number;
  status: ProjectStatus;
}
