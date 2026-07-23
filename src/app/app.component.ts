import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { FinancialDataService } from './core/services/financial-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'centimo';

  private readonly dataService = inject(FinancialDataService);

  ngOnInit(): void {
    this.dataService.loadAllPlatforms();
    this.dataService.loadAllAccounts();
    this.dataService.loadAllSnapshots();
    this.loadRecentSummaries();
  }

  private loadRecentSummaries(): void {
    let y = new Date().getFullYear();
    let m = new Date().getMonth() + 1;
    for (let i = 0; i < 6; i++) {
      this.dataService.loadMonthlySummary(y, m);
      m--;
      if (m === 0) { m = 12; y--; }
    }
  }
}
