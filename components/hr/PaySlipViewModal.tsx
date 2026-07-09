"use client";

import { useRef, useState } from "react";
import { X, Printer, Download, Loader2 } from "lucide-react";
import type { PaySlip } from "@/app/(dashboard)/hr/payslips/page";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// ── Number to Words ──────────────────────────────────────────
function numberToWords(num: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
    "Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (num === 0) return "Zero";
  if (num < 20)  return ones[num];
  if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? " " + ones[num%10] : "");
  if (num < 1000) return ones[Math.floor(num/100)] + " Hundred" + (num%100 ? " " + numberToWords(num%100) : "");
  if (num < 100000) return numberToWords(Math.floor(num/1000)) + " Thousand" + (num%1000 ? " " + numberToWords(num%1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num/100000)) + " Lakh" + (num%100000 ? " " + numberToWords(num%100000) : "");
  return numberToWords(Math.floor(num/10000000)) + " Crore" + (num%10000000 ? " " + numberToWords(num%10000000) : "");
}



interface Props {
  payslip: PaySlip;
  onClose: () => void;
}

export default function PaySlipViewModal({ payslip, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const totalEarningsActual =
    (payslip.basic_actual || 0) + (payslip.hra_actual || 0) +
    (payslip.special_allowance_actual || 0) + (payslip.incentive_actual || 0);

  const netInWords = `Rupees ${numberToWords(Math.round(payslip.net_salary || 0))} Only`;

  const joiningDateFormatted =
    payslip.joining_date && payslip.joining_date !== "-"
      ? new Date(payslip.joining_date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
      : "-";

  const infoRows = [
    ["Name:",               payslip.employee_name,           "Employee No:",     payslip.employee_no || "-"],
    ["Joining Date:",       joiningDateFormatted,             "Bank Name:",       payslip.bank_name || "-"],
    ["Designation:",        payslip.employee_designation,     "Bank Account No:", payslip.bank_account_no || "-"],
    ["Department:",         payslip.employee_department,      "PAN Number:",      payslip.pan_number || "-"],
    ["Location:",           payslip.location || "Hyderabad",  "PF No:",           payslip.pf_no || ""],
    ["Effective Work Days:", String(payslip.effective_work_days || 31), "PF UAN:", payslip.pf_uan || ""],
    ["LOP:",                String(payslip.lop_days || 0),    "",                 ""],
  ];

  const earningsRows = [
    { label:"BASIC",             full: payslip.basic_full || 0,             actual: payslip.basic_actual || 0,             ded:"PF", dedVal: payslip.pf_deduction || 0 },
    { label:"HRA",               full: payslip.hra_full || 0,               actual: payslip.hra_actual || 0,               ded:"",   dedVal: 0 },
    { label:"SPECIAL ALLOWANCE", full: payslip.special_allowance_full || 0, actual: payslip.special_allowance_actual || 0, ded:"",   dedVal: 0 },
    { label:"INCENTIVE",         full: payslip.incentive_full || 0,         actual: payslip.incentive_actual || 0,         ded:"",   dedVal: 0 },
  ];

  const s = {
    table:  { width:"100%", borderCollapse:"collapse" as const, marginBottom:3 },
    td:     { border:"1px solid #999", padding:"5px 8px", fontSize:12 } as React.CSSProperties,
    tdL:    { border:"1px solid #bbb", padding:"4px 8px", fontSize:12, fontWeight:"bold" as const, color:"#1C1712", width:"22%" } as React.CSSProperties,
    tdV:    { border:"1px solid #bbb", padding:"4px 8px", fontSize:12, color:"#333", width:"28%" } as React.CSSProperties,
    thG:    { border:"1px solid #999", padding:"5px 8px", fontSize:12, background:"#B8860B", color:"white", textAlign:"center" as const, fontWeight:"bold" as const },
    thR:    { border:"1px solid #999", padding:"5px 8px", fontSize:12, background:"#8B0000", color:"white", textAlign:"center" as const, fontWeight:"bold" as const },
    tdTot:  { border:"1px solid #999", padding:"5px 8px", fontSize:12, fontWeight:"bold" as const, background:"#f5f5f0" } as React.CSSProperties,
  };

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>PaySlip - ${payslip.employee_name} - ${MONTHS[payslip.month-1]} ${payslip.year}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Calibri',Arial,sans-serif;padding:24px;color:#1C1712}
        table{width:100%;border-collapse:collapse;margin-bottom:3px}
        @media print{body{padding:10px}@page{margin:1cm}}
      </style>
    </head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  async function handleDownload() {
    const element = printRef.current;
    if (!element) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set({
        margin:      [8, 8, 8, 8],
        filename:    `PaySlip_${payslip.employee_name.replace(/\s+/g,"_")}_${MONTHS[payslip.month-1]}_${payslip.year}.pdf`,
        image:       { type:"jpeg", quality:0.98 },
        html2canvas: { scale:2, useCORS:true, backgroundColor:"#ffffff" },
        jsPDF:       { unit:"mm", format:"a4", orientation:"portrait" },
      }).from(element).save();
    } catch(err) {
      console.error("PDF:", err);
      alert("PDF failed — use Print instead.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D0] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#1C1712]">
              {payslip.employee_name} — {MONTHS[payslip.month-1]} {payslip.year}
            </h2>
            <p className="text-xs text-[#9A8B7A] mt-0.5">{payslip.employee_designation}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E8E0D0] rounded-lg hover:bg-[#F5F0E8] text-[#6B5E4E] transition-colors">
              <Printer size={13}/> Print
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#B8860B] text-white rounded-lg hover:bg-[#9A7209] transition-colors disabled:opacity-60">
              {downloading ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>}
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F0E8] text-[#6B5E4E] transition-colors">
              <X size={17}/>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto flex-1 bg-gray-100 p-8">
          <div ref={printRef} style={{ width:700, margin:"0 auto", background:"white", fontFamily:"'Calibri',Arial,sans-serif", fontSize:12 }}>

            {/* ── Company Header with Logo ── */}
            <table style={s.table}>
              <tbody>
                <tr>
                  <td style={{ ...s.td, padding:"12px 16px" }}>
                    <div style={{
  display: "grid",
  gridTemplateColumns: "120px 1fr 120px", // logo width = spacer width
  alignItems: "center",
  padding: "16px 24px",
}}>
  {/* eslint-disable-next-line @next/next/no-img-element -- static PDF template rendered via html2pdf, next/image not compatible here */}
  <img src="/GK_LOGO.png" alt="GK Logo" style={{ width: 80, height: "auto" }} />

  <div style={{ textAlign: "center" }}>
    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 22 }}>GKA1 ENTERPRISES PRIVATE LIMITED</h2>
    <p style={{ margin: "4px 0 0", fontSize: 12, fontStyle: "italic", color: "#374151" }}>
      301/4, 4th Floor, Alluri Trade Centre, KPHB Rd, Bhagya Nagar Colony, Hyderabad, Telangana 500072
    </p>
  </div>

  <div /> {/* empty spacer — balances the logo column so center text is truly centered */}
</div>
                    <div style={{ fontSize:13, fontWeight:"bold", textAlign:"center", marginTop:10, background:"#f5f5f0", padding:"5px", border:"1px solid #ccc" }}>
                      Payslip for the month of {MONTHS[payslip.month-1]} {payslip.year}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Employee Info ── */}
            <table style={s.table}>
              <tbody>
                {infoRows.map((row, i) => (
                  <tr key={i}>
                    <td style={s.tdL}>{row[0]}</td>
                    <td style={s.tdV}>{row[1]}</td>
                    <td style={s.tdL}>{row[2]}</td>
                    <td style={s.tdV}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Earnings & Deductions ── */}
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.thG}>Earnings</th>
                  <th style={s.thG}>Full</th>
                  <th style={s.thG}>Actual</th>
                  <th style={s.thR}>Deductions</th>
                  <th style={s.thR}>Actual</th>
                </tr>
              </thead>
              <tbody>
                {earningsRows.map((row, i) => (
                  <tr key={i}>
                    <td style={s.td}>{row.label}</td>
                    <td style={{ ...s.td, textAlign:"right" }}>{row.full.toLocaleString("en-IN")}</td>
                    <td style={{ ...s.td, textAlign:"right" }}>{row.actual.toLocaleString("en-IN")}</td>
                    <td style={s.td}>{row.ded}</td>
                    <td style={{ ...s.td, textAlign:"right" }}>{i === 0 ? (row.dedVal||0).toLocaleString("en-IN") : ""}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={s.tdTot}>Total Earnings: INR.</td>
                  <td style={{ ...s.tdTot, textAlign:"right" }}>{totalEarningsActual.toLocaleString("en-IN")}</td>
                  <td style={s.tdTot}>Total Deductions: INR.</td>
                  <td style={{ ...s.tdTot, textAlign:"right" }}>{(payslip.total_deductions||0).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            {/* ── Net Pay ── */}
            <table style={s.table}>
              <tbody>
                <tr>
                  <td style={{ ...s.td, background:"#1C1712", color:"#B8860B", fontWeight:"bold", fontSize:13, textAlign:"center", padding:"10px" }}>
                    Net Pay for the month ( Total Earnings - Total Deductions): &nbsp;
                    <span style={{ fontSize:16 }}>{(payslip.net_salary||0).toLocaleString("en-IN")}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ ...s.td, fontStyle:"italic", textAlign:"center", color:"#444", fontSize:11, padding:"6px" }}>
                    ({netInWords})
                  </td>
                </tr>
                <tr>
                  <td style={{ border:"none", padding:"10px 0 0", fontSize:10, fontStyle:"italic", textAlign:"center", color:"#888" }}>
                    This is a system generated payslip and does not require signature.
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </div>
    </div>
  );
}