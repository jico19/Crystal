/**
 * Parameterized SQL Query Builder Helper
 * Prevents off-by-one errors with PostgreSQL positional parameters ($1, $2, ...)
 * Supports immutable parameter slicing for parallel COUNT(*) and paginated SELECT queries.
 */
export class SqlQueryBuilder {
  private values: unknown[] = [];
  private whereClauses: string[] = [];

  constructor(initialValues: unknown[] = []) {
    this.values = [...initialValues];
  }

  /**
   * Add a value and return its 1-based parameter token ($N)
   */
  addParam(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  /**
   * Add a condition with automatic parameter placement
   * e.g. addWhere('c.status =', status) -> 'c.status = $2'
   */
  addWhere(clause: string, value?: unknown): this {
    if (value !== undefined) {
      const placeholder = this.addParam(value);
      this.whereClauses.push(`${clause} ${placeholder}`);
    } else {
      this.whereClauses.push(clause);
    }
    return this;
  }

  /**
   * Add a raw condition without parameters
   */
  addRawWhere(clause: string): this {
    this.whereClauses.push(clause);
    return this;
  }

  /**
   * Build WHERE clause
   */
  getWhereClause(prefix: string = 'WHERE'): string {
    if (this.whereClauses.length === 0) return '';
    return `${prefix} ${this.whereClauses.join(' AND ')}`;
  }

  /**
   * Add pagination (limit & offset) parameters to builder
   */
  paginate(limit: number, offset: number): { limitParam: string; offsetParam: string } {
    const limitParam = this.addParam(limit);
    const offsetParam = this.addParam(offset);
    return { limitParam, offsetParam };
  }

  /**
   * Get all accumulated positional parameter values
   */
  getValues(): unknown[] {
    return [...this.values];
  }

  /**
   * Current parameter count
   */
  get paramCount(): number {
    return this.values.length;
  }
}
