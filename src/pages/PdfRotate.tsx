import { useState, useCallback } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { RotateCw, Trash2 } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfRotate = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [selection, setSelection] = useState<"all" | "even" | "odd">("all");
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    setFile(files[0]);
    const bytes = await files[0].arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setPageCount(pdf.getPageCount());
  }, []);

  const handleRotate = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();
      pages.forEach((page, i) => {
        const shouldRotate =
          selection === "all" ||
          (selection === "even" && (i + 1) % 2 === 0) ||
          (selection === "odd" && (i + 1) % 2 !== 0);
        if (shouldRotate) {
          page.setRotation(degrees((page.getRotation().angle + angle) % 360));
        }
      });
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rotated-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang xoay trang..." />
      <StudioLayout
        title="Xoay Trang PDF 🔄"
        subtitle={file ? `${pageCount} trang` : "Chọn file PDF"}
        downloadLabel="Xoay & Tải"
        downloadDisabled={!file}
        onDownload={handleRotate}
        sidebarTools={[
          { icon: <RotateCw size={18} />, label: "Rotate", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setPageCount(0); } },
        ]}
      >
        <div className="space-y-6 max-w-md">
          <label
            className="card-neo flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed border-2 hover:border-primary group py-8"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            {file
              ? <p className="font-medium text-foreground">{file.name} — {pageCount} trang</p>
              : <>
                  <RotateCw size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-muted-foreground">Chọn file PDF</span>
                </>
            }
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>

          <div className="card-neo space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Góc xoay</label>
              <div className="flex gap-2">
                {([90, 180, 270] as const).map(a => (
                  <button key={a} onClick={() => setAngle(a)}
                    className={`flex-1 py-3 rounded-2xl font-semibold text-sm border transition-all ${angle === a ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {a}°
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Áp dụng cho</label>
              <div className="flex gap-2">
                {(["all", "odd", "even"] as const).map(s => (
                  <button key={s} onClick={() => setSelection(s)}
                    className={`flex-1 py-2 rounded-2xl text-sm border transition-all ${selection === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {s === "all" ? "Tất cả" : s === "odd" ? "Trang lẻ" : "Trang chẵn"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StudioLayout>
    </>
  );
};

export default PdfRotate;
