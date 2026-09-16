export const PERMISSIONS = [
  "All Permissions",
  "View Settings","Update Settings","Create Users","Update Users","View Users","Delete Users","Impersonate Users",
  "Create Invoices","Update Invoices","View Invoices","Delete Invoices","Bulk Delete Invoices","Create Invoice Transactions","Update Invoice Transactions","View Invoice Transactions","Delete Invoice Transactions","Bulk Delete Invoice Transactions",
  "Create Products","Update Products","View Products","Delete Products","Bulk Delete Products","Create Categories","Update Categories","View Categories","Delete Categories","Bulk Delete Categories",
  "Create Tickets","Update Tickets","View Tickets","Delete Tickets","Bulk Delete Tickets","Delete Ticket Messages",
  "Create Orders","Update Orders","View Orders","Delete Orders","Bulk Delete Orders",
  "Create Services","Update Services","View Services","Delete Services","Bulk Delete Services","Create Service Cancellations","Update Service Cancellations","View Service Cancellations","Delete Service Cancellations","Bulk Delete Service Cancellations",
  "Create Custom Properties","Update Custom Properties","View Custom Properties","Delete Custom Properties","Bulk Delete Custom Properties",
  "Create Currencies","Update Currencies","View Currencies","Delete Currencies","Bulk Delete Currencies",
  "View Audits","View Cron Stats","View Debug Logs","Create Roles","Update Roles","View Roles","Delete Roles","Bulk Delete Roles",
  "Create Coupons","Update Coupons","View Coupons","Delete Coupons","Bulk Delete Coupons",
  "Create Config Options","Update Config Options","View Config Options","Delete Config Options","Bulk Delete Config Options",
  "Create Tax Rates","Update Tax Rates","View Tax Rates","Delete Tax Rates","Bulk Delete Tax Rates",
  "Create Gateways","Update Gateways","View Gateways","Delete Gateways","Bulk Delete Gateways",
  "Create Servers","Update Servers","View Servers","Delete Servers","Bulk Delete Servers",
  "Create API Keys","Update API Keys","View API Keys","Delete API Keys",
  "Update Extensions","View Extensions","Install Extensions","Delete Extensions","View Failed Jobs",
  "View Email Logs","View Email Log","Create Email Templates","Update Email Templates","View Email Templates","Delete Email Templates","Bulk Delete Email Templates",
  "Create OAuth Clients","Update OAuth Clients","View OAuth Clients","Delete OAuth Clients","Bulk Delete OAuth Clients",
  "View Revenue Widget","View Overview Widget","View Tickets Widget","View Active Users Widget","View and Update Application",
  "View Announcements","Create Announcements","Update Announcements","Delete Announcements","View Affiliates","Create Affiliates","Update Affiliates","Delete Affiliates"
] as const;
export type Permission = typeof PERMISSIONS[number];
