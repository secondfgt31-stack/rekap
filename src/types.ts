export type Role = 'Translator' | 'Editor' | 'Solo';
export type EmployeeStatus = 'active' | 'inactive' | 'suspended';
export type WorkLogStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';
export type PaymentStatus = 'PAID' | 'UNPAID';

export interface Employee {
  id: number;
  nickname: string;
  username?: string;
  role: Role;
  status: EmployeeStatus;
  joined_date: string;
  total_chapters?: number;
  total_earnings?: number;
}

export interface WorkLog {
  id: number;
  employee_id: number | null;
  nickname_input: string;
  role_input: Role;
  title: string;
  chapter: number;
  nominal: number;
  snapshot_rate: number;
  status: WorkLogStatus;
  work_date: string;
  submitted_at: string;
  verified_by?: string;
  admin_notes?: string;
  employee_real_name?: string;
}

export interface PayrollRate {
  role: Role;
  rate_per_chapter: number;
  updated_at: string;
}

export interface MemberPayroll {
  employee_id: number;
  nickname: string;
  role: Role;
  total_chapters: number;
  gaji: number;
  status_bayar: PaymentStatus;
  paid_date?: string;
  payment_notes?: string;
}

export interface RoleSummary {
  role: Role;
  total_chapters: number;
  total_gaji: number;
}

export interface MonthlyBreakdown {
  month: number;
  monthName: string;
  total: number;
}

export interface PayrollRekapResponse {
  month: number;
  year: number;
  total_chapters: number;
  total_gaji: number;
  roles: RoleSummary[];
  members: MemberPayroll[];
  yearly_breakdown: MonthlyBreakdown[];
  total_yearly: number;
}

export interface AdminDashboardStats {
  active_employees: number;
  chapters_this_month: number;
  payout_this_month: number;
  total_paid: number;
  total_unpaid: number;
  pending_review_count: number;
  monthly_expenditure: { month: string; payout: number; chapters: number }[];
  role_distribution: { role: Role; count: number; chapters: number; payout: number }[];
}

export interface DiscordSettingsData {
  id: number;
  webhook_url: string;
  bot_token: string;
  guild_id: string;
  application_id: string;
  enabled: number;
}

export interface DiscordLog {
  id: number;
  type: string;
  payload: string;
  status: string;
  sent_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  details: string;
  performed_by: string;
  timestamp: string;
}
