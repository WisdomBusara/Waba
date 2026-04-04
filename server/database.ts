import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
export const db = new Database(dbPath);

export async function initializeDatabase() {
    console.log('Initializing SQLite database...');
    const schema = `
        CREATE TABLE IF NOT EXISTS locations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farms (
            id TEXT PRIMARY KEY,
            locationId TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (locationId) REFERENCES locations(id)
        );

        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            accountNumber TEXT UNIQUE NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            farmId TEXT,
            joinDate TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (farmId) REFERENCES farms(id)
        );

        CREATE TABLE IF NOT EXISTS meters (
            id TEXT PRIMARY KEY,
            serialNumber TEXT UNIQUE NOT NULL,
            customerAccount TEXT,
            status TEXT NOT NULL,
            installationDate TEXT,
            lastReadingDate TEXT,
            lastReadingValue REAL
        );

        CREATE TABLE IF NOT EXISTS meter_readings (
            id TEXT PRIMARY KEY,
            meterId TEXT NOT NULL,
            readingDate TEXT NOT NULL,
            value REAL NOT NULL,
            previousValue REAL,
            consumption REAL NOT NULL,
            imagePath TEXT,
            notes TEXT,
            recordedBy TEXT,
            FOREIGN KEY (meterId) REFERENCES meters(id)
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            customerName TEXT NOT NULL,
            customerAccount TEXT NOT NULL,
            customerAddress TEXT,
            issueDate TEXT NOT NULL,
            generationDate TEXT NOT NULL,
            dueDate TEXT NOT NULL,
            subtotal REAL NOT NULL,
            penalties REAL NOT NULL DEFAULT 0,
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
            invoiceId TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL,
            lastActive TEXT,
            createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            location TEXT,
            purchaseDate TEXT,
            value REAL,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS asset_attachments (
            id TEXT PRIMARY KEY,
            assetId TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileType TEXT NOT NULL,
            filePath TEXT NOT NULL,
            uploadDate TEXT NOT NULL,
            FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
            id TEXT PRIMARY KEY,
            assetId TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            cost REAL,
            performedBy TEXT,
            FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS billing_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            frequency TEXT NOT NULL DEFAULT 'monthly',
            generationDay INTEGER NOT NULL DEFAULT 25,
            readingCutoffDays INTEGER NOT NULL DEFAULT 2
        );

        CREATE TABLE IF NOT EXISTS pdf_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            companyName TEXT,
            companyAddress TEXT,
            companyPhone TEXT,
            companyEmail TEXT,
            companyWebsite TEXT,
            taxId TEXT,
            bankDetails TEXT,
            footerText TEXT,
            logoUrl TEXT
        );

        CREATE TABLE IF NOT EXISTS meter_status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meterId TEXT NOT NULL,
            date TEXT NOT NULL,
            fromStatus TEXT NOT NULL,
            toStatus TEXT NOT NULL,
            FOREIGN KEY (meterId) REFERENCES meters(id)
        );
        
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            isRead INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS user_settings (
            userId TEXT PRIMARY KEY,
            emailAlerts INTEGER DEFAULT 1,
            smsAlerts INTEGER DEFAULT 0,
            pushAlerts INTEGER DEFAULT 0,
            unusualActivityAlerts INTEGER DEFAULT 1,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
    `;

    try {
        db.exec(schema);
        console.log('Database initialized successfully');

        // Seed initial data if empty
        const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
        if (userCount.count === 0) {
            console.log('Seeding initial data...');
            const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
            insertUser.run('U-1', 'Admin User', 'admin@splashanddash.com', 'admin123', 'Admin', 'Active', new Date().toISOString());
            
            const insertSettings = db.prepare('INSERT INTO user_settings (userId) VALUES (?)');
            insertSettings.run('U-1');

            db.prepare("INSERT INTO billing_settings (id, frequency, generationDay, readingCutoffDays) VALUES (1, 'monthly', 25, 2)").run();
            db.prepare("INSERT INTO pdf_settings (id) VALUES (1)").run();
            console.log('Database seeded successfully.');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

export async function backupDatabase() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);
    
    // Close the database connection to ensure all data is written
    db.close();
    
    // Copy the file
    fs.copyFileSync(dbPath, backupPath);
    
    // Reopen the database connection
    // Note: In a real production app, you'd want a more robust backup strategy
    // that doesn't require closing the connection, like SQLite's online backup API
    // but better-sqlite3 handles this via the backup() method
    
    return backupPath;
}
