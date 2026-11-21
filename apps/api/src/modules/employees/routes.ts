import type { Db } from '@acme/db';
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  listQuerySchema,
  salaryChangeSchema,
} from '@acme/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError } from '../../errors.ts';
import * as service from './service.ts';

const idSchema = z.coerce.number().int().positive();

/** A bad id is "not found", not a validation error. */
function parseId(params: unknown): number {
  const result = idSchema.safeParse((params as { id?: unknown }).id);
  if (!result.success) throw new AppError('NOT_FOUND');
  return result.data;
}

export function employeeRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/api/employees', (request) => service.list(db, listQuerySchema.parse(request.query)));

  // Static path, so find-my-way picks it over `/api/employees/:id`.
  app.get('/api/employees/export.csv', async (request, reply) => {
    const { sort, page: _p, pageSize: _s, ...filters } = listQuerySchema.parse(request.query);
    const csv = await service.exportCsv(db, filters, sort);
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="employees.csv"')
      .send(csv);
  });

  app.get('/api/employees/:id', (request) => service.get(db, parseId(request.params)));

  app.post('/api/employees', async (request, reply) => {
    const input = employeeCreateSchema.parse(request.body);
    const employee = await service.create(db, input, request.user!.id);
    return reply.status(201).send(employee);
  });

  app.patch('/api/employees/:id', (request) =>
    service.update(db, parseId(request.params), employeeUpdateSchema.parse(request.body)),
  );

  app.delete('/api/employees/:id', async (request, reply) => {
    await service.remove(db, parseId(request.params));
    return reply.status(204).send();
  });

  app.post('/api/employees/:id/salary-changes', (request) =>
    service.changeEmployeeSalary(
      db,
      parseId(request.params),
      salaryChangeSchema.parse(request.body),
      request.user!.id,
    ),
  );

  app.get('/api/employees/:id/salary-history', (request) =>
    service.salaryHistory(db, parseId(request.params)),
  );
}
