import { describe, it, expect } from 'vitest';
import { SqlQueryBuilder } from './index.js';

describe('SqlQueryBuilder', () => {
  it('correctly tracks positional parameters', () => {
    const qb = new SqlQueryBuilder();
    const p1 = qb.addParam('active');
    const p2 = qb.addParam(42);

    expect(p1).toBe('$1');
    expect(p2).toBe('$2');
    expect(qb.getValues()).toEqual(['active', 42]);
    expect(qb.paramCount).toBe(2);
  });

  it('builds WHERE clauses with automatic token mapping', () => {
    const qb = new SqlQueryBuilder(['initial-org-id']);
    qb.addRawWhere('c.org_id = $1');
    qb.addWhere('c.status =', 'pending');
    qb.addWhere('c.age >=', 18);

    expect(qb.getWhereClause()).toBe('WHERE c.org_id = $1 AND c.status = $2 AND c.age >= $3');
    expect(qb.getValues()).toEqual(['initial-org-id', 'pending', 18]);
  });

  it('handles pagination parameters accurately', () => {
    const qb = new SqlQueryBuilder(['org-123']);
    qb.addRawWhere('c.org_id = $1');

    const { limitParam, offsetParam } = qb.paginate(25, 50);

    expect(limitParam).toBe('$2');
    expect(offsetParam).toBe('$3');
    expect(qb.getValues()).toEqual(['org-123', 25, 50]);
  });

  it('returns empty string when no WHERE conditions are added', () => {
    const qb = new SqlQueryBuilder();
    expect(qb.getWhereClause()).toBe('');
  });
});
