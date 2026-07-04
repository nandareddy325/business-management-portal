import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel Cron: runs every 1st of month at 9:00 AM IST (3:30 AM UTC)
// vercel.json → { "crons": [{ "path": "/api/cron/generate-payslips", "schedule": "30 3 1 * *" }] }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getMonthDays(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calcActual(full: number, workDays: number, lop: number): number {
  if (lop === 0 || workDays === 0) return full;
  const perDay = full / workDays;
  return Math.round(full - perDay * lop);
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"];
  if (num === 0) return "Zero";
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
  return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
}

async function generateForMonth(month: number, year: number) {
  const workDays = getMonthDays(year, month);

  // Fetch all active employees with salary config
  const { data: employees, error: empError } = await supabaseAdmin
    .from("profiles")
    .select(`
      id, full_name, company_id,
      salary_basic, salary_hra,
      salary_special_allowance, salary_incentive,
      salary_pf_deduction
    `)
    .eq("role", "employee")
    .eq("is_active", true);

  if (empError) throw new Error(empError.message);
  if (!employees || employees.length === 0) {
    return { generated: 0, skipped: 0, errors: [] };
  }

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const emp of employees) {
    // Skip if payslip already exists
    const { data: existing } = await supabaseAdmin
      .from("payslips")
      .select("id")
      .eq("employee_id", emp.id)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (existing) { skipped++; continue; }

    // Get LOP from attendance (absent/lop days this month)
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("status")
      .eq("employee_id", emp.id)
      .gte("date", monthStart)
      .lt("date", monthEnd);

    const lop = (attendance || []).filter(
      (a: any) => a.status === "absent" || a.status === "lop"
    ).length;

    // Salary components
    const basic = emp.salary_basic || 0;
    const hra = emp.salary_hra || 0;
    const special = emp.salary_special_allowance || 0;
    const incentive = emp.salary_incentive || 0;
    const pf = emp.salary_pf_deduction || 0;

    // Actual after LOP
    const actualBasic     = calcActual(basic,     workDays, lop);
    const actualHra       = calcActual(hra,        workDays, lop);
    const actualSpecial   = calcActual(special,    workDays, lop);
    const actualIncentive = calcActual(incentive,  workDays, lop);
    const actualPf        = calcActual(pf,         workDays, lop);

    const gross  = actualBasic + actualHra + actualSpecial + actualIncentive;
    const net    = gross - actualPf;
    const words  = `Rupees ${numberToWords(Math.round(net))} Only`;

    const { error: insertError } = await supabaseAdmin.from("payslips").insert({
      company_id:               emp.company_id,
      employee_id:              emp.id,
      month,
      year,
      effective_work_days:      workDays - lop,
      lop_days:                 lop,
      basic_full:               basic,
      hra_full:                 hra,
      special_allowance_full:   special,
      incentive_full:           incentive,
      basic_actual:             actualBasic,
      hra_actual:               actualHra,
      special_allowance_actual: actualSpecial,
      incentive_actual:         actualIncentive,
      gross_salary:             gross,
      pf_deduction:             actualPf,
      total_deductions:         actualPf,
      net_salary:               net,
      net_salary_in_words:      words,
      status:                   "draft",
      auto_generated:           true,
    });

    if (insertError) {
      errors.push(`${emp.full_name}: ${insertError.message}`);
    } else {
      generated++;
    }
  }

  return { generated, skipped, errors };
}

// ── Vercel Cron trigger (GET) ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron runs on 1st → generate for previous month
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = target.getMonth() + 1;
  const year  = target.getFullYear();

  try {
    const result = await generateForMonth(month, year);
    return NextResponse.json({ success: true, month, year, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Manual trigger from Admin panel (POST) ────────────────────────────────────
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const month = Number(body.month);
  const year  = Number(body.year);

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Valid month (1-12) and year required" }, { status: 400 });
  }

  try {
    const result = await generateForMonth(month, year);
    return NextResponse.json({ success: true, month, year, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}