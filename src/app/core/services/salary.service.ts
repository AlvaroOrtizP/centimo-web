import { Injectable, signal } from '@angular/core';

import { SalaryAllocation } from '../../models/salary-allocation';
import { Commitment } from '../../models/commitment';

@Injectable({ providedIn: 'root' })
export class SalaryDataService {
  readonly salaryAllocations = signal<SalaryAllocation[]>([]);
  readonly commitments = signal<Commitment[]>([]);

  getSalaryAllocationsByMonth(year: number, month: number): SalaryAllocation[] {
    return this.salaryAllocations().filter(a => a.year === year && a.month === month);
  }

  addSalaryAllocation(allocation: SalaryAllocation): void {
    this.salaryAllocations.update(arr => [...arr, allocation]);
  }

  updateSalaryAllocation(id: string, data: Partial<SalaryAllocation>): void {
    this.salaryAllocations.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteSalaryAllocation(id: string): void {
    this.salaryAllocations.update(arr => arr.filter(a => a.id !== id));
  }

  getAllCommitments(): Commitment[] {
    return this.commitments();
  }

  addCommitment(commitment: Commitment): void {
    this.commitments.update(arr => [...arr, commitment]);
  }

  updateCommitment(id: string, data: Partial<Commitment>): void {
    this.commitments.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteCommitment(id: string): void {
    this.commitments.update(arr => arr.filter(a => a.id !== id));
  }
}
