import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'comic_payroll.db'));
db.pragma('journal_mode = WAL');

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT UNIQUE NOT NULL,
    username TEXT,
    role TEXT NOT NULL CHECK(role IN ('Translator', 'Editor', 'Solo')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    joined_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payroll_rates (
    role TEXT PRIMARY KEY,
    rate_per_chapter INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    nickname_input TEXT NOT NULL,
    role_input TEXT NOT NULL,
    title TEXT NOT NULL,
    chapter INTEGER NOT NULL CHECK(chapter > 0),
    nominal INTEGER NOT NULL,
    snapshot_rate INTEGER NOT NULL,
    status TEXT DEFAULT 'APPROVED' CHECK(status IN ('APPROVED', 'PENDING_REVIEW', 'REJECTED')),
    work_date TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_by TEXT,
    admin_notes TEXT,
    FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    total_chapters INTEGER NOT NULL,
    total_nominal INTEGER NOT NULL,
    status TEXT DEFAULT 'UNPAID' CHECK(status IN ('PAID', 'UNPAID')),
    paid_date TEXT,
    paid_by_admin TEXT,
    notes TEXT,
    UNIQUE(employee_id, period_month, period_year),
    FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER,
    details TEXT,
    performed_by TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS discord_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    webhook_url TEXT,
    bot_token TEXT,
    guild_id TEXT,
    application_id TEXT,
    enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS discord_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Default Data if empty
const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (adminCheck.count === 0) {
  // Hash simple password 'admin123' using sha256 for demo
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
}

const ratesCheck = db.prepare('SELECT COUNT(*) as count FROM payroll_rates').get() as { count: number };
if (ratesCheck.count === 0) {
  const insertRate = db.prepare('INSERT INTO payroll_rates (role, rate_per_chapter) VALUES (?, ?)');
  insertRate.run('Translator', 3000);
  insertRate.run('Editor', 3000);
  insertRate.run('Solo', 6000);
}

const discordCheck = db.prepare('SELECT COUNT(*) as count FROM discord_settings').get() as { count: number };
if (discordCheck.count === 0) {
  db.prepare('INSERT INTO discord_settings (id, webhook_url, enabled) VALUES (1, ?, ?)').run('', 1);
}

// Seed initial employees & work logs if empty
const empCheck = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
if (empCheck.count === 0) {
  const insertEmp = db.prepare('INSERT INTO employees (nickname, username, role, status, joined_date) VALUES (?, ?, ?, ?, ?)');
  const e1 = insertEmp.run('Andi', 'andi_trans', 'Translator', 'active', '2026-01-10').lastInsertRowid;
  const e2 = insertEmp.run('Budi', 'budi_edit', 'Editor', 'active', '2026-01-15').lastInsertRowid;
  const e3 = insertEmp.run('Citra', 'citra_solo', 'Solo', 'active', '2026-02-01').lastInsertRowid;

  const insertLog = db.prepare(`
    INSERT INTO work_logs (employee_id, nickname_input, role_input, title, chapter, nominal, snapshot_rate, status, work_date, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  insertLog.run(e1, 'Andi', 'Translator', 'Solo Leveling Season 2', 20, 60000, 3000, 'APPROVED', `${year}-${month}-05`, new Date().toISOString());
  insertLog.run(e1, 'Andi', 'Translator', 'Omniscient Reader', 20, 60000, 3000, 'APPROVED', `${year}-${month}-12`, new Date().toISOString());
  insertLog.run(e2, 'Budi', 'Editor', 'Solo Leveling Season 2', 40, 120000, 3000, 'APPROVED', `${year}-${month}-10`, new Date().toISOString());
  insertLog.run(e3, 'Citra', 'Solo', 'The Beginning After The End', 15, 90000, 6000, 'APPROVED', `${year}-${month}-14`, new Date().toISOString());
  
  // Also add a problematic nickname log for demo
  insertLog.run(null, 'Andrii', 'Translator', 'Tower of God', 5, 0, 3000, 'PENDING_REVIEW', `${year}-${month}-15`, new Date().toISOString());
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Helper function to send Discord simulated webhook notification
  function sendDiscordNotification(type: string, payload: any) {
    try {
      const settings = db.prepare('SELECT webhook_url, enabled FROM discord_settings WHERE id = 1').get() as any;
      const logPayload = JSON.stringify(payload);
      db.prepare('INSERT INTO discord_logs (type, payload, status) VALUES (?, ?, ?)').run(
        type,
        logPayload,
        settings && settings.enabled ? 'SENT_SIMULATED' : 'DISABLED'
      );
    } catch (e) {
      console.error('Discord notification error:', e);
    }
  }

  // --- AUTH API ---
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const hash = crypto.createHash('sha256').update(password || '').digest('hex');
      const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password_hash = ?').get(username, hash) as any;
      
      if (!user) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }
      
      // Return user & simple session token
      const token = crypto.randomBytes(32).toString('hex');
      res.json({ success: true, token, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- EMPLOYEES API ---
  app.get('/api/employees', (req, res) => {
    try {
      const employees = db.prepare(`
        SELECT e.*, 
        (SELECT COALESCE(SUM(chapter), 0) FROM work_logs WHERE employee_id = e.id AND status = 'APPROVED') as total_chapters,
        (SELECT COALESCE(SUM(nominal), 0) FROM work_logs WHERE employee_id = e.id AND status = 'APPROVED') as total_earnings
        FROM employees e
        ORDER BY e.nickname ASC
      `).all();
      res.json(employees);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/employees', (req, res) => {
    try {
      const { nickname, username, role, status, joined_date } = req.body;
      if (!nickname || !role || !joined_date) {
        return res.status(400).json({ error: 'Nickname, role, dan tanggal bergabung wajib diisi' });
      }

      // Check unique nickname
      const existing = db.prepare('SELECT id FROM employees WHERE nickname = ?').get(nickname);
      if (existing) {
        return res.status(400).json({ error: `Nickname "${nickname}" sudah terdaftar` });
      }

      const stmt = db.prepare('INSERT INTO employees (nickname, username, role, status, joined_date) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(nickname, username || '', role, status || 'active', joined_date);
      
      db.prepare('INSERT INTO audit_logs (action, target_type, target_id, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
        'CREATE_EMPLOYEE', 'employee', result.lastInsertRowid, `Created employee ${nickname} (${role})`, 'Admin'
      );

      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/employees/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { nickname, username, role, status, joined_date } = req.body;
      
      const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as any;
      if (!emp) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

      if (nickname && nickname !== emp.nickname) {
        const existing = db.prepare('SELECT id FROM employees WHERE nickname = ? AND id != ?').get(nickname, id);
        if (existing) {
          return res.status(400).json({ error: `Nickname "${nickname}" sudah digunakan karyawan lain` });
        }
      }

      db.prepare(`
        UPDATE employees SET nickname = ?, username = ?, role = ?, status = ?, joined_date = ? WHERE id = ?
      `).run(
        nickname || emp.nickname,
        username !== undefined ? username : emp.username,
        role || emp.role,
        status || emp.status,
        joined_date || emp.joined_date,
        id
      );

      db.prepare('INSERT INTO audit_logs (action, target_type, target_id, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
        'UPDATE_EMPLOYEE', 'employee', Number(id), `Updated employee ${nickname}`, 'Admin'
      );

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    try {
      const { id } = req.params;
      const emp = db.prepare('SELECT nickname FROM employees WHERE id = ?').get(id) as any;
      
      // Soft delete / status inactive or hard delete
      db.prepare('UPDATE employees SET status = \'inactive\' WHERE id = ?').run(id);

      db.prepare('INSERT INTO audit_logs (action, target_type, target_id, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
        'DEACTIVATE_EMPLOYEE', 'employee', Number(id), `Deactivated employee ${emp?.nickname || id}`, 'Admin'
      );

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PAYROLL RATES API ---
  app.get('/api/rates', (req, res) => {
    try {
      const rates = db.prepare('SELECT * FROM payroll_rates').all();
      res.json(rates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/rates', (req, res) => {
    try {
      const { rates } = req.body; // Array of { role, rate_per_chapter }
      if (!Array.isArray(rates)) {
        return res.status(400).json({ error: 'Format rates tidak valid' });
      }

      const updateStmt = db.prepare('UPDATE payroll_rates SET rate_per_chapter = ?, updated_at = CURRENT_TIMESTAMP WHERE role = ?');
      
      db.transaction(() => {
        for (const r of rates) {
          updateStmt.run(r.rate_per_chapter, r.role);
        }
      })();

      db.prepare('INSERT INTO audit_logs (action, target_type, target_id, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
        'UPDATE_RATES', 'payroll_rates', null, `Updated payrates for roles`, 'Admin'
      );

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- WORK LOGS API ---
  app.get('/api/work-logs', (req, res) => {
    try {
      const { month, year, role, status, nickname } = req.query;
      let query = 'SELECT w.*, e.nickname as employee_real_name FROM work_logs w LEFT JOIN employees e ON w.employee_id = e.id WHERE 1=1';
      const params: any[] = [];

      if (month && year) {
        query += ' AND strftime("%Y-%m", w.work_date) = ?';
        params.push(`${year}-${String(month).padStart(2, '0')}`);
      } else if (year) {
        query += ' AND strftime("%Y", w.work_date) = ?';
        params.push(String(year));
      }

      if (role && role !== 'All') {
        query += ' AND w.role_input = ?';
        params.push(role);
      }

      if (status && status !== 'All') {
        query += ' AND w.status = ?';
        params.push(status);
      }

      if (nickname) {
        query += ' AND (w.nickname_input LIKE ? OR e.nickname LIKE ?)';
        params.push(`%${nickname}%`, `%${nickname}%`);
      }

      query += ' ORDER BY w.work_date DESC, w.id DESC';
      const logs = db.prepare(query).all(...params);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/work-logs', (req, res) => {
    try {
      const { nickname, role, title, chapter, work_date } = req.body;
      if (!nickname || !role || !title || !chapter) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
      }

      const chapterNum = Number(chapter);
      if (isNaN(chapterNum) || chapterNum <= 0) {
        return res.status(400).json({ error: 'Nomor chapter harus berupa angka positif' });
      }

      // Check if employee exists by exact nickname match
      const employee = db.prepare('SELECT id, role FROM employees WHERE nickname = ? AND status = \'active\'').get(nickname) as any;

      // Get current rate for role
      const rateRow = db.prepare('SELECT rate_per_chapter FROM payroll_rates WHERE role = ?').get(role) as any;
      const rate = rateRow ? rateRow.rate_per_chapter : (role === 'Solo' ? 6000 : 3000);

      const status = employee ? 'APPROVED' : 'PENDING_REVIEW';
      const quantity = 1; // Each chapter entry counts as 1 chapter unit
      const nominal = employee ? quantity * rate : 0; // PENDING_REVIEW nominal is 0 until approved
      const targetWorkDate = work_date || new Date().toISOString().split('T')[0];

      const formattedTitle = title.toLowerCase().includes('ch') || title.toLowerCase().includes('chapter')
        ? title
        : `${title} - Ch. ${chapterNum}`;

      const stmt = db.prepare(`
        INSERT INTO work_logs (employee_id, nickname_input, role_input, title, chapter, nominal, snapshot_rate, status, work_date, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        employee ? employee.id : null,
        nickname,
        role,
        formattedTitle,
        quantity,
        nominal,
        rate,
        status,
        targetWorkDate,
        new Date().toISOString()
      );

      // Trigger Discord Notification
      if (status === 'APPROVED') {
        sendDiscordNotification('NEW_REPORT', {
          nickname,
          role,
          title: formattedTitle,
          chapter: chapterNum,
          payrate: rate,
          estimated_salary: nominal,
          status: 'APPROVED'
        });
      } else {
        sendDiscordNotification('PENDING_NICKNAME', {
          nickname,
          role,
          title: formattedTitle,
          chapter: chapterNum,
          status: 'PENDING REVIEW'
        });
      }

      res.json({ success: true, id: result.lastInsertRowid, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify / Resolve Pending Review Log
  app.post('/api/work-logs/:id/verify', (req, res) => {
    try {
      const { id } = req.params;
      const { action, employee_id, new_nickname } = req.body; 
      // action: 'match' (link to existing employee_id), 'register' (create new employee), 'reject' (reject log)

      const log = db.prepare('SELECT * FROM work_logs WHERE id = ?').get(id) as any;
      if (!log) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

      const transaction = db.transaction(() => {
        if (action === 'reject') {
          db.prepare('UPDATE work_logs SET status = "REJECTED", verified_by = "Admin", admin_notes = ? WHERE id = ?').run(
            'Ditolak oleh admin karena nickname tidak valid', id
          );
        } else if (action === 'match') {
          const emp = db.prepare('SELECT id FROM employees WHERE id = ?').get(employee_id) as any;
          if (!emp) throw new Error('Karyawan tujuan tidak ditemukan');

          const rateRow = db.prepare('SELECT rate_per_chapter FROM payroll_rates WHERE role = ?').get(log.role_input) as any;
          const rate = log.snapshot_rate || (rateRow ? rateRow.rate_per_chapter : 3000);
          const nominal = log.chapter * rate;

          db.prepare(`
            UPDATE work_logs 
            SET employee_id = ?, status = "APPROVED", nominal = ?, verified_by = "Admin", admin_notes = ? 
            WHERE id = ?
          `).run(emp.id, nominal, `Dicocokkan dengan employee ID ${emp.id}`, id);
        } else if (action === 'register') {
          const regNickname = new_nickname || log.nickname_input;
          const existing = db.prepare('SELECT id FROM employees WHERE nickname = ?').get(regNickname);
          let empId: any;
          if (existing) {
            empId = (existing as any).id;
          } else {
            const resEmp = db.prepare('INSERT INTO employees (nickname, role, status, joined_date) VALUES (?, ?, ?, ?)').run(
              regNickname, log.role_input, 'active', log.work_date || new Date().toISOString().split('T')[0]
            );
            empId = resEmp.lastInsertRowid;
          }

          const rateRow = db.prepare('SELECT rate_per_chapter FROM payroll_rates WHERE role = ?').get(log.role_input) as any;
          const rate = log.snapshot_rate || (rateRow ? rateRow.rate_per_chapter : 3000);
          const nominal = log.chapter * rate;

          db.prepare(`
            UPDATE work_logs 
            SET employee_id = ?, nickname_input = ?, status = "APPROVED", nominal = ?, verified_by = "Admin", admin_notes = ? 
            WHERE id = ?
          `).run(empId, regNickname, nominal, `Didaftarkan sebagai karyawan baru`, id);
        }
      });

      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/work-logs/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM work_logs WHERE id = ?').run(id);
      db.prepare('INSERT INTO audit_logs (action, target_type, target_id, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
        'DELETE_WORK_LOG', 'work_log', Number(id), `Deleted work log ID ${id}`, 'Admin'
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PAYROLL & REKAP API ---
  app.get('/api/payroll/rekap', (req, res) => {
    try {
      const { month, year } = req.query;
      const targetYear = year ? Number(year) : new Date().getFullYear();
      const targetMonth = month ? Number(month) : new Date().getMonth() + 1;

      const datePrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

      // Summary
      const summary = db.prepare(`
        SELECT 
          COALESCE(SUM(chapter), 0) as total_chapters,
          COALESCE(SUM(nominal), 0) as total_gaji
        FROM work_logs 
        WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
      `).get(datePrefix) as any;

      // Per Role summary
      const rolesSummary = db.prepare(`
        SELECT 
          role_input as role,
          COALESCE(SUM(chapter), 0) as total_chapters,
          COALESCE(SUM(nominal), 0) as total_gaji
        FROM work_logs 
        WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
        GROUP BY role_input
      `).all(datePrefix);

      // Per Member summary for this month
      const membersSummary = db.prepare(`
        SELECT 
          e.id as employee_id,
          e.nickname,
          e.role,
          COALESCE(SUM(w.chapter), 0) as total_chapters,
          COALESCE(SUM(w.nominal), 0) as gaji,
          COALESCE(p.status, 'UNPAID') as status_bayar,
          p.paid_date,
          p.notes as payment_notes
        FROM employees e
        LEFT JOIN work_logs w ON w.employee_id = e.id AND w.status = 'APPROVED' AND strftime('%Y-%m', w.work_date) = ?
        LEFT JOIN payments p ON p.employee_id = e.id AND p.period_month = ? AND p.period_year = ?
        WHERE e.status = 'active'
        GROUP BY e.id
        ORDER BY e.nickname ASC
      `).all(datePrefix, targetMonth, targetYear);

      // Payment counts
      const paidStats = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN p.status = 'PA = PAID' OR p.status = 'PAID' THEN total_nominal ELSE 0 END), 0) as total_sudah_dibayar,
          COALESCE(SUM(CASE WHEN p.status = 'UNPAID' OR p.status IS NULL THEN 1 ELSE 0 END), 0) as count_belum_dibayar
        FROM employees e
        LEFT JOIN payments p ON p.employee_id = e.id AND p.period_month = ? AND p.period_year = ?
        WHERE e.status = 'active'
      `).get(targetMonth, targetYear);

      // Yearly breakdown (Jan - Dec)
      const yearlyBreakdown = [];
      for (let m = 1; m <= 12; m++) {
        const mPrefix = `${targetYear}-${String(m).padStart(2, '0')}`;
        const row = db.prepare(`
          SELECT COALESCE(SUM(nominal), 0) as total FROM work_logs WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
        `).get(mPrefix) as any;
        yearlyBreakdown.push({
          month: m,
          monthName: new Date(targetYear, m - 1, 1).toLocaleString('id-ID', { month: 'long' }),
          total: row ? row.total : 0
        });
      }

      const totalYearly = yearlyBreakdown.reduce((acc, curr) => acc + curr.total, 0);

      res.json({
        month: targetMonth,
        year: targetYear,
        total_chapters: summary.total_chapters,
        total_gaji: summary.total_gaji,
        roles: rolesSummary,
        members: membersSummary,
        yearly_breakdown: yearlyBreakdown,
        total_yearly: totalYearly
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle or Update Payment Status
  app.post('/api/payments/toggle', (req, res) => {
    try {
      const { employee_id, period_month, period_year, status, notes } = req.body;
      if (!employee_id || !period_month || !period_year || !status) {
        return res.status(400).json({ error: 'Data pembayaran tidak lengkap' });
      }

      // Calculate total nominal for this employee in this month/year
      const datePrefix = `${period_year}-${String(period_month).padStart(2, '0')}`;
      const sumRow = db.prepare(`
        SELECT COALESCE(SUM(chapter), 0) as chapters, COALESCE(SUM(nominal), 0) as nominal
        FROM work_logs WHERE employee_id = ? AND status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
      `).get(employee_id, datePrefix) as any;

      const totalChapters = sumRow ? sumRow.chapters : 0;
      const totalNominal = sumRow ? sumRow.nominal : 0;

      const paidDate = status === 'PAID' ? new Date().toISOString().split('T')[0] : null;

      // Upsert payment record
      const existing = db.prepare('SELECT id FROM payments WHERE employee_id = ? AND period_month = ? AND period_year = ?').get(employee_id, period_month, period_year);

      if (existing) {
        db.prepare(`
          UPDATE payments 
          SET status = ?, paid_date = ?, total_chapters = ?, total_nominal = ?, paid_by_admin = 'Admin', notes = ?
          WHERE employee_id = ? AND period_month = ? AND period_year = ?
        `).run(status, paidDate, totalChapters, totalNominal, notes || '', employee_id, period_month, period_year);
      } else {
        db.prepare(`
          INSERT INTO payments (employee_id, period_month, period_year, total_chapters, total_nominal, status, paid_date, paid_by_admin, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Admin', ?)
        `).run(employee_id, period_month, period_year, totalChapters, totalNominal, status, paidDate, notes || '');
      }

      db.prepare('INSERT INTO audit_logs (action, target_type, target_id, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
        'UPDATE_PAYMENT', 'payment', Number(employee_id), `Set payment status to ${status} for period ${period_month}/${period_year}`, 'Admin'
      );

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN DASHBOARD ANALYTICS API ---
  app.get('/api/admin/dashboard', (req, res) => {
    try {
      const now = new Date();
      const year = req.query.year ? Number(req.query.year) : now.getFullYear();
      const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
      const datePrefix = `${year}-${String(month).padStart(2, '0')}`;

      const activeEmployees = (db.prepare('SELECT COUNT(*) as count FROM employees WHERE status = \'active\'').get() as any).count;
      
      const monthSummary = db.prepare(`
        SELECT COALESCE(SUM(chapter), 0) as chapters, COALESCE(SUM(nominal), 0) as payout
        FROM work_logs WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
      `).get(datePrefix) as any;

      const pendingReviewCount = (db.prepare('SELECT COUNT(*) as count FROM work_logs WHERE status = "PENDING_REVIEW"').get() as any).count;

      // Paid vs Unpaid for this month
      const members = db.prepare(`
        SELECT e.id, COALESCE(SUM(w.nominal), 0) as nominal, COALESCE(p.status, 'UNPAID') as status
        FROM employees e
        LEFT JOIN work_logs w ON w.employee_id = e.id AND w.status = 'APPROVED' AND strftime('%Y-%m', w.work_date) = ?
        LEFT JOIN payments p ON p.employee_id = e.id AND p.period_month = ? AND p.period_year = ?
        WHERE e.status = 'active'
        GROUP BY e.id
      `).all(datePrefix, month, year) as any[];

      let totalPaid = 0;
      let totalUnpaid = 0;
      for (const m of members) {
        if (m.status === 'PAID') {
          totalPaid += m.nominal;
        } else {
          totalUnpaid += m.nominal;
        }
      }

      // Monthly Chart Data (Jan - Dec)
      const monthlyExpenditure = [];
      for (let m = 1; m <= 12; m++) {
        const pfx = `${year}-${String(m).padStart(2, '0')}`;
        const row = db.prepare(`
          SELECT COALESCE(SUM(nominal), 0) as payout, COALESCE(SUM(chapter), 0) as chapters
          FROM work_logs WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
        `).get(pfx) as any;
        monthlyExpenditure.push({
          month: new Date(year, m - 1, 1).toLocaleString('id-ID', { month: 'short' }),
          payout: row.payout,
          chapters: row.chapters
        });
      }

      // Role Distribution
      const roleDistribution = db.prepare(`
        SELECT role_input as role, COUNT(*) as count, SUM(chapter) as chapters, SUM(nominal) as payout
        FROM work_logs WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
        GROUP BY role_input
      `).all(datePrefix);

      res.json({
        active_employees: activeEmployees,
        chapters_this_month: monthSummary.chapters,
        payout_this_month: monthSummary.payout,
        total_paid: totalPaid,
        total_unpaid: totalUnpaid,
        pending_review_count: pendingReviewCount,
        monthly_expenditure: monthlyExpenditure,
        role_distribution: roleDistribution
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- DISCORD SETTINGS API ---
  app.get('/api/discord/settings', (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM discord_settings WHERE id = 1').get();
      const logs = db.prepare('SELECT * FROM discord_logs ORDER BY id DESC LIMIT 50').all();
      res.json({ settings, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/discord/settings', (req, res) => {
    try {
      const { webhook_url, bot_token, guild_id, application_id, enabled } = req.body;
      db.prepare(`
        UPDATE discord_settings 
        SET webhook_url = ?, bot_token = ?, guild_id = ?, application_id = ?, enabled = ?
        WHERE id = 1
      `).run(webhook_url || '', bot_token || '', guild_id || '', application_id || '', enabled ? 1 : 0);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Discord Slash Commands simulator endpoint
  app.post('/api/discord/interactions', (req, res) => {
    try {
      const { command, args } = req.body;
      // Handle slash commands: /rekap, /rekap-bulanan, /rekap-karyawan, /total-chapter, /anggota, /pending, /bayar
      let responseText = '';
      const now = new Date();

      if (command === 'rekap') {
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const summary = db.prepare(`
          SELECT COALESCE(SUM(chapter), 0) as chapters, COALESCE(SUM(nominal), 0) as nominal
          FROM work_logs WHERE status = 'APPROVED' AND strftime('%Y-%m', work_date) = ?
        `).get(`${year}-${String(month).padStart(2, '0')}`) as any;
        responseText = `=== Rekap Gaji Bulan Ini (${month}/${year}) ===\nTotal Chapter: ${summary.chapters}\nTotal Gaji: Rp${summary.nominal.toLocaleString('id-ID')}`;
      } else if (command === 'anggota') {
        const employees = db.prepare('SELECT nickname, role FROM employees WHERE status = \'active\'').all() as any[];
        responseText = `=== Daftar Karyawan Aktif (${employees.length}) ===\n` + employees.map(e => `• ${e.nickname} (${e.role})`).join('\n');
      } else if (command === 'pending') {
        const pending = db.prepare('SELECT nickname_input, role_input, title, chapter FROM work_logs WHERE status = "PENDING_REVIEW"').all() as any[];
        responseText = pending.length === 0 ? 'Tidak ada laporan pending review.' : `=== Laporan Pending Review (${pending.length}) ===\n` + pending.map(p => `• ${p.nickname_input} | ${p.role_input} | ${p.title} (Ch.${p.chapter})`).join('\n');
      } else {
        responseText = `Command /${command} diterima dan diproses oleh Comic Payroll Bot.`;
      }

      res.json({ type: 4, data: { content: responseText } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUDIT LOGS API ---
  app.get('/api/audit-logs', (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Setup static serving for production or Vite middleware for development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Comic Payroll Management System running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
