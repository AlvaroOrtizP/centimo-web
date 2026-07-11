/**
 * Definición de un fondo de inversión en MyInvestor.
 *
 * Reglas de negocio para el backend (Swagger):
 * - Al borrar un fondo se realiza borrado lógico (deletedAt), no se elimina el registro.
 * - No se puede crear un fondo con el mismo `code` si ya existe uno activo (no borrado) con ese código.
 * - No se puede duplicar un fondo con el mismo `code` + `purchaseDate` (permite recomprar
 *   el mismo fondo en otra fecha distinta).
 */
export interface MyInvestorFund {
  id: string;
  code: string;
  name: string;
}
