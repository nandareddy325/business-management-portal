"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  FileText, Plus, Download, Eye, Search, ChevronDown,
  AlertCircle, CheckCircle2, Zap, RefreshCw
} from "lucide-react";
import GeneratePaySlipModal from "@/components/hr/GeneratePaySlipModal";
import PaySlipViewModal from "@/components/hr/PaySlipViewModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export interface PaySlip {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_no: string;
  employee_designation: string;
  employee_department: string;
  joining_date: string;
  bank_name: string;
  bank_account_no: string;
  pan_number: string;
  pf_no: string;
  pf_uan: string;
  location: string;
  month: number;
  year: number;
  effective_work_days: number;
  lop_days: number;
  basic_full: number;
  hra_full: number;
  special_allowance_full: number;
  incentive_full: number;
  basic_actual: number;
  hra_actual: number;
  special_allowance_actual: number;
  incentive_actual: number;
  gross_salary: number;
  pf_deduction: number;
  total_deductions: number;
  net_salary: number;
  net_salary_in_words: string;
  status: "draft" | "published";
  auto_generated: boolean;
  created_at: string;
}

export default function PaySlipsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const today = new Date();
  const [payslips, setPayslips] = useState<PaySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewPaySlip, setViewPaySlip] = useState<PaySlip | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [publishingAll, setPublishingAll] = useState(false);

  const isDeadlinePassed = today.getDate() > 10;
  const currentMonthName = MONTHS[today.getMonth()];

  useEffect(() => {
    fetchPaySlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  async function fetchPaySlips() {
  setLoading(true);
  try {
    // Step 1: payslips fetch
    const { data: slipsData, error } = await supabase
      .from("payslips")
      .select("*")
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .order("created_at", { ascending: true });

    if (error) { console.error("payslips fetch:", error); setLoading(false); return; }
    if (!slipsData || slipsData.length === 0) { setPayslips([]); setLoading(false); return; }

    // Step 2: employee details fetch
    const empIds = [...new Set(slipsData.map((s: { employee_id: string }) => s.employee_id))];
    const { data: empsData } = await supabase
  .from("employees")
  .select("id, full_name, employee_code, designation, department, join_date, bank_name, bank_account_no, pan_number, pf_no, pf_uan")
  .in("id", empIds);

    interface EmployeeInfo {
      id: string; full_name?: string; employee_code?: string; designation?: string
      department?: string; join_date?: string; bank_name?: string; bank_account_no?: string
      pan_number?: string; pf_no?: string; pf_uan?: string
    }
    const empMap: Record<string, EmployeeInfo> = {};
    (empsData || []).forEach((e: EmployeeInfo) => { empMap[e.id] = e; });

    const mapped = slipsData.map((row: { employee_id: string; [key: string]: unknown }) => {
  const emp: Partial<EmployeeInfo> = empMap[row.employee_id] || {};
  return {
    ...row,
    employee_name:        emp.full_name       || "Unknown",
    employee_no:          emp.employee_code   || "-",
    employee_designation: emp.designation     || "-",
    employee_department:  emp.department      || "-",
    joining_date:         emp.join_date       || "-",
    bank_name:            emp.bank_name       || "",   // ← real data
    bank_account_no:      emp.bank_account_no || "",   // ← real data
    pan_number:           emp.pan_number      || "",   // ← real data
    pf_no:                emp.pf_no           || "",   // ← real data
    pf_uan:               emp.pf_uan          || "",   // ← real data
    location:             "Hyderabad",
  };
});
    setPayslips(mapped as PaySlip[]);
  } catch (err) {
    console.error("fetchPaySlips:", err);
  }
  setLoading(false);
}

  async function handleGenerateAll() {
    setGeneratingAll(true);
    try {
      const res = await fetch("/api/cron/generate-payslips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`,
        },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      alert(`✅ Generated ${data.generated} payslips!\n⏭️ Skipped: ${data.skipped}`);
      fetchPaySlips();
    } catch (err) {
      alert("❌ Generation failed. Check console.");
      console.error(err);
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handlePublishAll() {
    setPublishingAll(true);
    const draftIds = payslips.filter((p) => p.status === "draft").map((p) => p.id);
    if (draftIds.length === 0) {
      alert("No draft payslips to publish.");
      setPublishingAll(false);
      return;
    }
    const { error } = await supabase
      .from("payslips")
      .update({ status: "published" })
      .in("id", draftIds);
    if (!error) {
      alert(`✅ Published ${draftIds.length} payslips!`);
      fetchPaySlips();
    }
    setPublishingAll(false);
  }

  const filtered = payslips.filter((p) =>
    p.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employee_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalNetPay    = filtered.reduce((sum, p) => sum + p.net_salary, 0);
  const publishedCount = filtered.filter((p) => p.status === "published").length;
  const draftCount     = filtered.filter((p) => p.status === "draft").length;

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-6">

      {/* 10th Deadline Banner */}
      {selectedMonth === today.getMonth() + 1 && selectedYear === CURRENT_YEAR && (
        <div className={`mb-5 rounded-2xl px-5 py-3.5 flex items-center gap-3 ${
          isDeadlinePassed
            ? "bg-red-50 border border-red-200"
            : "bg-amber-50 border border-amber-200"
        }`}>
          <AlertCircle size={18} className={isDeadlinePassed ? "text-red-500" : "text-amber-500"} />
          <div className="flex-1">
            {isDeadlinePassed ? (
              <p className="text-sm font-medium text-red-700">
                ⚠️ Deadline passed! {currentMonthName} payslips should have been generated by the 10th.
              </p>
            ) : (
              <p className="text-sm font-medium text-amber-700">
                🗓️ Payslip deadline: <strong>10th {currentMonthName}</strong> —
                {today.getDate() < 10 ? ` ${10 - today.getDate()} days remaining` : " Today is the last day!"}
              </p>
            )}
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="text-xs font-semibold bg-[#B8860B] text-white px-3 py-1.5 rounded-lg hover:bg-[#9A7209] transition-colors disabled:opacity-50"
          >
            {generatingAll ? "Generating..." : "Generate All Now"}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={22} className="text-[#B8860B]" />
            <h1 className="text-2xl font-bold text-[#1C1712]">Pay Slips</h1>
          </div>
          <p className="text-sm text-[#6B5E4E]">
            Auto-generates every 1st · Deadline: 10th of each month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePublishAll}
            disabled={publishingAll || draftCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-green-600 text-green-700 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={15} />
            Publish All ({draftCount})
          </button>
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#B8860B] text-[#B8860B] rounded-xl hover:bg-[#B8860B]/5 transition-colors disabled:opacity-50"
          >
            <Zap size={15} />
            {generatingAll ? "Generating..." : "Generate All"}
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#9A7209] text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-md"
          >
            <Plus size={16} />
            Single Payslip
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Employees", value: filtered.length,                              sub: `${MONTHS[selectedMonth - 1]} ${selectedYear}` },
          { label: "Total Payroll",   value: `₹${totalNetPay.toLocaleString("en-IN")}`,   sub: "Net pay this month",   gold: true  },
          { label: "Published",       value: publishedCount,                               sub: "Sent to employees",    green: true },
          { label: "Drafts Pending",  value: draftCount,                                   sub: "Need to publish",      amber: draftCount > 0 },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#E8E0D0] shadow-sm">
            <p className="text-[10px] font-semibold text-[#9A8B7A] uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${
              stat.gold ? "text-[#B8860B]" : stat.green ? "text-green-600" : stat.amber ? "text-amber-600" : "text-[#1C1712]"
            }`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-[#9A8B7A] mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E8E0D0] p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8B7A]" />
          <input
            type="text"
            placeholder="Search employee name or EMP ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"
          />
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712] cursor-pointer"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5E4E] pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712] cursor-pointer"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5E4E] pointer-events-none" />
        </div>
        <button onClick={fetchPaySlips} className="p-2 rounded-xl border border-[#E8E0D0] hover:bg-[#F5F0E8] text-[#6B5E4E] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#6B5E4E] text-sm">
            Loading payslips...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="text-[#D4C5A9] mb-3" />
            <p className="text-[#6B5E4E] font-medium">No payslips for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            <p className="text-xs text-[#9A8B7A] mt-1">
              Click <strong>&ldquo;Single Payslip&rdquo;</strong> to create one or <strong>&ldquo;Generate All&rdquo;</strong> for all employees
            </p>
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              className="mt-4 flex items-center gap-2 bg-[#B8860B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#9A7209] transition-colors"
            >
              <Zap size={15} />
              {generatingAll ? "Generating..." : "Generate All Payslips"}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F0E8] border-b border-[#E8E0D0]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Employee</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Work Days</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">LOP</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Gross</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Deductions</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Net Pay</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-[#6B5E4E] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((slip, idx) => (
                <tr
                  key={slip.id}
                  className={`border-b border-[#F0E8DA] hover:bg-[#FBF8F3] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-[#FDFAF7]"}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#B8860B]/15 flex items-center justify-center text-[#B8860B] font-bold text-xs">
                        {slip.employee_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1712] text-sm">{slip.employee_name}</p>
                        <p className="text-[10px] text-[#9A8B7A]">{slip.employee_no} · {slip.employee_designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-[#1C1712]">{slip.effective_work_days}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${slip.lop_days > 0 ? "text-red-500" : "text-green-600"}`}>
                      {slip.lop_days}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#1C1712] font-medium">
                    ₹{slip.gross_salary.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-500">
                    {slip.total_deductions > 0 ? `-₹${slip.total_deductions.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#B8860B]">
                    ₹{slip.net_salary.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      slip.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {slip.auto_generated && <Zap size={9} />}
                      {slip.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewPaySlip(slip)}
                        className="p-1.5 rounded-lg hover:bg-[#F5F0E8] text-[#6B5E4E] hover:text-[#B8860B] transition-colors"
                        title="View & Print"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setViewPaySlip(slip)}
                        className="p-1.5 rounded-lg hover:bg-[#F5F0E8] text-[#6B5E4E] hover:text-[#B8860B] transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showGenerateModal && (
        <GeneratePaySlipModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => { setShowGenerateModal(false); fetchPaySlips(); }}
        />
      )}
      {viewPaySlip && (
        <PaySlipViewModal
          payslip={viewPaySlip}
          onClose={() => setViewPaySlip(null)}
        />
      )}
    </div>
  );
}