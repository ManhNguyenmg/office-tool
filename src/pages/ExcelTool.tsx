import { useState } from "react";
import * as XLSX from "xlsx";
import { Table, Plus, Trash2 } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const COLS = 3;
const COL_LABELS = ["A", "B", "C"];

const ExcelTool = () => {
  const [data, setData] = useState(() =>
    Array.from({ length: 5 }, () => Array.from({ length: COLS }, () => ""))
  );
  const [processing, setProcessing] = useState(false);

  const updateCell = (r: number, c: number, val: string) => {
    setData((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[r][c] = val;
      return copy;
    });
  };

  const addRow = () => setData((prev) => [...prev, Array(COLS).fill("")]);

  const handleDownload = () => {
    setProcessing(true);
    setTimeout(() => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, "express-data.xlsx");
      fireConfetti();
      setProcessing(false);
    }, 500);
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang tạo file Excel..." />
      <StudioLayout
        title="Excel Express 📊"
        subtitle={`${data.length} hàng · ${COLS} cột`}
        downloadLabel="Tải .xlsx"
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <Table size={18} />, label: "Table", active: true },
          { icon: <Plus size={18} />, label: "Add Row", onClick: addRow },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => setData(Array.from({ length: 5 }, () => Array(COLS).fill(""))) },
        ]}
      >
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-12 py-3 text-center text-xs font-medium text-muted-foreground">#</th>
                {COL_LABELS.map((l) => (
                  <th key={l} className="py-3 text-center text-sm font-semibold text-foreground">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="text-center text-xs text-muted-foreground font-medium py-2">{ri + 1}</td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-1">
                      <input
                        value={cell}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        className="w-full bg-transparent text-center py-2 px-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-primary/5 transition-all text-foreground"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StudioLayout>
    </>
  );
};

export default ExcelTool;
