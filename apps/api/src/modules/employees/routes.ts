import {
  config,
  employeeCreateSchema,
  employeeUpdateSchema,
  filtersSchema,
  listQuerySchema,
  salaryChangeSchema,
} from '@acme/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError } from '../../errors.ts';
import { requireUser } from '../../plugins/auth.ts';
import type { EmployeeService } from './service.ts';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

/** A bad id is "not found", not a validation error. */
function parseId(params: unknown): number {
  const result = paramsSchema.safeParse(params);
  if (!result.success) throw new AppError('NOT_FOUND');
  return result.data.id;
}

export function employeeRoutes(
  app: FastifyInstance,
  { employees }: { employees: EmployeeService },
) {
  app.get('/api/employees', (request) => employees.list(listQuerySchema.parse(request.query)));

  app.get('/api/employees/facets', (request) =>
    employees.facets(filtersSchema.parse(request.query)),
  );

  // Static path, so find-my-way picks it over `/api/employees/:id`.
  app.get('/api/employees/export.csv', async (request, reply) => {
    const { sort, page: _p, pageSize: _s, ...filters } = listQuerySchema.parse(request.query);
    const csv = await employees.exportCsv(filters, sort);
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${config.csv.filename}"`)
      .send(csv);
  });

  app.get('/api/employees/:id', (request) => employees.get(parseId(request.params)));

  app.post('/api/employees', async (request, reply) => {
    const input = employeeCreateSchema.parse(request.body);
    const employee = await employees.create(input, requireUser(request).id);
    return reply.status(201).send(employee);
  });

  app.patch('/api/employees/:id', (request) =>
    employees.update(parseId(request.params), employeeUpdateSchema.parse(request.body)),
  );

  app.delete('/api/employees/:id', async (request, reply) => {
    await employees.remove(parseId(request.params));
    return reply.status(204).send();
  });

  app.post('/api/employees/:id/salary-changes', (request) =>
    employees.changeSalary(
      parseId(request.params),
      salaryChangeSchema.parse(request.body),
      requireUser(request).id,
    ),
  );

  app.get('/api/employees/:id/salary-history', (request) =>
    employees.salaryHistory(parseId(request.params)),
  );
}
