import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Trash2, FileX } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfDeletePages = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    const f = files[0];
    setFile(f);
    setSelected(new Set());
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setPageCount(pdf.getPageCount());
  }, []);

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!file || selected.size === 0) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      // Remove in reverse order to keep indices valid
      const toDelete = Array.from(selected).sort((a, b) => b - a);
      toDelete.forEach(i => pdf.removePage(i));
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang xóa trang..." />
      <StudioLayout
        title="Xóa Trang PDF 🗑️"
        subtitle={file ? `${pageCount} trang · đã chọn ${selected.size}` : "Chọn file PDF"}
        downloadLabel={`Xóa ${selected.size} trang`}
        downloadDisabled={!file || selected.size === 0}
        onDownload={handleDelete}
        sidebarTools={[
          { icon: <FileX size={18} />, label: "Delete", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setSelected(new Set()); setPageCount(0); } },
        ]}
      >
        {!file ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px] border-dashed border-2 hover:border-primary group"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <FileX size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả file PDF vào đây</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Click vào trang muốn xóa (hiện màu đỏ = sẽ bị xóa)</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center text-xs font-bold transition-all ${
                    selected.has(i)
                      ? "bg-destructive/10 border-destructive text-destructive"
                      : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <span className="text-base">{selected.has(i) ? "🗑️" : "📄"}</span>
                  <span>{i + 1}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i)))}
                className="px-4 py-2 rounded-2xl border border-destructive text-destructive text-sm hover:bg-destructive/10 transition-all">
                Chọn tất cả
              </button>
              <button onClick={() => setSelected(new Set())}
                className="px-4 py-2 rounded-2xl border border-border text-muted-foreground text-sm hover:bg-muted transition-all">
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PdfDeletePages;
