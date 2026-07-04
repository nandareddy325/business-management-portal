"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { X, FileText, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const CURRENT_YEAR = new Date().getFullYear();

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  designation: string;
  salary?: number;
  bank_name?: string;
  bank_account_no?: string;
  pan_number?: string;
  pf_no?: string;
  pf_uan?: string;
}

interface Props { onClose: () => void; onSuccess: () => void; }

export default function GeneratePaySlipModal({ onClose, onSuccess }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedEmpData, setSelectedEmpData]   = useState<Employee | null>(null);
  const [companyId, setCompanyId]         = useState<string | null>(null);
  const [month, setMonth]                 = useState(new Date().getMonth() + 1);
  const [year, setYear]                   = useState(CURRENT_YEAR);
  const [saving, setSaving]               = useState(false);
  const [savingBank, setSavingBank]       = useState(false);
  const [error, setError]                 = useState("");
  const [bankSaved, setBankSaved]         = useState(false);

  // Earnings
  const [basicSalary, setBasicSalary]           = useState("");
  const [hra, setHra]                           = useState("");
  const [specialAllowance, setSpecialAllowance] = useState("");
  const [incentive, setIncentive]               = useState("");
  const [pfDeduction, setPfDeduction]           = useState("");

  // Bank Details (editable if missing)
  const [bankName, setBankName]         = useState("");
  const [bankAccNo, setBankAccNo]       = useState("");
  const [panNumber, setPanNumber]       = useState("");
  const [pfNo, setPfNo]                 = useState("");
  const [pfUan, setPfUan]               = useState("");

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);

      const { data } = await supabase
        .from("employees")
        .select("id, full_name, employee_code, designation, salary, bank_name, bank_account_no, pan_number, pf_no, pf_uan")
        .eq("company_id", profile.company_id)
        .order("full_name");
      setEmployees(data || []);
    } catch(err) { console.error(err); }
  }

  function handleEmployeeChange(empId: string) {
    setSelectedEmployee(empId);
    setBankSaved(false);
    setError("");
    const emp = employees.find(e => e.id === empId);
    setSelectedEmpData(emp || null);
    if (emp) {
      if (emp.salary) setBasicSalary(emp.salary.toString());
      // Pre-fill bank details if they exist
      setBankName(emp.bank_name || "");
      setBankAccNo(emp.bank_account_no || "");
      setPanNumber(emp.pan_number || "");
      setPfNo(emp.pf_no || "");
      setPfUan(emp.pf_uan || "");
    }
  }

  // Check if bank details are missing
  const bankMissing = selectedEmpData && (!selectedEmpData.bank_name || !selectedEmpData.bank_account_no);

  async function saveBankDetails() {
    if (!selectedEmployee) return;
    setSavingBank(true);
    const { error } = await supabase
      .from("employees")
      .update({
        bank_name:      bankName,
        bank_account_no: bankAccNo,
        pan_number:     panNumber,
        pf_no:          pfNo,
        pf_uan:         pfUan,
      })
      .eq("id", selectedEmployee);
    if (!error) {
      setBankSaved(true);
      // Update local state
      setEmployees(prev => prev.map(e =>
        e.id === selectedEmployee
          ? { ...e, bank_name: bankName, bank_account_no: bankAccNo, pan_number: panNumber, pf_no: pfNo, pf_uan: pfUan }
          : e
      ));
      setSelectedEmpData(prev => prev ? { ...prev, bank_name: bankName, bank_account_no: bankAccNo } : null);
    } else {
      setError("Bank details save failed: " + error.message);
    }
    setSavingBank(false);
  }

  const gross =
    (parseFloat(basicSalary) || 0) + (parseFloat(hra) || 0) +
    (parseFloat(specialAllowance) || 0) + (parseFloat(incentive) || 0);
  const totalDeductions = parseFloat(pfDeduction) || 0;
  const netSalary = gross - totalDeductions;

  async function handleSubmit(status: "draft" | "published") {
    if (!selectedEmployee) { setError("Please select an employee"); return; }
    if (!basicSalary)       { setError("Basic salary is required"); return; }

    setSaving(true); setError("");
    const workDays = new Date(year, month, 0).getDate();
    const basic    = parseFloat(basicSalary)      || 0;
    const hraVal   = parseFloat(hra)              || 0;
    const special  = parseFloat(specialAllowance) || 0;
    const inc      = parseFloat(incentive)        || 0;
    const pf       = parseFloat(pfDeduction)      || 0;

    const { error: insertError } = await supabase.from("payslips").insert({
      company_id:               companyId,
      employee_id:              selectedEmployee,
      month, year,
      effective_work_days:      workDays,
      lop_days:                 0,
      basic_full:               basic, hra_full: hraVal,
      special_allowance_full:   special, incentive_full: inc,
      basic_actual:             basic, hra_actual: hraVal,
      special_allowance_actual: special, incentive_actual: inc,
      gross_salary:             gross,
      pf_deduction:             pf, total_deductions: pf,
      net_salary:               netSalary,
      net_salary_in_words:      `Rupees ${netSalary.toLocaleString("en-IN")} Only`,
      status, auto_generated:   false,
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E8E0D0]">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#B8860B]"/>
            <h2 className="text-lg font-bold text-[#1C1712]">Generate Pay Slip</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F0E8] text-[#6B5E4E] transition-colors">
            <X size={18}/>
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Employee Select */}
          <div>
            <label className="block text-xs font-semibold text-[#6B5E4E] uppercase tracking-wide mb-1.5">Employee *</label>
            <div className="relative">
              <select value={selectedEmployee} onChange={e => handleEmployeeChange(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]">
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_code} · {emp.full_name} — {emp.designation}
                    {(!emp.bank_name || !emp.bank_account_no) ? " ⚠️" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E4E] pointer-events-none"/>
            </div>
          </div>

          {/* ── Bank Details Warning + Form ── */}
          {selectedEmployee && bankMissing && !bankSaved && (
            <div className="border border-amber-200 rounded-2xl overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0"/>
                <div>
                  <p className="text-xs font-bold text-amber-800">Bank Details Missing!</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Payslip lo bank details kaanisthaayi — fill cheyyi (optional, skip cheyyadam possible).
                  </p>
                </div>
              </div>
              <div className="p-4 bg-white space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#6B5E4E] mb-1">Bank Name</label>
                    <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B5E4E] mb-1">Account Number</label>
                    <input type="text" value={bankAccNo} onChange={e => setBankAccNo(e.target.value)}
                      placeholder="e.g. 50100642410003"
                      className="w-full px-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B5E4E] mb-1">PAN Number</label>
                    <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B5E4E] mb-1">PF No</label>
                    <input type="text" value={pfNo} onChange={e => setPfNo(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B5E4E] mb-1">PF UAN</label>
                    <input type="text" value={pfUan} onChange={e => setPfUan(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
                  </div>
                </div>
                <button onClick={saveBankDetails} disabled={savingBank || !bankName || !bankAccNo}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                  {savingBank ? "Saving..." : "Save Bank Details"}
                </button>
              </div>
            </div>
          )}

          {/* Bank Saved Confirmation */}
          {bankSaved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <CheckCircle2 size={15} className="text-green-600"/>
              <p className="text-xs font-medium text-green-700">Bank details saved successfully! ✅</p>
            </div>
          )}

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B5E4E] uppercase tracking-wide mb-1.5">Month</label>
              <div className="relative">
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]">
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E4E] pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B5E4E] uppercase tracking-wide mb-1.5">Year</label>
              <div className="relative">
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]">
                  {[CURRENT_YEAR, CURRENT_YEAR-1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E4E] pointer-events-none"/>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <p className="text-xs font-bold text-[#B8860B] uppercase tracking-wider border-b border-[#E8E0D0] pb-2 mb-3">Earnings</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:"Basic Salary *",    value: basicSalary,      set: setBasicSalary      },
                { label:"HRA",               value: hra,              set: setHra              },
                { label:"Special Allowance", value: specialAllowance, set: setSpecialAllowance },
                { label:"Incentive",         value: incentive,        set: setIncentive        },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-[#6B5E4E] mb-1">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8B7A] text-sm">₹</span>
                    <input type="text" inputMode="numeric" value={f.value}
                      onChange={e => f.set(e.target.value.replace(/[^0-9.]/g,""))}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider border-b border-[#E8E0D0] pb-2 mb-3">Deductions</p>
            <div>
              <label className="block text-xs text-[#6B5E4E] mb-1">PF Deduction</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8B7A] text-sm">₹</span>
                <input type="text" inputMode="numeric" value={pfDeduction}
                  onChange={e => setPfDeduction(e.target.value.replace(/[^0-9.]/g,""))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-sm border border-[#E8E0D0] rounded-xl bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 text-[#1C1712]"/>
              </div>
            </div>
          </div>

          {/* Net Pay Preview */}
          <div className="bg-[#1C1712] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9A8B7A] uppercase tracking-wide">Net Pay</p>
              <p className="text-2xl font-bold text-[#B8860B] mt-0.5">₹{netSalary.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right text-xs text-[#6B5E4E]">
              <p>{MONTHS[month-1]} {year}</p>
              <p className="mt-0.5">Gross ₹{gross.toLocaleString("en-IN")} − PF ₹{totalDeductions.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => handleSubmit("draft")} disabled={saving}
              className="flex-1 py-2.5 border border-[#B8860B] text-[#B8860B] rounded-xl text-sm font-medium hover:bg-[#B8860B]/5 transition-colors disabled:opacity-50">
              Save as Draft
            </button>
            <button onClick={() => handleSubmit("published")} disabled={saving}
              className="flex-1 py-2.5 bg-[#B8860B] hover:bg-[#9A7209] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Generate & Publish"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}