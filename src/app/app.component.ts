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
    this.dataService.loadAllSnapshots();
  }
}
