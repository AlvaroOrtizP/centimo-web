import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { B100FormComponent } from './b100-form.component';
import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account, B100Balance, B100Subcuenta } from '../../../../models';

describe('B100FormComponent', () => {
  let serviceMock: {
    currentYear: WritableSignal<number>;
    currentMonth: WritableSignal<number>;
    loadB100History: jasmine.Spy;
    getB100BalancesByTipo: jasmine.Spy;
    getB100Balance: jasmine.Spy;
    saveB100Balance: jasmine.Spy;
    deleteB100Balance: jasmine.Spy;
  };
  let balances: B100Balance[];

  const saveAug: B100Balance = {
    id: 'save-2026-08',
    tipoSubcuenta: 'save',
    mes: '2026-08',
    balanceMensual: 3000,
    dineroTotalRepartir: 10,
    aporteMensual: 50,
    dineroHacienda: 1.9,
    porcentajeHacienda: 19,
  };

  const saveSep: B100Balance = {
    id: 'save-2026-09',
    tipoSubcuenta: 'save',
    mes: '2026-09',
    balanceMensual: 3200,
    dineroTotalRepartir: 12,
    aporteMensual: 100,
    dineroHacienda: 2.28,
    porcentajeHacienda: 19,
  };

  beforeEach(() => {
    balances = [];

    serviceMock = {
      currentYear: signal(2026),
      currentMonth: signal(9),
      loadB100History: jasmine.createSpy('loadB100History'),
      getB100BalancesByTipo: jasmine.createSpy('getB100BalancesByTipo')
        .and.callFake((tipo: B100Subcuenta) => balances.filter(b => b.tipoSubcuenta === tipo)),
      getB100Balance: jasmine.createSpy('getB100Balance')
        .and.callFake((tipo: B100Subcuenta, year: number, month: number) => {
          const mes = `${year}-${String(month).padStart(2, '0')}`;
          return balances.find(b => b.tipoSubcuenta === tipo && b.mes === mes);
        }),
      saveB100Balance: jasmine.createSpy('saveB100Balance').and.returnValue(of({} as B100Balance)),
      deleteB100Balance: jasmine.createSpy('deleteB100Balance').and.returnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: FinancialDataService, useValue: serviceMock }],
    });
  });

  function createFixture(month: number): ComponentFixture<B100FormComponent> {
    serviceMock.currentMonth.set(month);
    const fixture = TestBed.createComponent(B100FormComponent);
    fixture.componentRef.setInput('accounts', [] as Account[]);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createFixture(9);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('carga el historial de Save y Health partiendo del mes seleccionado', () => {
    createFixture(9);

    expect(serviceMock.loadB100History).toHaveBeenCalledWith('save', 2026, 9);
    expect(serviceMock.loadB100History).toHaveBeenCalledWith('health', 2026, 9);
  });

  it('en septiembre el historial de Save muestra septiembre y agosto', () => {
    balances = [saveAug, saveSep];
    const fixture = createFixture(9);

    const saveTable = fixture.nativeElement.querySelectorAll('app-b100-history-table')[0];
    const rows = saveTable.querySelectorAll('tbody tr') as HTMLElement[];

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Septiembre 2026');
    expect(rows[1].textContent).toContain('Agosto 2026');
  });

  it('en agosto el historial de Save solo muestra agosto (descartando septiembre)', () => {
    balances = [saveAug, saveSep];
    const fixture = createFixture(8);

    const saveTable = fixture.nativeElement.querySelectorAll('app-b100-history-table')[0];
    const rows = saveTable.querySelectorAll('tbody tr') as HTMLElement[];

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Agosto 2026');
  });

  it('precarga los campos y muestra "Actualizar balance" si el mes ya tiene balance', () => {
    balances = [saveSep];
    const fixture = createFixture(9);

    const comp = fixture.componentInstance as any;
    expect(comp.savingsBalance()).toBe(3200);
    expect(comp.savingsTotalRepartir()).toBe(12);
    expect(comp.editingSavings()).toBeTruthy();

    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    expect(buttons.some(b => b.textContent?.trim() === 'Actualizar balance')).toBeTrue();
  });

  it('guarda el balance del mes con los campos rellenados', () => {
    const fixture = createFixture(9);

    const balanceInput = fixture.nativeElement.querySelectorAll('input')[0] as HTMLInputElement;
    balanceInput.value = '4000';
    balanceInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const guardarButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Guardar') as HTMLButtonElement;
    guardarButton.click();
    fixture.detectChanges();

    expect(serviceMock.saveB100Balance).toHaveBeenCalledWith(
      'save', 2026, 9,
      jasmine.objectContaining({ balanceMensual: 4000, dineroTotalRepartir: 0, porcentajeHacienda: 19 }),
    );

    const comp = fixture.componentInstance as any;
    expect(comp.savedSavings()).toBeTrue();
    expect(comp.savingsBalance()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Guardado');
  });

  it('elimina un balance pulsando el botón de eliminar del historial', () => {
    balances = [saveAug, saveSep];
    const fixture = createFixture(9);

    const saveTable = fixture.nativeElement.querySelectorAll('app-b100-history-table')[0];
    const deleteButton = saveTable.querySelector('button[title="Eliminar registro"]') as HTMLButtonElement;
    deleteButton.click();

    expect(serviceMock.deleteB100Balance).toHaveBeenCalledWith('save-2026-09');
  });

  it('editar un balance del historial lo carga en el formulario', () => {
    balances = [saveAug, saveSep];
    const fixture = createFixture(9);

    const saveTable = fixture.nativeElement.querySelectorAll('app-b100-history-table')[0];
    const editButtons = saveTable.querySelectorAll('button[title="Editar registro"]');
    (editButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    expect(comp.savingsBalance()).toBe(3000);
    expect(comp.editingSavings()).toBeTruthy();
  });
});