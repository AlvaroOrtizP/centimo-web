import { DashboardCategoria } from '../../api/generated/model/dashboardCategoria';

export const DASHBOARD_GASTOS_CODE = 'gastos';

export const DASHBOARD_DEFAULT_MESES_ATRAS = 6;

export const DASHBOARD_ENTITY_ORDER: string[] = [
  'revolut', 'bbva', 'caixabank', 'b100',
  'equito', 'urbanitae', 'mintos', 'myinvestor',
  'acciones', 'crypto',
];

export const DASHBOARD_ENTITY_NAMES: Record<string, string> = {
  revolut: 'Revolut',
  bbva: 'BBVA',
  caixabank: 'CaixaBank',
  b100: 'B100',
  equito: 'Equito',
  urbanitae: 'Urbanitae',
  mintos: 'Mintos',
  myinvestor: 'MyInvestor',
  acciones: 'Acciones',
  crypto: 'Cripto',
  [DASHBOARD_GASTOS_CODE]: 'Gastos',
};

export const DASHBOARD_ENTITY_COLORS: Record<string, string> = {
  revolut: '#0066FF',
  bbva: '#154481',
  caixabank: '#007AB5',
  b100: '#00A3E0',
  equito: '#8B5CF6',
  urbanitae: '#F59E0B',
  mintos: '#10B981',
  myinvestor: '#6366F1',
  acciones: '#3B82F6',
  crypto: '#F97316',
  [DASHBOARD_GASTOS_CODE]: '#EF4444',
};

export const DASHBOARD_CATEGORIAS: Record<DashboardCategoria, string[]> = {
  [DashboardCategoria.Liquidez]: ['revolut', 'bbva', 'caixabank', 'b100'],
  [DashboardCategoria.Fija]: ['mintos', 'equito', 'urbanitae'],
  [DashboardCategoria.Variable]: ['myinvestor', 'crypto', 'acciones'],
  [DashboardCategoria.Todas]: [
    'revolut', 'bbva', 'caixabank', 'b100',
    'mintos', 'equito', 'urbanitae',
    'myinvestor', 'crypto', 'acciones',
  ],
};

export const DASHBOARD_CATEGORIA_OPTIONS: { value: DashboardCategoria; label: string }[] = [
  { value: DashboardCategoria.Todas, label: 'Todas' },
  { value: DashboardCategoria.Liquidez, label: 'Liquidez' },
  { value: DashboardCategoria.Fija, label: 'Fija' },
  { value: DashboardCategoria.Variable, label: 'Variable' },
];