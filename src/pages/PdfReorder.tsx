import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { GripVertical, Layers, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfReorder = () => {
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFile = useCallback(async (files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    const f = files[0];
    setFile(f);
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setOrder(Array.from({ length: pdf.getPageCount() }, (_, i) => i));
  }, []);

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setOrder(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === order.length - 1) return;
    setOrder(prev => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(srcPdf, order);
      pages.forEach(p => newPdf.addPage(p));
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reordered-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang sắp xếp lại trang..." />
      <StudioLayout
        title="Sắp Xếp Trang PDF 📌"
        subtitle={file ? `${order.length} trang — Kéo thả để sắp xếp lại` : "Chọn file PDF"}
        downloadLabel="Lưu thứ tự mới"
        downloadDisabled={!file}
        onDownload={handleSave}
        sidebarTools={[
          { icon: <Layers size={18} />, label: "Reorder", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setOrder([]); } },
        ]}
      >
        {!file ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px] border-dashed border-2 hover:border-primary group"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <Layers size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả file PDF vào đây</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-2 max-w-md">
            <p className="text-xs text-muted-foreground mb-3">Kéo thả hoặc dùng nút mũi tên để đổi vị trí trang</p>
            {order.map((pageIdx, i) => (
              <div
                key={`${pageIdx}-${i}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragEnd={() => setDragIdx(null)}
                className={`flex items-center gap-3 bg-card rounded-2xl border border-border p-3 cursor-grab active:cursor-grabbing transition-all ${dragIdx === i ? "opacity-50 scale-95" : "hover:border-primary/40"}`}
              >
                <GripVertical size={16} className="text-muted-foreground shrink-0" />
                <div className="w-8 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {pageIdx + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">Trang {pageIdx + 1}</span>
                <span className="text-xs text-muted-foreground">→ vị trí {i + 1}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveUp(i)} disabled={i === 0}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-30 transition-all">
                    <ArrowUp size={13} />
                  </button>
                  <button onClick={() => moveDown(i)} disabled={i === order.length - 1}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-30 transition-all">
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PdfReorder;
