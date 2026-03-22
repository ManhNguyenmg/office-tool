import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const CsvToExcel = () => {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const wb = XLSX.read(text, { type: "string" });
      setWorkbook(wb);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      setPreview(data.slice(0, 10));
    };
    reader.readAsText(file);
  }, []);

  const handleDownload = () => {
    if (!workbook) return;
    setProcessing(true);
    setTimeout(() => {
      XLSX.writeFile(workbook, fileName.replace(/\.csv$/i, "") + ".xlsx");
      fireConfetti();
      setProcessing(false);
    }, 500);
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang chuyển đổi..." />
      <StudioLayout
        title="CSV → Excel 📋"
        subtitle={fileName || "Chọn file CSV để chuyển đổi"}
        downloadLabel="Tải .xlsx"
        downloadDisabled={!workbook}
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <FileSpreadsheet size={18} />, label: "Convert", active: true },
          { icon: <Upload size={18} />, label: "Upload" },
        ]}
      >
        {!workbook ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[250px] border-dashed border-2 hover:border-primary group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <FileSpreadsheet size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả file CSV vào đây</span>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="bg-card rounded-3xl border border-border overflow-auto">
            <table className="w-full text-sm">
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri} className={ri === 0 ? "bg-primary/5 font-semibold" : "border-t border-border"}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-foreground">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length >= 10 && (
              <p className="text-xs text-muted-foreground p-3 text-center">Hiển thị 10 hàng đầu tiên...</p>
            )}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default CsvToExcel;
