import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new Database(path.join(dbDir, 'database.sqlite'));

export function initializeDatabase() {
    console.log('Initializing local SQLite database...');
    const schema = `
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            accountNumber TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            joinDate TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS meters (
            id TEXT PRIMARY KEY,
            serialNumber TEXT NOT NULL UNIQUE,
            customerAccount TEXT,
            status TEXT NOT NULL,
            installationDate TEXT NOT NULL,
            FOREIGN KEY (customerAccount) REFERENCES customers(accountNumber)
        );

        CREATE TABLE IF NOT EXISTS meter_readings (
            id TEXT PRIMARY KEY,
            meterId TEXT NOT NULL,
            reading INTEGER NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (meterId) REFERENCES meters(id)
        );

        CREATE TABLE IF NOT EXISTS meter_status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meterId TEXT NOT NULL,
            date TEXT NOT NULL,
            fromStatus TEXT NOT NULL,
            toStatus TEXT NOT NULL,
            FOREIGN KEY (meterId) REFERENCES meters(id)
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            customerName TEXT NOT NULL,
            customerAccount TEXT NOT NULL,
            customerAddress TEXT NOT NULL,
            issueDate TEXT NOT NULL,
            generationDate TEXT NOT NULL,
            dueDate TEXT NOT NULL,
            subtotal REAL NOT NULL,
            penalties REAL NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoiceId TEXT NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL,
            unitPrice REAL NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (invoiceId) REFERENCES invoices(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            customerName TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            date TEXT NOT NULL,
            invoiceId TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS billing_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            frequency TEXT NOT NULL,
            generationDay INTEGER NOT NULL,
            readingCutoffDays INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL DEFAULT 'admin123',
            role TEXT NOT NULL,
            lastActive TEXT,
            status TEXT DEFAULT 'Active'
        );
    `;

    db.exec(schema);
    console.log('Database schema is ready.');
}

export function seedData() {
    const { count } = db.prepare('SELECT count(*) as count FROM customers').get() as { count: number };
    if (count > 0) {
        console.log('Database already seeded.');
        return;
    }

    console.log('Seeding database with initial data...');

    const firstNames = ["Asha", "Benson", "Catherine", "David", "Esther", "Francis", "Grace", "Henry", "Irene", "James", "Kevin", "Linda", "Michael", "Nancy", "Oscar"];
    const lastNames = ["Kinoti", "Odhiambo", "Wanjiku", "Mwangi", "Achieng", "Kimani", "Wairimu", "Omondi", "Nyambura", "Kamau", "Otieno", "Njeri", "Mutua", "Chepkoech", "Musyoka"];
    const cities = ["Nairobi", "Nakuru", "Mombasa", "Kisumu", "Eldoret"];

    const customers = [];
    for (let i = 1; i <= 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
        const phone = `+2547${String(Math.floor(10000000 + Math.random() * 90000000))}`;
        const address = `${Math.floor(100 + Math.random() * 900)} Main St, ${cities[Math.floor(Math.random() * cities.length)]}`;
        const joinDate = new Date(new Date().getTime() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        customers.push({
            id: `CUST-${i}`,
            accountNumber: `ACC-${10000 + i}`,
            name, email, phone, address, joinDate
        });
    }

    const insertCustomer = db.prepare('INSERT INTO customers (id, accountNumber, name, email, phone, address, joinDate) VALUES (?, ?, ?, ?, ?, ?, ?)');
    customers.forEach(c => insertCustomer.run(c.id, c.accountNumber, c.name, c.email, c.phone, c.address, c.joinDate));

    const meters = [
        { id: 'M-001', serialNumber: 'SN-A1B2C3D4', customerAccount: 'ACC-10001', status: 'Active', installationDate: '2023-01-15' },
        { id: 'M-002', serialNumber: 'SN-E5F6G7H8', customerAccount: 'ACC-10002', status: 'Active', installationDate: '2023-02-20' },
        { id: 'M-003', serialNumber: 'SN-I9J0K1L2', customerAccount: 'ACC-10003', status: 'Needs Maintenance', installationDate: '2022-11-10' },
        { id: 'M-004', serialNumber: 'SN-M3N4O5P6', customerAccount: null, status: 'Inactive', installationDate: '2023-05-01' },
        { id: 'M-005', serialNumber: 'SN-Q7R8S9T0', customerAccount: 'ACC-10004', status: 'Active', installationDate: '2023-03-12' },
    ];
    const insertMeter = db.prepare('INSERT INTO meters (id, serialNumber, customerAccount, status, installationDate) VALUES (?, ?, ?, ?, ?)');
    meters.forEach(m => insertMeter.run(m.id, m.serialNumber, m.customerAccount, m.status, m.installationDate));
    
    const readings = [
        { id: 'R-001', meterId: 'M-001', reading: 1200, date: '2024-05-01' },
        { id: 'R-002', meterId: 'M-001', reading: 1250, date: '2024-06-01' },
        { id: 'R-003', meterId: 'M-001', reading: 1305, date: '2024-07-01' },
        { id: 'R-004', meterId: 'M-002', reading: 800, date: '2024-06-01' },
        { id: 'R-005', meterId: 'M-002', reading: 845, date: '2024-07-01' },
        { id: 'R-006', meterId: 'M-003', reading: 2500, date: '2024-07-01' },
    ];
    const insertReading = db.prepare('INSERT INTO meter_readings (id, meterId, reading, date) VALUES (?, ?, ?, ?)');
    readings.forEach(r => insertReading.run(r.id, r.meterId, r.reading, r.date));
    
    const statusHistory = [
        { meterId: 'M-003', date: '2024-04-15', fromStatus: 'Active', toStatus: 'Needs Maintenance' },
    ];
    const insertStatus = db.prepare('INSERT INTO meter_status_history (meterId, date, fromStatus, toStatus) VALUES (?, ?, ?, ?)');
    statusHistory.forEach(s => insertStatus.run(s.meterId, s.date, s.fromStatus, s.toStatus));
    
    const invoices = [];
    const statuses = ['Paid', 'Due', 'Overdue'];
    for (let i = 1; i <= 45; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const issueDate = new Date(new Date().getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const items = Array.from({ length: Math.floor(1 + Math.random() * 2) }, () => {
            const quantity = Math.floor(10 + Math.random() * 50);
            const unitPrice = Math.floor(50 + Math.random() * 80);
            return {
                description: `Water Usage (${quantity} m³)`, quantity, unitPrice, total: quantity * unitPrice
            };
        });
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const penalties = status === 'Overdue' ? subtotal * 0.1 : 0;
        const total = subtotal + penalties;

        invoices.push({
            id: `INV-2024-${String(1000 + i).padStart(4, '0')}`,
            customerName: customer.name, customerAccount: customer.accountNumber, customerAddress: customer.address,
            issueDate: issueDate.toISOString().split('T')[0],
            generationDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            subtotal, penalties, total, status, items
        });
    }

    const insertInvoice = db.prepare('INSERT INTO invoices (id, customerName, customerAccount, customerAddress, issueDate, generationDate, dueDate, subtotal, penalties, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)');
    invoices.forEach(inv => {
        insertInvoice.run(inv.id, inv.customerName, inv.customerAccount, inv.customerAddress, inv.issueDate, inv.generationDate, inv.dueDate, inv.subtotal, inv.penalties, inv.total, inv.status);
        inv.items.forEach(item => insertItem.run(inv.id, item.description, item.quantity, item.unitPrice, item.total));
    });

    const payments = [];
    const methods = ['M-Pesa', 'Cash', 'Bank'];
    for (let i = 1; i <= 42; i++) {
        const inv = invoices[Math.floor(Math.random() * invoices.length)];
        payments.push({
            id: `RPT-${i}`, customerName: inv.customerName, amount: inv.total,
            method: methods[Math.floor(Math.random() * methods.length)],
            date: new Date(new Date(inv.issueDate).getTime() + (Math.random() * 45 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            invoiceId: inv.id
        });
    }
    const insertPayment = db.prepare('INSERT INTO payments (id, customerName, amount, method, date, invoiceId) VALUES (?, ?, ?, ?, ?, ?)');
    payments.forEach(p => insertPayment.run(p.id, p.customerName, p.amount, p.method, p.date, p.invoiceId));
    
    db.prepare("INSERT INTO billing_settings (id, frequency, generationDay, readingCutoffDays) VALUES (1, 'monthly', 25, 2)").run();

    // System Users Seed
    const users = [
        { id: 'USR-1', name: 'Admin User', email: 'admin@waba.com', password: 'admin123', role: 'Admin', lastActive: new Date().toISOString() },
        { id: 'USR-2', name: 'James Kamau', email: 'james@splashdash.co.ke', password: 'admin123', role: 'Admin', lastActive: new Date().toISOString() },
        { id: 'USR-3', name: 'Sarah Wanjiku', email: 'sarah@splashdash.co.ke', password: 'admin123', role: 'Manager', lastActive: new Date().toISOString() },
    ];
    const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role, lastActive) VALUES (?, ?, ?, ?, ?, ?)');
    users.forEach(u => insertUser.run(u.id, u.name, u.email, u.password, u.role, u.lastActive));

    console.log('Database seeded successfully.');
}

db.transaction(() => {
    initializeDatabase();
    seedData();
})();

export default db;
