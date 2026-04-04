import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { db, initializeDatabase } from './server/database.ts';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import fs from 'fs';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initializeDatabase();
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.use(cors());
  app.use(express.json());

  // Setup morgan logger
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));
  app.use(morgan('dev')); // Also log to console for development

  const getDashboardData = async () => {
    const totalBilled =
      (await db
                .prepare(
                  "SELECT SUM(total) as value FROM invoices WHERE issueDate >= date('now', '-30 days')"
                )
                .get() as any)?.value || 0;

    const totalCollected =
      (await db
                .prepare(
                  "SELECT SUM(amount) as value FROM payments WHERE date >= date('now', '-30 days')"
                )
                .get() as any)?.value || 0;

    const activeCustomers =
      (await db.prepare("SELECT count(*) as value FROM customers").get() as any)?.value || 0;

    const overdueAccounts =
      (await db
                .prepare(
                  "SELECT count(*) as value FROM invoices WHERE status = 'Overdue'"
                )
                .get() as any)?.value || 0;

    const revenueData = (await db
          .prepare(`
        WITH RECURSIVE months(m) AS (
          SELECT date('now', 'start of month')
          UNION ALL
          SELECT date(m, '-1 month')
          FROM months
          WHERE m > date('now', 'start of month', '-5 months')
        )
        SELECT
          strftime('%b', m) as month,
          (
            SELECT IFNULL(SUM(total), 0)
            FROM invoices
            WHERE strftime('%Y-%m', issueDate) = strftime('%Y-%m', m)
          ) as billed,
          (
            SELECT IFNULL(SUM(amount), 0)
            FROM payments
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', m)
          ) as collected
        FROM months
        ORDER BY m ASC
      `)
          .all());

    const agingData = [
      {
        name: '0-30 Days',
        value:
          (await db
                        .prepare(
                          "SELECT SUM(total) as v FROM invoices WHERE status = 'Due' AND dueDate >= date('now', '-30 days')"
                        )
                        .get() as any)?.v || 0,
        fill: '#3b82f6',
      },
      {
        name: '31-60 Days',
        value:
          (await db
                        .prepare(
                          "SELECT SUM(total) as v FROM invoices WHERE status = 'Overdue' AND dueDate BETWEEN date('now', '-60 days') AND date('now', '-31 days')"
                        )
                        .get() as any)?.v || 0,
        fill: '#f59e0b',
      },
      {
        name: '61-90 Days',
        value:
          (await db
                        .prepare(
                          "SELECT SUM(total) as v FROM invoices WHERE status = 'Overdue' AND dueDate BETWEEN date('now', '-90 days') AND date('now', '-61 days')"
                        )
                        .get() as any)?.v || 0,
        fill: '#ef4444',
      },
      {
        name: '90+ Days',
        value:
          (await db
                        .prepare(
                          "SELECT SUM(total) as v FROM invoices WHERE status = 'Overdue' AND dueDate < date('now', '-90 days')"
                        )
                        .get() as any)?.v || 0,
        fill: '#7f1d1d',
      },
    ];

    const defaulters = (await db
          .prepare(
            "SELECT id, customerName as name, customerAccount as account, total as amountDue, CAST(julianday('now') - julianday(dueDate) AS INTEGER) as daysOverdue FROM invoices WHERE status = 'Overdue' ORDER BY amountDue DESC LIMIT 5"
          )
          .all());

    const recentPayments = (await db
          .prepare('SELECT * FROM payments ORDER BY date DESC LIMIT 4')
          .all());

    return {
      kpiData: [
        {
          title: 'Total Billed (Month)',
          value: `KES ${Number(totalBilled).toLocaleString()}`,
          change: '+5.2%',
          changeType: 'increase',
        },
        {
          title: 'Total Collected (Month)',
          value: `KES ${Number(totalCollected).toLocaleString()}`,
          change: '+8.1%',
          changeType: 'increase',
        },
        {
          title: 'Active Customers',
          value: Number(activeCustomers).toLocaleString(),
          change: '+25',
          changeType: 'increase',
        },
        {
          title: 'Overdue Accounts',
          value: Number(overdueAccounts).toLocaleString(),
          change: '-3.4%',
          changeType: 'decrease',
        },
      ],
      revenueData,
      agingData,
      defaulters,
      recentPayments,
      nrwData: [
        { day: 'Mon', percentage: 18.5 },
        { day: 'Tue', percentage: 19.2 },
        { day: 'Wed', percentage: 17.8 },
        { day: 'Thu', percentage: 20.1 },
        { day: 'Fri', percentage: 19.5 },
        { day: 'Sat', percentage: 21.3 },
        { day: 'Sun', percentage: 20.8 },
      ],
    };
  };

  const broadcastDashboardUpdate = () => {
    try {
      io.emit('dashboard_update', getDashboardData());
    } catch (err) {
      console.error('Failed to broadcast dashboard update:', err);
    }
  };

  io.on('connection', (socket) => {
    console.log('Client connected to socket.io');
    socket.emit('dashboard_update', getDashboardData());
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  const normalizeCustomerAccount = async (value?: string | null) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;

    const byAccount = (await db
          .prepare('SELECT accountNumber FROM customers WHERE accountNumber = ?')
          .get(trimmed) as any);
    if (byAccount?.accountNumber) return byAccount.accountNumber;

    const byId = (await db
          .prepare('SELECT accountNumber FROM customers WHERE id = ?')
          .get(trimmed) as any);
    if (byId?.accountNumber) return byId.accountNumber;

    return trimmed;
  };

  const checkRole = (roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const userRole = req.headers['x-user-role'] as string;
      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      next();
    };
  };

  const logAudit = async (
    req: express.Request,
    actionType: string,
    entityType: string,
    entityId: string | null,
    details: string
  ) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'System';
      const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';
      (await db.prepare(
                'INSERT INTO audit_logs (actorId, actionType, entityType, entityId, ipAddress, details) VALUES (?, ?, ?, ?, ?, ?)'
              ).run(userId, actionType, entityType, entityId, ipAddress, details));
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  // --- AUTHENTICATION ---
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = (await db
              .prepare(
                'SELECT id, name, email, role, status FROM users WHERE email = ? AND password = ?'
              )
              .get(email, password) as any);

      if (user) {
        if (user.status === 'Inactive') {
          return res.status(403).json({ message: 'Account is deactivated' });
        }

        (await db.prepare('UPDATE users SET lastActive = ? WHERE id = ?').run(
          new Date().toISOString(),
          user.id
        ));

        res.json({ success: true, user });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  });

  // --- DASHBOARD ---
  app.get('/api/dashboard', async (req, res) => {
    try {
      res.json(getDashboardData());
    } catch (error: any) {
      res
        .status(500)
        .json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
  });

  // --- CUSTOMERS ---
  app.get('/api/customers', async (req, res) => {
    try {
      const { q, sortKey, sortDir, page = 1, limit = 10 } = req.query;

      let query = 'SELECT * FROM customers';
      const params: any[] = [];

      if (q) {
        query += ' WHERE name LIKE ? OR accountNumber LIKE ? OR email LIKE ?';
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }

      if (sortKey && sortDir) {
        query += ` ORDER BY ${sortKey} ${sortDir === 'descending' ? 'DESC' : 'ASC'}`;
      } else {
        query += ' ORDER BY joinDate DESC';
      }

      const totalItemsQuery = q
        ? 'SELECT COUNT(*) as count FROM customers WHERE name LIKE ? OR accountNumber LIKE ? OR email LIKE ?'
        : 'SELECT COUNT(*) as count FROM customers';

      const totalItems =
        (await db
                    .prepare(totalItemsQuery)
                    .get(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []) as any)?.count || 0;

      if (limit !== 'all') {
        const parsedLimit = parseInt(limit as string) || 10;
        const parsedPage = parseInt(page as string) || 1;
        query += ' LIMIT ? OFFSET ?';
        params.push(parsedLimit, (parsedPage - 1) * parsedLimit);
      }

      const customers = (await db.prepare(query).all(...params));
      res.json({ customers, totalItems });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const customer = (await db
              .prepare('SELECT * FROM customers WHERE id = ?')
              .get(req.params.id) as any);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const invoices = (await db
              .prepare('SELECT * FROM invoices WHERE customerAccount = ? ORDER BY issueDate DESC')
              .all(customer.accountNumber) as any[]);

      for (const inv of invoices) {
        inv.items = (await db
                  .prepare('SELECT * FROM invoice_items WHERE invoiceId = ? ORDER BY id ASC')
                  .all(inv.id));
      }

      const payments = (await db
              .prepare('SELECT * FROM payments WHERE customerName = ? ORDER BY date DESC')
              .all(customer.name));

      const meters = (await db
              .prepare('SELECT * FROM meters WHERE customerAccount = ?')
              .all(customer.accountNumber));

      const outstandingBalance =
        (await db
                    .prepare(
                      "SELECT SUM(total) as totalDue FROM invoices WHERE customerAccount = ? AND status IN ('Due', 'Overdue')"
                    )
                    .get(customer.accountNumber) as any)?.totalDue || 0;

      res.json({
        customer,
        history: { invoices, payments },
        meters,
        outstandingBalance,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ message: 'Failed to fetch customer profile', error: err.message });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;
      const last = (await db.prepare('SELECT id FROM customers ORDER BY id DESC LIMIT 1').get() as any);
      const nextIdNum = last ? parseInt(last.id.split('-')[1], 10) + 1 : 1001;
      const id = `CUST-${nextIdNum}`;
      const acc = `ACC-${20000 + nextIdNum}`;

      (await db.prepare(
        'INSERT INTO customers (id, accountNumber, name, email, phone, address, joinDate) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, acc, name, email, phone, address, new Date().toISOString().split('T')[0]));

      logAudit(req, 'CREATE', 'Customer', id, `Created customer ${name} (${acc})`);
      broadcastDashboardUpdate();
      res.status(201).json({ id, accountNumber: acc });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create customer', error: err.message });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;
      (await db.prepare(
                'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?'
              ).run(name, email, phone, address, req.params.id));

      logAudit(req, 'UPDATE', 'Customer', req.params.id, `Updated customer ${name}`);
      broadcastDashboardUpdate();
      res.json({ message: 'Updated' });
    } catch (err: any) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  });

  // --- METERS ---
  app.get('/api/meters', async (req, res) => {
    try {
      const { q, status } = req.query;

      let query = 'SELECT * FROM meters';
      const params: any[] = [];

      if (q || status) {
        query += ' WHERE ';
        const conditions: string[] = [];

        if (q) {
          conditions.push('(serialNumber LIKE ? OR customerAccount LIKE ?)');
          params.push(`%${q}%`, `%${q}%`);
        }

        if (status) {
          conditions.push('status = ?');
          params.push(status);
        }

        query += conditions.join(' AND ');
      }

      res.json({
        meters: (await db.prepare(query).all(...params)),
        readings: (await db.prepare('SELECT * FROM meter_readings ORDER BY date DESC').all()),
        history: (await db.prepare('SELECT * FROM meter_status_history ORDER BY date DESC').all()),
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch meters', error: err.message });
    }
  });

  app.get('/api/meters/:id', async (req, res) => {
    try {
      const meter = (await db.prepare('SELECT * FROM meters WHERE id = ?').get(req.params.id));

      if (!meter) {
        return res.status(404).json({ message: 'Not found' });
      }

      res.json({
        meter,
        readings: (await db
                  .prepare('SELECT * FROM meter_readings WHERE meterId = ? ORDER BY date DESC')
                  .all(req.params.id)),
        history: (await db
                  .prepare('SELECT * FROM meter_status_history WHERE meterId = ? ORDER BY date DESC')
                  .all(req.params.id)),
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Fetch failed', error: err.message });
    }
  });

  app.post('/api/meters', async (req, res) => {
    try {
      const { serialNumber, customerAccount, status, installationDate, initialReading } = req.body;

      if (!serialNumber || !installationDate) {
        return res
          .status(400)
          .json({ message: 'Serial number and installation date are required' });
      }

      const normalizedAccount = normalizeCustomerAccount(customerAccount);

      if (normalizedAccount) {
        const exists = (await db
                  .prepare('SELECT 1 as ok FROM customers WHERE accountNumber = ?')
                  .get(normalizedAccount) as any);

        if (!exists?.ok) {
          return res.status(400).json({
            message: 'Customer account not found. Use a valid account number or customer ID.',
          });
        }
      }

      const meterId = `M-${Date.now()}`;
      const meterStatus = status || 'Active';

      db.transaction(async () => {
        (await db.prepare(
                    'INSERT INTO meters (id, serialNumber, customerAccount, status, installationDate) VALUES (?, ?, ?, ?, ?)'
                  ).run(meterId, serialNumber, normalizedAccount, meterStatus, installationDate));

        if (
          initialReading !== undefined &&
          initialReading !== null &&
          initialReading !== ''
        ) {
          const readingId = `R-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          (await db.prepare(
                        'INSERT INTO meter_readings (id, meterId, reading, date) VALUES (?, ?, ?, ?)'
                      ).run(readingId, meterId, Number(initialReading) || 0, installationDate));
        }
      })();

      logAudit(req, 'CREATE', 'Meter', meterId, `Created meter ${serialNumber}`);
      res.status(201).json({ id: meterId });
    } catch (err: any) {
      res.status(500).json({ message: 'Create failed', error: err.message });
    }
  });

  app.put('/api/meters/:id', async (req, res) => {
    try {
      const { serialNumber, customerAccount, status, installationDate } = req.body;
      const oldStatus = ((await db
              .prepare('SELECT status FROM meters WHERE id = ?')
              .get(req.params.id) as any)?.status);

      db.transaction(async () => {
        (await db.prepare(
                    'UPDATE meters SET serialNumber = ?, customerAccount = ?, status = ?, installationDate = ? WHERE id = ?'
                  ).run(serialNumber, customerAccount, status, installationDate, req.params.id));

        if (oldStatus && oldStatus !== status) {
          (await db.prepare(
                        'INSERT INTO meter_status_history (meterId, date, fromStatus, toStatus) VALUES (?, ?, ?, ?)'
                      ).run(req.params.id, new Date().toISOString().split('T')[0], oldStatus, status));
        }
      })();

      logAudit(req, 'UPDATE', 'Meter', req.params.id, `Updated meter ${serialNumber}`);
      res.json({ message: 'Updated' });
    } catch (err: any) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  });

  app.post('/api/meters/:id/readings', async (req, res) => {
    try {
      const { reading, date } = req.body;
      const id = `R-${Date.now()}`;

      (await db.prepare(
                'INSERT INTO meter_readings (id, meterId, reading, date) VALUES (?, ?, ?, ?)'
              ).run(id, req.params.id, reading, date));

      logAudit(req, 'CREATE', 'Reading', id, `Added reading ${reading} to meter ${req.params.id}`);
      res.status(201).json({ id });
    } catch (err: any) {
      res.status(500).json({ message: 'Add reading failed', error: err.message });
    }
  });

  // --- INVOICES ---
  app.get('/api/invoices', async (req, res) => {
    try {
      const { page = 1, limit = 10, status, q } = req.query;

      let query = 'SELECT * FROM invoices';
      const params: any[] = [];

      if (status || q) {
        query += ' WHERE ';
        const conditions: string[] = [];

        if (status && status !== 'All') {
          conditions.push('status = ?');
          params.push(status);
        }

        if (q) {
          conditions.push('(customerName LIKE ? OR customerAccount LIKE ? OR id LIKE ?)');
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        query += conditions.join(' AND ');
      }

      query += ' ORDER BY issueDate DESC';

      const total =
        (await db
                    .prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'))
                    .get(...params) as any)?.count || 0;

      const l = parseInt(limit as string, 10);
      query += ' LIMIT ? OFFSET ?';
      params.push(l, (parseInt(page as string, 10) - 1) * l);

      res.json({ invoices: (await db.prepare(query).all(...params)), totalItems: total });
    } catch (err: any) {
      res.status(500).json({ message: 'Invoice fetch error', error: err.message });
    }
  });

 /* app.get('/api/invoices/:id', async (req, res) => {
    try {
      const invoice = db
        .prepare('SELECT * FROM invoices WHERE id = ?')
        .get(req.params.id) as any;

      if (!invoice) {
        return res.status(404).json({ message: 'Not found' });
      }

      invoice.items = db
        .prepare('SELECT * FROM invoice_items WHERE invoiceId = ?')
        .all(req.params.id);

      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ message: 'Fetch failed', error: err.message });
    }
  }); **/

  app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = (await db
          .prepare('SELECT * FROM invoices WHERE id = ?')
          .get(req.params.id) as any);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const items = (await db
          .prepare('SELECT * FROM invoice_items WHERE invoiceId = ? ORDER BY id ASC')
          .all(req.params.id));

    const payments = (await db
          .prepare('SELECT * FROM payments WHERE invoiceId = ? ORDER BY date DESC')
          .all(req.params.id));

    res.json({
      invoice,
      items,
      payments
    });

  } catch (err: any) {
    res.status(500).json({
      message: 'Failed to fetch invoice details',
      error: err.message
    });
  }
});

  app.post('/api/invoices', async (req, res) => {
    try {
      const { customerId, issueDate, dueDate, items, status } = req.body;
      
      const customer = (await db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const last = (await db.prepare('SELECT id FROM invoices ORDER BY id DESC LIMIT 1').get() as any);
      const nextIdNum = last ? parseInt(last.id.split('-').pop(), 10) + 1 : 1001;
      const id = `INV-${new Date().getFullYear()}-${String(nextIdNum).padStart(4, '0')}`;

      let subtotal = 0;
      for (const item of items) {
        subtotal += Number(item.quantity) * Number(item.unitPrice);
      }
      const penalties = status === 'Overdue' ? subtotal * 0.1 : 0;
      const total = subtotal + penalties;

      db.transaction(async () => {
        (await db.prepare(
                    'INSERT INTO invoices (id, customerName, customerAccount, customerAddress, issueDate, generationDate, dueDate, subtotal, penalties, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                  ).run(id, customer.name, customer.accountNumber, customer.address, issueDate, new Date().toISOString().split('T')[0], dueDate, subtotal, penalties, total, status));

        const insertItem = db.prepare('INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)');
        for (const item of items) {
          const itemTotal = Number(item.quantity) * Number(item.unitPrice);
          (await insertItem.run(id, item.description, item.quantity, item.unitPrice, itemTotal));
        }
      })();

      logAudit(req, 'CREATE', 'Invoice', id, `Created invoice for ${customer.name}`);
      broadcastDashboardUpdate();
      res.status(201).json({ id });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create invoice', error: err.message });
    }
  });

  app.put('/api/invoices/:id', async (req, res) => {
    try {
      const { customerId, issueDate, dueDate, items, status } = req.body;
      const id = req.params.id;
      
      const customer = (await db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      let subtotal = 0;
      for (const item of items) {
        subtotal += Number(item.quantity) * Number(item.unitPrice);
      }
      const penalties = status === 'Overdue' ? subtotal * 0.1 : 0;
      const total = subtotal + penalties;

      db.transaction(async () => {
        (await db.prepare(
                    'UPDATE invoices SET customerName = ?, customerAccount = ?, customerAddress = ?, issueDate = ?, dueDate = ?, subtotal = ?, penalties = ?, total = ?, status = ? WHERE id = ?'
                  ).run(customer.name, customer.accountNumber, customer.address, issueDate, dueDate, subtotal, penalties, total, status, id));

        (await db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(id));
        
        const insertItem = db.prepare('INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)');
        for (const item of items) {
          const itemTotal = Number(item.quantity) * Number(item.unitPrice);
          (await insertItem.run(id, item.description, item.quantity, item.unitPrice, itemTotal));
        }
      })();

      logAudit(req, 'UPDATE', 'Invoice', id, `Updated invoice ${id}`);
      broadcastDashboardUpdate();
      res.json({ id });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update invoice', error: err.message });
    }
  });

  app.get('/api/invoices/bulk/preview', async (req, res) => {
    try {
      const unitPrice = Number(req.query.unitPrice || 110);
      const serviceFee = 350;

      const rows = (await db
              .prepare(`
          SELECT
            c.id as customerId,
            c.name,
            c.accountNumber,
            c.address,
            m.id as meterId,
            m.serialNumber
          FROM customers c
          INNER JOIN meters m ON m.customerAccount = c.accountNumber
          WHERE m.status = 'Active'
          ORDER BY c.name ASC
        `)
              .all() as any[]);

      const preview = rows.map(async (row) => {
        const readings = (await db
                  .prepare(
                    'SELECT reading, date FROM meter_readings WHERE meterId = ? ORDER BY date DESC, id DESC LIMIT 2'
                  )
                  .all(row.meterId) as any[]);

        const currentReading = Number(readings[0]?.reading || 0);
        const previousReading = Number(readings[1]?.reading || 0);
        const consumption = Math.max(0, currentReading - previousReading);

        return {
          customerId: row.customerId,
          name: row.name,
          accountNumber: row.accountNumber,
          address: row.address,
          meterId: row.meterId,
          serialNumber: row.serialNumber,
          currentReading,
          previousReading,
          consumption,
          total: consumption * unitPrice + serviceFee,
        };
      });

      res.json(preview);
    } catch (err: any) {
      res.status(500).json({ message: 'Preview generation failed', error: err.message });
    }
  });

  const generateBulkInvoices = (req: any, res: any) => {
    try {
      const { batch, dueDate, issueDate, unitPrice } = req.body;
      const items = Array.isArray(batch) ? batch : [];

      if (items.length === 0) {
        return res.status(400).json({ message: 'No billable customers were selected.' });
      }

      const serviceFee = 350;
      let created = 0;

      db.transaction(async () => {
        for (const item of items) {
          const customer = (await db
                      .prepare('SELECT * FROM customers WHERE id = ? OR accountNumber = ?')
                      .get(item.customerId, item.accountNumber) as any);
          if (!customer) continue;

          const meter = (await db
                      .prepare('SELECT * FROM meters WHERE id = ?')
                      .get(item.meterId) as any);
          if (!meter) continue;

          const readings = (await db
                      .prepare(
                        'SELECT reading, date FROM meter_readings WHERE meterId = ? ORDER BY date DESC, id DESC LIMIT 2'
                      )
                      .all(meter.id) as any[]);

          const currentReading = Number(readings[0]?.reading || 0);
          const previousReading = Number(readings[1]?.reading || 0);
          const consumption = Math.max(0, currentReading - previousReading);
          const usageTotal = consumption * Number(unitPrice || 110);
          const subtotal = usageTotal + serviceFee;
          const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

          (await db.prepare(
                        'INSERT INTO invoices (id, customerName, customerAccount, customerAddress, issueDate, generationDate, dueDate, subtotal, penalties, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                      ).run(
                        invoiceId,
                        customer.name,
                        customer.accountNumber,
                        customer.address,
                        issueDate,
                        new Date().toISOString().split('T')[0],
                        dueDate,
                        subtotal,
                        0,
                        subtotal,
                        'Due'
                      ));

          (await db.prepare(
                        'INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)'
                      ).run(
                        invoiceId,
                        `Water Usage (${consumption} m³)`,
                        consumption,
                        Number(unitPrice || 110),
                        usageTotal
                      ));

          (await db.prepare(
                        'INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)'
                      ).run(invoiceId, 'Service Fee', 1, serviceFee, serviceFee));

          created += 1;
        }
      })();

      broadcastDashboardUpdate();
      res.json({ success: true, created });
    } catch (err: any) {
      res.status(500).json({ message: 'Bulk generation failed', error: err.message });
    }
  };

  app.post('/api/invoices/bulk/generate', generateBulkInvoices);
  app.post('/api/invoices/bulk-generate', generateBulkInvoices);

  app.post('/api/invoices/:id/pay', async (req, res) => {
    try {
      const inv = (await db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any);

      if (!inv) {
        return res.status(404).json({ message: 'Not found' });
      }

      db.transaction(async () => {
        (await db.prepare('UPDATE invoices SET status = "Paid" WHERE id = ?').run(req.params.id));

        (await db.prepare(
          'INSERT INTO payments (id, customerName, amount, method, date, invoiceId) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          `RPT-${Date.now()}`,
          inv.customerName,
          inv.total,
          req.body.method || 'Manual',
          new Date().toISOString().split('T')[0],
          req.params.id
        ));
      })();

      logAudit(req, 'UPDATE', 'Invoice', req.params.id, `Marked invoice ${req.params.id} as Paid`);
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Payment failed', error: err.message });
    }
  });

  // --- PAYMENTS ---
  app.get('/api/payments', async (req, res) => {
    try {
      const { page = 1, limit = 10, q } = req.query;

      let query = 'SELECT * FROM payments';
      const params: any[] = [];

      if (q) {
        query += ' WHERE customerName LIKE ? OR invoiceId LIKE ?';
        params.push(`%${q}%`, `%${q}%`);
      }

      query += ' ORDER BY date DESC';

      const total =
        (await db
                    .prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'))
                    .get(...params) as any)?.count || 0;

      const l = parseInt(limit as string, 10);
      query += ' LIMIT ? OFFSET ?';
      params.push(l, (parseInt(page as string, 10) - 1) * l);

      res.json({ payments: (await db.prepare(query).all(...params)), totalItems: total });
    } catch (err: any) {
      res.status(500).json({ message: 'Payment fetch error', error: err.message });
    }
  });

  // --- SETTINGS ---
  app.get('/api/settings/billing', async (req, res) => {
    try {
      res.json((await db.prepare('SELECT * FROM billing_settings WHERE id = 1').get()));
    } catch (err: any) {
      res.status(500).json({ message: 'Settings fetch error', error: err.message });
    }
  });

  app.post('/api/settings/billing', async (req, res) => {
    const { frequency, generationDay, readingCutoffDays } = req.body;

    try {
      (await db.prepare(
                'UPDATE billing_settings SET frequency = ?, generationDay = ?, readingCutoffDays = ? WHERE id = 1'
              ).run(frequency, generationDay, readingCutoffDays));

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  });

  // --- USERS ---
  app.get('/api/users', checkRole(['Admin']), async (req, res) => {
    try {
      const users = (await db
              .prepare('SELECT id, name, email, role, lastActive, status FROM users ORDER BY name ASC')
              .all());

      res.json(users || []);
    } catch (err: any) {
      res.status(500).json({ message: 'User fetch error', error: err.message });
    }
  });

  app.post('/api/users', checkRole(['Admin']), async (req, res) => {
    const { name, email, role, password } = req.body;

    try {
      const existing = (await db.prepare('SELECT id FROM users WHERE email = ?').get(email));
      if (existing) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }

      const newId = `USR-${Date.now()}`;
      (await db.prepare(
        'INSERT INTO users (id, name, email, password, role, lastActive) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(newId, name, email, password || 'admin123', role, new Date().toISOString()));

      logAudit(req, 'CREATE', 'User', newId, `Created user ${name} (${email}) with role ${role}`);
      res.status(201).json({ success: true, id: newId });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to save user', error: err.message });
    }
  });

  app.put('/api/users/:id', checkRole(['Admin']), async (req, res) => {
    const { name, email, role, status } = req.body;
    try {
      (await db.prepare(
                'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?'
              ).run(name, email, role, status, req.params.id));
      
      logAudit(req, 'UPDATE', 'User', req.params.id as string, `Updated user ${name} (${email})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  });

  app.put('/api/users/:id/status', checkRole(['Admin']), async (req, res) => {
    try {
      const { status } = req.body;
      (await db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, req.params.id));
      logAudit(req, status === 'Active' ? 'ACTIVATE' : 'DEACTIVATE', 'User', req.params.id as string, `${status === 'Active' ? 'Activated' : 'Deactivated'} user ${req.params.id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Status update failed', error: err.message });
    }
  });

  app.delete('/api/users/:id', checkRole(['Admin']), async (req, res) => {
    try {
      (await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id));
      logAudit(req, 'DELETE', 'User', req.params.id as string, `Deleted user ${req.params.id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Deletion failed', error: err.message });
    }
  });

  // --- AUDIT LOGS ---
  app.get('/api/audit-logs', checkRole(['Admin']), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const actionType = req.query.actionType as string;
      const entityType = req.query.entityType as string;

      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      let countQuery = 'SELECT count(*) as count FROM audit_logs WHERE 1=1';
      const params: any[] = [];

      if (search) {
        query += ' AND (actorId LIKE ? OR details LIKE ? OR actionType LIKE ? OR entityType LIKE ?)';
        countQuery += ' AND (actorId LIKE ? OR details LIKE ? OR actionType LIKE ? OR entityType LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      if (actionType) {
        query += ' AND actionType = ?';
        countQuery += ' AND actionType = ?';
        params.push(actionType);
      }

      if (entityType) {
        query += ' AND entityType = ?';
        countQuery += ' AND entityType = ?';
        params.push(entityType);
      }

      query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      
      const logs = (await db.prepare(query).all(...params, limit, offset));
      const total = ((await db.prepare(countQuery).get(...params) as any).count);
      
      // Map database fields to what the frontend expects
      const mappedLogs = logs.map((log: any) => ({
        id: log.id,
        actorUserId: log.actorId,
        actorEmail: log.actorId, // We don't have email in audit_logs, just use actorId
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.timestamp
      }));

      res.json({ logs: mappedLogs, total });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch audit logs', error: err.message });
    }
  });

  // --- NOTIFICATIONS ---
  app.get('/api/notifications', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const notifications = (await db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50').all(userId));
      const unreadCount = (await db.prepare('SELECT count(*) as count FROM notifications WHERE userId = ? AND isRead = 0').get(userId) as any);
      
      res.json({ notifications, unreadCount: unreadCount.count });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
    }
  });

  app.put('/api/notifications/:id/read', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      (await db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?').run(req.params.id, userId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
    }
  });

  app.put('/api/notifications/read-all', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      (await db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(userId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to mark all notifications as read', error: err.message });
    }
  });

  // --- NOTIFICATION SETTINGS ---
  app.get('/api/notification-settings', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      let settings = (await db.prepare('SELECT * FROM notification_settings WHERE userId = ?').get(userId));
      if (!settings) {
        (await db.prepare('INSERT INTO notification_settings (userId) VALUES (?)').run(userId));
        settings = (await db.prepare('SELECT * FROM notification_settings WHERE userId = ?').get(userId));
      }
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch notification settings', error: err.message });
    }
  });

  app.put('/api/notification-settings', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { highConsumptionThreshold, emailAlerts, pushAlerts } = req.body;
      (await db.prepare(
                'UPDATE notification_settings SET highConsumptionThreshold = ?, emailAlerts = ?, pushAlerts = ? WHERE userId = ?'
              ).run(highConsumptionThreshold, emailAlerts ? 1 : 0, pushAlerts ? 1 : 0, userId));
      
      logAudit(req, 'UPDATE', 'NotificationSettings', userId, 'Updated notification preferences');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update notification settings', error: err.message });
    }
  });

  // --- PDF SETTINGS ---
  app.get('/api/pdf-settings', async (req, res) => {
    try {
      let settings = (await db.prepare('SELECT * FROM pdf_settings WHERE id = 1').get());
      if (!settings) {
        (await db.prepare('INSERT INTO pdf_settings (id) VALUES (1)').run());
        settings = (await db.prepare('SELECT * FROM pdf_settings WHERE id = 1').get());
      }
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch PDF settings', error: err.message });
    }
  });

  app.put('/api/pdf-settings', checkRole(['Admin']), async (req, res) => {
    try {
      const { logoUrl, themeColor, footerText } = req.body;
      (await db.prepare(
                'UPDATE pdf_settings SET logoUrl = ?, themeColor = ?, footerText = ? WHERE id = 1'
              ).run(logoUrl, themeColor, footerText));
      
      logAudit(req, 'UPDATE', 'PDFSettings', '1', 'Updated PDF customization settings');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update PDF settings', error: err.message });
    }
  });

  app.get('/api/db/validate', async (req, res) => {
    try {
      let isHealthy = true;
      let integrityMessage = 'ok';
      let fileSize = 0;
      let counts = {
        customers: 0, meters: 0, readings: 0, invoices: 0, payments: 0, users: 0, assets: 0
      };

      try {
        await db.prepare('SELECT 1').get();
        
        try { const stats = fs.statSync('server/database.sqlite'); fileSize = stats.size; } catch(e) {}

        counts.customers = parseInt((await db.prepare('SELECT count(*) as count FROM customers').get() as any)?.count || '0', 10);
        counts.meters = parseInt((await db.prepare('SELECT count(*) as count FROM meters').get() as any)?.count || '0', 10);
        counts.readings = parseInt((await db.prepare('SELECT count(*) as count FROM meter_readings').get() as any)?.count || '0', 10);
        counts.invoices = parseInt((await db.prepare('SELECT count(*) as count FROM invoices').get() as any)?.count || '0', 10);
        counts.payments = parseInt((await db.prepare('SELECT count(*) as count FROM payments').get() as any)?.count || '0', 10);
        counts.users = parseInt((await db.prepare('SELECT count(*) as count FROM users').get() as any)?.count || '0', 10);
        counts.assets = parseInt((await db.prepare('SELECT count(*) as count FROM assets').get() as any)?.count || '0', 10);
      } catch (e: any) {
        isHealthy = false;
        integrityMessage = 'Database connection failed: ' + e.message;
      }

      res.json({
        status: isHealthy ? 'Healthy' : 'Corrupted',
        integrityMessage: integrityMessage,
        tableCounts: counts,
        fileSize: fileSize,
        lastValidated: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Diag failed', error: err.message });
    }
  });

  app.get('/api/db/backup', checkRole(['Admin']), async (req, res) => {
    try {
      const { backupDatabase } = await import('./server/database.ts');
      const backupPath = await backupDatabase();
      if (fs.existsSync(backupPath)) {
        res.download(backupPath, `database_backup_${new Date().toISOString().split('T')[0]}.json`, (err) => {
          // Clean up the backup file after sending
          if (!err) {
            fs.unlinkSync(backupPath);
          }
        });
      } else {
        res.status(404).json({ message: 'Backup failed to generate' });
      }
    } catch (err: any) {
      res.status(500).json({ message: 'Backup failed', error: err.message });
    }
  });

  // --- ASSETS ---
  app.get('/api/assets', async (req, res) => {
    try {
      const assets = (await db.prepare('SELECT * FROM assets ORDER BY createdAt DESC').all());
      res.json(assets);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch assets', error: err.message });
    }
  });

  app.post('/api/assets', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { name, category, description, status, purchaseDate, price, notes, locationId, farmId } = req.body;
      const id = `AST-${Date.now()}`;
      (await db.prepare(
                'INSERT INTO assets (id, name, category, description, status, purchaseDate, price, notes, createdAt, locationId, farmId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
              ).run(id, name, category, description, status || 'Active', purchaseDate, price, notes, new Date().toISOString(), locationId, farmId));
      
      logAudit(req, 'CREATE', 'Asset', id, `Created asset ${name}`);
      res.status(201).json({ id, name, category, status });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create asset', error: err.message });
    }
  });

  app.put('/api/assets/:id', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, description, status, purchaseDate, price, notes } = req.body;
      (await db.prepare(
                'UPDATE assets SET name = ?, category = ?, description = ?, status = ?, purchaseDate = ?, price = ?, notes = ?, locationId = ?, farmId = ? WHERE id = ?'
              ).run(name, category, description, status, purchaseDate, price, notes, id));
      
      logAudit(req, 'UPDATE', 'Asset', id as string, `Updated asset ${name}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update asset', error: err.message });
    }
  });

  app.get('/api/assets/:id/attachments', async (req, res) => {
    try {
      const { id } = req.params;
      const attachments = (await db.prepare('SELECT id, assetId, type, fileName, uploadedAt FROM asset_attachments WHERE assetId = ? ORDER BY uploadedAt DESC').all(id));
      res.json(attachments);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch attachments', error: err.message });
    }
  });

  app.get('/api/assets/attachments/:attachmentId', async (req, res) => {
    try {
      const { attachmentId } = req.params;
      const attachment = (await db.prepare('SELECT fileData, fileName FROM asset_attachments WHERE id = ?').get(attachmentId) as any);
      if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
      res.json(attachment);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch attachment', error: err.message });
    }
  });

  app.post('/api/assets/:id/attachments', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { id } = req.params;
      const { type, fileName, fileData } = req.body;
      const attachmentId = `ATT-${Date.now()}`;
      (await db.prepare(
                'INSERT INTO asset_attachments (id, assetId, type, fileName, fileData, uploadedAt) VALUES (?, ?, ?, ?, ?, ?)'
              ).run(attachmentId, id, type, fileName, fileData, new Date().toISOString()));
      
      logAudit(req, 'CREATE', 'AssetAttachment', attachmentId, `Uploaded ${type} for asset ${id}`);
      res.status(201).json({ id: attachmentId, type, fileName });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to upload attachment', error: err.message });
    }
  });

  app.delete('/api/assets/attachments/:attachmentId', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { attachmentId } = req.params;
      (await db.prepare('DELETE FROM asset_attachments WHERE id = ?').run(attachmentId));
      logAudit(req, 'DELETE', 'AssetAttachment', attachmentId as string, `Deleted attachment ${attachmentId}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete attachment', error: err.message });
    }
  });


  
  // --- ASSET MAINTENANCE LOGS ---
  app.get('/api/assets/:id/maintenance', async (req, res) => {
    try {
      const { id } = req.params;
      const logs = (await db.prepare('SELECT m.*, u.name as performedByName FROM asset_maintenance_logs m JOIN users u ON m.performedBy = u.id WHERE m.assetId = ? ORDER BY m.maintenanceDate DESC').all(id));
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch maintenance logs', error: err.message });
    }
  });

  app.post('/api/assets/:id/maintenance', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { id } = req.params;
      const { maintenanceDate, description, cost, photos } = req.body;
      const performedBy = req.headers['x-user-id'] as string;
      const logId = `MNT-${Date.now()}`;
      
      (await db.prepare(
        'INSERT INTO asset_maintenance_logs (id, assetId, maintenanceDate, performedBy, description, cost, photos, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(logId, id, maintenanceDate, performedBy, description, cost, photos ? JSON.stringify(photos) : null, new Date().toISOString()));
      
      logAudit(req, 'CREATE', 'AssetMaintenanceLog', logId, `Created maintenance log for asset ${id}`);
      res.status(201).json({ id: logId, assetId: id, maintenanceDate, description });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create maintenance log', error: err.message });
    }
  });

  app.delete('/api/assets/maintenance/:logId', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { logId } = req.params;
      (await db.prepare('DELETE FROM asset_maintenance_logs WHERE id = ?').run(logId));
      logAudit(req, 'DELETE', 'AssetMaintenanceLog', logId as string, `Deleted maintenance log ${logId}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete maintenance log', error: err.message });
    }
  });

  // --- ASSET BULK UPLOAD ---
  app.post('/api/assets/bulk-upload', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { assets } = req.body;
      if (!Array.isArray(assets)) {
        return res.status(400).json({ message: 'Invalid payload format. Expected an array of assets.' });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const asset of assets) {
        try {
          if (!asset.name || !asset.category || !asset.farmId) {
             throw new Error('Missing required fields: name, category, or farmId');
          }
          const id = `AST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          (await db.prepare(
            'INSERT INTO assets (id, name, category, description, status, purchaseDate, price, notes, createdAt, locationId, farmId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(id, asset.name, asset.category, asset.description, asset.status || 'Active', asset.purchaseDate, asset.price, asset.notes, new Date().toISOString(), asset.locationId, asset.farmId));
          successCount++;
        } catch (e: any) {
          errorCount++;
          errors.push(`Failed to insert asset ${asset.name || 'Unknown'}: ${e.message}`);
        }
      }

      logAudit(req, 'CREATE', 'Asset', 'BULK', `Bulk uploaded ${successCount} assets`);
      res.json({ success: true, successCount, errorCount, errors });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to process bulk upload', error: err.message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', async (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();