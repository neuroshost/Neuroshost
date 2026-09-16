import mysql from "mysql2/promise";
import { getRuntimeConfig } from "@/lib/runtime";

let pool: mysql.Pool | null = null;
let ready: Promise<void> | null = null;

async function initializeDatabase(database: mysql.Pool): Promise<void> {

  // V1.0.0 settings compatibility migrations.
  await database.execute(`CREATE TABLE IF NOT EXISTS settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(191) NOT NULL UNIQUE, setting_value LONGTEXT NULL, is_secret TINYINT(1) NOT NULL DEFAULT 0, is_public TINYINT(1) NOT NULL DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await database.execute(`CREATE TABLE IF NOT EXISTS client_credits (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, balance DECIMAL(12,2) NOT NULL DEFAULT 0, currency VARCHAR(3) NOT NULL DEFAULT 'EUR', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_client_credits_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await database.execute(`CREATE TABLE IF NOT EXISTS client_credit_transactions (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL DEFAULT 0, currency VARCHAR(3) NOT NULL DEFAULT 'EUR', gateway VARCHAR(100) NULL, status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_client_credit_tx_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_client_credit_tx_user(user_id), INDEX idx_client_credit_tx_status(status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await database.execute(`CREATE TABLE IF NOT EXISTS payment_methods (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, gateway VARCHAR(100) NOT NULL, label VARCHAR(191) NULL, brand VARCHAR(50) NULL, last4 VARCHAR(4) NULL, external_id VARCHAR(191) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_payment_methods_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_payment_methods_user(user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await database.execute(`CREATE TABLE IF NOT EXISTS notification_preferences (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, invoice_created TINYINT(1) NOT NULL DEFAULT 1, invoice_created_email TINYINT(1) NOT NULL DEFAULT 1, invoice_created_app TINYINT(1) NOT NULL DEFAULT 1, invoice_paid TINYINT(1) NOT NULL DEFAULT 1, invoice_paid_email TINYINT(1) NOT NULL DEFAULT 1, invoice_paid_app TINYINT(1) NOT NULL DEFAULT 1, payment_failed TINYINT(1) NOT NULL DEFAULT 1, payment_failed_email TINYINT(1) NOT NULL DEFAULT 1, payment_failed_app TINYINT(1) NOT NULL DEFAULT 1, order_created TINYINT(1) NOT NULL DEFAULT 1, order_created_email TINYINT(1) NOT NULL DEFAULT 1, order_created_app TINYINT(1) NOT NULL DEFAULT 1, service_renewal TINYINT(1) NOT NULL DEFAULT 1, service_renewal_email TINYINT(1) NOT NULL DEFAULT 0, service_renewal_app TINYINT(1) NOT NULL DEFAULT 1, service_suspended TINYINT(1) NOT NULL DEFAULT 1, service_suspended_email TINYINT(1) NOT NULL DEFAULT 0, service_suspended_app TINYINT(1) NOT NULL DEFAULT 1, service_activated TINYINT(1) NOT NULL DEFAULT 1, service_activated_email TINYINT(1) NOT NULL DEFAULT 1, service_activated_app TINYINT(1) NOT NULL DEFAULT 1, CONSTRAINT fk_notification_preferences_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await database.execute(`CREATE TABLE IF NOT EXISTS failed_jobs (id BIGINT AUTO_INCREMENT PRIMARY KEY, payload LONGTEXT NULL, exception LONGTEXT NOT NULL, failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP NULL, INDEX idx_failed_jobs_resolved(resolved_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await database.execute(`CREATE TABLE IF NOT EXISTS api_keys (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(191) NOT NULL, token_hash VARCHAR(255) NOT NULL UNIQUE, allowed_ips TEXT NULL, permissions LONGTEXT NULL, enabled TINYINT(1) NOT NULL DEFAULT 1, last_used_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await database.execute(`CREATE TABLE IF NOT EXISTS oauth_clients (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(191) NOT NULL, client_id VARCHAR(191) NOT NULL UNIQUE, client_secret VARCHAR(255) NOT NULL, redirect_uri VARCHAR(1000) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const userColumns = [["language", "VARCHAR(10) NOT NULL DEFAULT 'fr'"]] as const;
  for (const [name, definition] of userColumns) { const [rows] = await database.query<any[]>(`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME=?`, [name]); if (Number(rows[0]?.count ?? 0) === 0) { try { await database.execute(`ALTER TABLE users ADD COLUMN \`${name}\` ${definition}`); } catch {} } }

  // Product / order administration schema extensions.
  // These are additive migrations so existing installations keep their data.
  const productColumns = [
    ["per_user_limit", "INT NULL"],
    ["allow_quantity", "ENUM('SEPARATED','COMBINED') NOT NULL DEFAULT 'SEPARATED'"],
    ["email_template", "VARCHAR(191) NULL"],
    ["hide_product", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["server_id", "INT NULL"]
  ] as const;

  for (const [name, definition] of productColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = ?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(`ALTER TABLE products ADD COLUMN \`${name}\` ${definition}`); } catch {}
    }
  }

  const orderColumns = [
    ["updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"]
  ] as const;
  for (const [name, definition] of orderColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(`ALTER TABLE orders ADD COLUMN \`${name}\` ${definition}`); } catch {}
    }
  }


  for (const [name, definition] of [["settings", "LONGTEXT NULL"], ["updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"]] as const) {
    const [rows] = await database.query<any[]>(`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='servers' AND COLUMN_NAME=?`, [name]);
    if (Number(rows[0]?.count ?? 0) === 0) { try { await database.execute(`ALTER TABLE servers ADD COLUMN \`${name}\` ${definition}`); } catch {} }
  }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS product_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      name VARCHAR(191) NOT NULL,
      type ENUM('FREE','PAID') NOT NULL DEFAULT 'FREE',
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      billing_cycle ENUM('ONE_TIME','MONTHLY','QUARTERLY','YEARLY') NOT NULL DEFAULT 'MONTHLY',
      initial_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      recurring_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_plans_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product_plans_product(product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS product_upgrades (
      product_id INT NOT NULL,
      target_product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(product_id,target_product_id),
      CONSTRAINT fk_upgrade_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_upgrade_target FOREIGN KEY(target_product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      template_key VARCHAR(191) NOT NULL UNIQUE,
      name VARCHAR(191) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      body LONGTEXT NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      edit_preference_message TEXT NULL,
      mail_enabled TINYINT(1) NOT NULL DEFAULT 1,
      inapp_title VARCHAR(255) NULL,
      inapp_enabled TINYINT(1) NOT NULL DEFAULT 0,
      inapp_body TEXT NULL,
      inapp_url VARCHAR(1000) NULL,
      cc VARCHAR(1000) NULL,
      bcc VARCHAR(1000) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Ticket administration extensions. These are additive so existing databases keep their data.
  const ticketColumns = [
    ["priority", "ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM'"],
    ["department", "VARCHAR(191) NULL"],
    ["assigned_to", "INT NULL"],
    ["service_id", "INT NULL"],
    ["discord_user_id", "VARCHAR(32) NULL"]
  ] as const;
  for (const [name, definition] of ticketColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = ?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(`ALTER TABLE tickets ADD COLUMN \`${name}\` ${definition}`); } catch {}
    }
  }

  const ticketMessageColumns = [
    ["discord_message_id", "VARCHAR(32) NULL"],
    ["discord_synced_at", "DATETIME NULL"]
  ] as const;
  for (const [name, definition] of ticketMessageColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket_messages' AND COLUMN_NAME = ?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(`ALTER TABLE ticket_messages ADD COLUMN \`${name}\` ${definition}`); } catch {}
    }
  }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(191) NOT NULL,
      slug VARCHAR(191) NOT NULL UNIQUE,
      description LONGTEXT NULL,
      published_at DATETIME NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 0,
      content LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_announcement_published(is_published,published_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Discord webhook support for announcements. The webhook URL is stored encrypted by the admin API.
  const announcementColumns = [
    ["discord_webhook_url", "LONGTEXT NULL"],
    ["discord_role_ids", "LONGTEXT NULL"],
    ["discord_webhook_enabled", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["discord_last_status", "ENUM('NONE','SENT','FAILED') NOT NULL DEFAULT 'NONE'"],
    ["discord_last_error", "TEXT NULL"],
    ["discord_sent_at", "DATETIME NULL"]
  ] as const;
  for (const [name, definition] of announcementColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='announcements' AND COLUMN_NAME=?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(`ALTER TABLE announcements ADD COLUMN \`${name}\` ${definition}`); } catch {}
    }
  }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS affiliates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      referral_code VARCHAR(191) NOT NULL UNIQUE,
      reward_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      visitors INT NOT NULL DEFAULT 0,
      signups INT NOT NULL DEFAULT 0,
      signed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_affiliates_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_affiliate_user(user_id),
      INDEX idx_affiliate_enabled(enabled)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Keeps existing V1/V1.2/V1.5 installations compatible.
  // MariaDB versions used by existing installations may not support
  // IF NOT EXISTS for ALTER TABLE, so each column is added conditionally.
  const columns = [
    ["edit_preference_message", "TEXT NULL"],
    ["mail_enabled", "TINYINT(1) NOT NULL DEFAULT 1"],
    ["inapp_title", "VARCHAR(255) NULL"],
    ["inapp_enabled", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["inapp_body", "TEXT NULL"],
    ["inapp_url", "VARCHAR(1000) NULL"],
    ["cc", "VARCHAR(1000) NULL"],
    ["bcc", "VARCHAR(1000) NULL"]
  ] as const;

  for (const [name, definition] of columns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'email_templates'
         AND COLUMN_NAME = ?`,
      [name]
    );

    if (Number(rows[0]?.count ?? 0) === 0) {
      await database.execute(
        `ALTER TABLE email_templates ADD COLUMN \`${name}\` ${definition}`
      );
    }
  }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS custom_properties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      property_key VARCHAR(191) NOT NULL UNIQUE,
      model VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description LONGTEXT NULL,
      validation TEXT NULL,
      non_editable TINYINT(1) NOT NULL DEFAULT 0,
      required TINYINT(1) NOT NULL DEFAULT 0,
      show_on_invoice TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL UNIQUE,
      permissions LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tax_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      rate DECIMAL(7,4) NOT NULL DEFAULT 0,
      country VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS gateways (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      gateway_type VARCHAR(100) NOT NULL,
      settings LONGTEXT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS servers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'PTERODACTYL',
      url VARCHAR(500) NULL,
      identifier VARCHAR(191) NULL,
      settings LONGTEXT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    INSERT IGNORE INTO roles(name, permissions) VALUES
      ('admin', ?), ('client', ?)
  `, [JSON.stringify(['All Permissions']), JSON.stringify([])]);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS currencies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(3) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      symbol VARCHAR(10) NOT NULL,
      decimals TINYINT NOT NULL DEFAULT 2,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    INSERT IGNORE INTO currencies(code, name, symbol, decimals, enabled)
    VALUES
      ('EUR', 'Euro', '€', 2, 1),
      ('USD', 'US Dollar', '$', 2, 1),
      ('GBP', 'British Pound', '£', 2, 1)
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      number VARCHAR(64) NOT NULL UNIQUE,
      issued_at DATE NOT NULL,
      due_at DATE NOT NULL,
      status ENUM('PENDING','PAID','VOID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
      currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      remaining DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_invoices_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_invoice_user(user_id),
      INDEX idx_invoice_status(status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      description VARCHAR(500) NOT NULL,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
      unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_invoice_items_invoice FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS invoice_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      gateway VARCHAR(100) NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      fee DECIMAL(12,2) NOT NULL DEFAULT 0,
      transaction_id VARCHAR(191) NULL,
      status ENUM('PENDING','SUCCEEDED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_invoice_transactions_invoice FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      INDEX idx_invoice_tx_invoice(invoice_id),
      INDEX idx_invoice_tx_status(status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      template_key VARCHAR(191) NULL,
      recipient VARCHAR(191) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      status ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
      error_message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_status(status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // --- Complete admin module migrations (V0.1.4) ---
  // Ticket administration extensions. These are additive so existing databases keep their data.
  const ticketAdminColumns = [
    ["priority", "ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM'"],
    ["department", "VARCHAR(191) NULL"],
    ["assigned_to", "INT NULL"],
    ["service_id", "INT NULL"]
  ] as const;
  for (const [name, definition] of ticketAdminColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = ?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(`ALTER TABLE tickets ADD COLUMN \`${name}\` ${definition}`); } catch {}
    }
  }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(191) NOT NULL,
      slug VARCHAR(191) NOT NULL UNIQUE,
      description LONGTEXT NULL,
      published_at DATETIME NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 0,
      content LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_announcement_published(is_published,published_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS affiliates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      referral_code VARCHAR(191) NOT NULL UNIQUE,
      reward_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      visitors INT NOT NULL DEFAULT 0,
      signups INT NOT NULL DEFAULT 0,
      signed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_affiliates_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_affiliate_user(user_id),
      INDEX idx_affiliate_enabled(enabled)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);


  await database.execute(`
    CREATE TABLE IF NOT EXISTS custom_properties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      property_key VARCHAR(191) NOT NULL UNIQUE,
      model VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description LONGTEXT NULL,
      validation TEXT NULL,
      non_editable TINYINT(1) NOT NULL DEFAULT 0,
      required TINYINT(1) NOT NULL DEFAULT 0,
      show_on_invoice TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL UNIQUE,
      permissions LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tax_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      rate DECIMAL(7,4) NOT NULL DEFAULT 0,
      country VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS gateways (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      gateway_type VARCHAR(100) NOT NULL,
      settings LONGTEXT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS servers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'PTERODACTYL',
      url VARCHAR(500) NULL,
      identifier VARCHAR(191) NULL,
      settings LONGTEXT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    INSERT IGNORE INTO roles(name, permissions) VALUES
      ('admin', ?), ('client', ?)
  `, [JSON.stringify(['All Permissions']), JSON.stringify([])]);


  // Catalog / configuration modules. Additive migrations keep existing installations intact.
  const categoryColumns = [
    ["parent_category_id", "INT NULL"],
    ["image_url", "TEXT NULL"]
  ] as const;
  for (const [name, definition] of categoryColumns) {
    const [rows] = await database.query<any[]>(`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='categories' AND COLUMN_NAME=?`, [name]);
    if (Number(rows[0]?.count ?? 0) === 0) { try { await database.execute(`ALTER TABLE categories ADD COLUMN \`${name}\` ${definition}`); } catch {} }
  }
  try { await database.execute(`ALTER TABLE categories MODIFY COLUMN description LONGTEXT NULL`); } catch {}

  await database.execute(`
    CREATE TABLE IF NOT EXISTS config_options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      description LONGTEXT NULL,
      environment_variable VARCHAR(191) NULL,
      type ENUM('TEXT','NUMBER','BOOLEAN','SELECT','PASSWORD') NOT NULL DEFAULT 'TEXT',
      hidden TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_config_options_name(name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS config_option_products (
      config_option_id INT NOT NULL,
      product_id INT NOT NULL,
      PRIMARY KEY(config_option_id, product_id),
      CONSTRAINT fk_cop_option FOREIGN KEY(config_option_id) REFERENCES config_options(id) ON DELETE CASCADE,
      CONSTRAINT fk_cop_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(191) NOT NULL UNIQUE,
      value DECIMAL(12,2) NOT NULL DEFAULT 0,
      type ENUM('PERCENTAGE','FIXED') NOT NULL DEFAULT 'PERCENTAGE',
      applies_to ENUM('PRICE_SETUP','PRICE','SETUP_FEE') NOT NULL DEFAULT 'PRICE_SETUP',
      recurring INT NOT NULL DEFAULT 0,
      max_uses INT NULL,
      max_uses_per_user INT NULL,
      starts_at DATETIME NULL,
      expires_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_coupons_dates(starts_at,expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS coupon_products (
      coupon_id INT NOT NULL,
      product_id INT NOT NULL,
      PRIMARY KEY(coupon_id, product_id),
      CONSTRAINT fk_coupon_product_coupon FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      CONSTRAINT fk_coupon_product_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS currencies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(3) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      symbol VARCHAR(10) NOT NULL,
      decimals TINYINT NOT NULL DEFAULT 2,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const currencyColumns = [
    ["prefix", "VARCHAR(10) NULL"],
    ["suffix", "VARCHAR(10) NULL"],
    ["format", "VARCHAR(32) NOT NULL DEFAULT '1,000.00'"]
  ] as const;
  for (const [name, definition] of currencyColumns) {
    const [rows] = await database.query<any[]>(`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='currencies' AND COLUMN_NAME=?`, [name]);
    if (Number(rows[0]?.count ?? 0) === 0) { try { await database.execute(`ALTER TABLE currencies ADD COLUMN \`${name}\` ${definition}`); } catch {} }
  }

  await database.execute(`
    INSERT IGNORE INTO currencies(code, name, symbol, decimals, enabled)
    VALUES
      ('EUR', 'Euro', '€', 2, 1),
      ('USD', 'US Dollar', '$', 2, 1),
      ('GBP', 'British Pound', '£', 2, 1)
  `);


  await database.execute(`
    CREATE TABLE IF NOT EXISTS billing_agreements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
      reference VARCHAR(191) NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS service_cancellations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      reason TEXT NULL,
      type ENUM('IMMEDIATE','END_OF_TERM','SCHEDULED') NOT NULL DEFAULT 'IMMEDIATE',
      scheduled_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_service_cancellation_service FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE,
      INDEX idx_service_cancellation_service(service_id),
      INDEX idx_service_cancellation_type(type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const serviceColumns = [
    ["plan_id", "INT NULL"],
    ["quantity", "INT NOT NULL DEFAULT 1"],
    ["price", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
    ["currency", "VARCHAR(3) NOT NULL DEFAULT 'EUR'"],
    ["coupon_id", "INT NULL"],
    ["billing_agreement_id", "INT NULL"],
    ["subscription_id", "VARCHAR(191) NULL"],
    ["expires_at", "DATETIME NULL"]
  ] as const;

  for (const [name, definition] of serviceColumns) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'services'
         AND COLUMN_NAME = ?`,
      [name]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      await database.execute(`ALTER TABLE services ADD COLUMN \`${name}\` ${definition}`);
    }
  }

  const orderPaymentColumns = [
    ["gateway", "VARCHAR(100) NULL"],
    ["external_id", "VARCHAR(191) NULL"],
    ["paid_at", "DATETIME NULL"]
  ] as const;
  for (const [name, definition] of orderPaymentColumns) {
    const [rows] = await database.query<any[]>(`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME=?`, [name]);
    if (Number(rows[0]?.count ?? 0) === 0) { try { await database.execute(`ALTER TABLE orders ADD COLUMN \`${name}\` ${definition}`); } catch {} }
  }
  const orderItemColumns = [["plan_id", "INT NULL"], ["coupon_id", "INT NULL"]] as const;
  for (const [name, definition] of orderItemColumns) {
    const [rows] = await database.query<any[]>(`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='order_items' AND COLUMN_NAME=?`, [name]);
    if (Number(rows[0]?.count ?? 0) === 0) { try { await database.execute(`ALTER TABLE order_items ADD COLUMN \`${name}\` ${definition}`); } catch {} }
  }
  try { await database.execute(`ALTER TABLE products MODIFY COLUMN email_template LONGTEXT NULL`); } catch {}
  await database.execute(`CREATE TABLE IF NOT EXISTS stripe_webhook_events (id BIGINT AUTO_INCREMENT PRIMARY KEY, event_id VARCHAR(191) NOT NULL UNIQUE, event_type VARCHAR(191) NOT NULL, payload LONGTEXT NULL, processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_stripe_event_type(event_type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Add foreign keys only when the columns exist and the constraint is not already present.
  const fkChecks = [
    ["fk_services_plan", "ALTER TABLE services ADD CONSTRAINT fk_services_plan FOREIGN KEY(plan_id) REFERENCES product_plans(id) ON DELETE SET NULL"],
    ["fk_services_coupon", "ALTER TABLE services ADD CONSTRAINT fk_services_coupon FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE SET NULL"],
    ["fk_services_billing_agreement", "ALTER TABLE services ADD CONSTRAINT fk_services_billing_agreement FOREIGN KEY(billing_agreement_id) REFERENCES billing_agreements(id) ON DELETE SET NULL"]
  ] as const;
  for (const [constraintName, sql] of fkChecks) {
    const [rows] = await database.query<any[]>(
      `SELECT COUNT(*) AS count FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND CONSTRAINT_NAME = ?`,
      [constraintName]
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      try { await database.execute(sql); } catch {}
    }
  }
  await database.execute(`CREATE TABLE IF NOT EXISTS extensions (
    id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(191) NOT NULL UNIQUE, name VARCHAR(191) NOT NULL,
    version VARCHAR(64) NOT NULL DEFAULT '1.0.0', type ENUM('EXTENSION','THEME','GATEWAY','SERVER','OTHER') NOT NULL DEFAULT 'EXTENSION',
    author VARCHAR(191) NULL, description LONGTEXT NULL, icon_url TEXT NULL, source_url TEXT NULL, package_path TEXT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1, installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_extensions_type(type), INDEX idx_extensions_enabled(enabled)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await database.execute(`CREATE TABLE IF NOT EXISTS extension_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(191) NOT NULL UNIQUE, name VARCHAR(191) NOT NULL, version VARCHAR(64) NOT NULL DEFAULT '1.0.0',
    type ENUM('EXTENSION','THEME','GATEWAY','SERVER','OTHER') NOT NULL DEFAULT 'EXTENSION', author VARCHAR(191) NULL, description LONGTEXT NULL,
    icon_url TEXT NULL, source_url TEXT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0, currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    rating DECIMAL(3,2) NOT NULL DEFAULT 0, reviews INT NOT NULL DEFAULT 0, downloads INT NOT NULL DEFAULT 0, featured TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_catalog_type(type), INDEX idx_catalog_featured(featured)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const extensionSeeds = [
    ["announcements","Announcements","1.0.0","EXTENSION","Neuroshost","Gestion des annonces et communications de la plateforme.","","",0,"EUR",4.90,12,156,1],
    ["affiliates","Affiliates","1.2.0","EXTENSION","Neuroshost","Programme d'affiliation et suivi des parrainages.","","",0,"EUR",4.80,8,97,1],
    ["discord-plus","DiscordPlus","2.0.1","EXTENSION","Neuroshost","Notifications et intégration Discord avancée.","","",0,"EUR",5.00,21,284,0],
    ["discord-notifications","DiscordNotifications","1.1.0","EXTENSION","Neuroshost","Notifications Discord pour les événements de facturation.","","",0,"EUR",4.90,14,203,0],
    ["whatsapp-notifications","WhatsAppNotifications","1.0.0","EXTENSION","Neuroshost","Envoi de notifications transactionnelles WhatsApp.","","",0,"EUR",0,0,0,0]
  ];
  for (const s of extensionSeeds) {
    await database.execute(`INSERT IGNORE INTO extension_catalog (slug,name,version,type,author,description,icon_url,source_url,price,currency,rating,reviews,downloads,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, s);
  }

}

export function db(): mysql.Pool {
  if (!pool) {
    const config = getRuntimeConfig().database;

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4"
    });

    const database = pool;
    ready = initializeDatabase(database).catch((error) => {
      ready = null;
      throw error;
    });
  }

  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const database = db();

  if (ready) {
    await ready;
  }

  const [rows] = await database.execute(sql, params);
  return rows as T;
}
