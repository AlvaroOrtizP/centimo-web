import { ComponentFixture, TestBed } from '@angular/core/testing';

import { B100HistoryTableComponent } from './b100-history-table.component';
import { B100Balance } from '../../../../models';

describe('B100HistoryTableComponent', () => {
  let component: B100HistoryTableComponent;
  let fixture: ComponentFixture<B100HistoryTableComponent>;

  const balances: B100Balance[] = [
    {
      id: 'save-2026-09',
      tipoSubcuenta: 'save',
      mes: '2026-09',
      balanceMensual: 3200,
      dineroTotalRepartir: 12,
      aporteMensual: 100,
      dineroHacienda: 2.28,
      porcentajeHacienda: 19,
    },
    {
      id: 'save-2026-08',
      tipoSubcuenta: 'save',
      mes: '2026-08',
      balanceMensual: 3000,
      dineroTotalRepartir: 10,
      aporteMensual: 50,
      dineroHacienda: 1.9,
      porcentajeHacienda: 19,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [B100HistoryTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(B100HistoryTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatea el mes como "{mes} año"', () => {
    expect(component.formatMes('2026-09')).toBe('Septiembre 2026');
  });

  it('muestra una fila por balance', () => {
    fixture.componentRef.setInput('balances', balances);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as HTMLElement[];
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Septiembre 2026');
    expect(rows[1].textContent).toContain('Agosto 2026');
  });

  it('muestra el estado vacío cuando no hay balances', () => {
    fixture.componentRef.setInput('balances', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin registros todavía');
  });

  it('emite edit con el balance al pulsar el botón de editar', () => {
    fixture.componentRef.setInput('balances', balances);
    fixture.componentRef.setInput('headingTooltip', 'tooltip');
    fixture.detectChanges();

    let emitted: B100Balance | undefined;
    component.edit.subscribe(b => (emitted = b));

    const editButton = fixture.nativeElement.querySelector('button[title="Editar registro"]') as HTMLButtonElement;
    editButton.click();

    expect(emitted).toEqual(balances[0]);
  });

  it('emite delete con el id al pulsar el botón de eliminar', () => {
    fixture.componentRef.setInput('balances', balances);
    fixture.detectChanges();

    let emittedId: string | undefined;
    component.delete.subscribe(id => (emittedId = id));

    const deleteButton = fixture.nativeElement.querySelector('button[title="Eliminar registro"]') as HTMLButtonElement;
    deleteButton.click();

    expect(emittedId).toBe('save-2026-09');
  });

  it('muestra el tooltip del encabezado cuando se define', () => {
    fixture.componentRef.setInput('balances', balances);
    fixture.componentRef.setInput('headingTooltip', 'Últimos meses');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.group')).toBeTruthy();
  });
});