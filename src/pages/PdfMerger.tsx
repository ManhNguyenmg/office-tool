import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Combine, Trash2, GripVertical } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfMerger = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const pdfs = Array.from(fileList).filter((f) => f.type === "application/pdf");
    setFiles((prev) => [...prev, ...pdfs]);
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const pdfBytes = await merged.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang gộp PDF..." />
      <StudioLayout
        title="PDF Merger 📄"
        subtitle={`${files.length} file đã chọn`}
        downloadLabel="Gộp & Tải"
        downloadDisabled={files.length < 2}
        onDownload={handleMerge}
        sidebarTools={[
          { icon: <Combine size={18} />, label: "Merge", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => setFiles([]) },
        ]}
      >
        <label
          className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[160px] border-dashed border-2 hover:border-primary group mb-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <Combine size={36} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-medium text-muted-foreground">Kéo thả file PDF vào đây</span>
          <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3">
                <GripVertical size={16} className="text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} className="text-destructive hover:text-destructive/80">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PdfMerger;
