// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

describe('Drizzle PostgreSQL escaping', () => {
  const dialect = new PgDialect();
  it('escapes embedded quotes in identifiers', () => {
    const identifier = 'name"; DROP TABLE bookings; --';
    const query = dialect.sqlToQuery(sql`SELECT ${sql.identifier(identifier)}`);
    expect(query.sql).toBe('SELECT "name""; DROP TABLE bookings; --"');
  });
  it('keeps hostile values as bound parameters', () => {
    const value = "'; DROP TABLE bookings; --";
    const query = dialect.sqlToQuery(sql`SELECT * FROM bookings WHERE email = ${value}`);
    expect(query.sql).toBe('SELECT * FROM bookings WHERE email = $1');
    expect(query.params).toEqual([value]);
  });
});
