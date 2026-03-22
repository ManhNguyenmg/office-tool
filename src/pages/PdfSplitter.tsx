import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Scissors, Trash2, Download } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfSplitter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState("1-3, 4-6");
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: FileList | null) => {
    if (!files?.[0]) return;
    const f = files[0];
    if (f.type !== "application/pdf") return;
    setFile(f);
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setPageCount(pdf.getPageCount());
  }, []);

  const parseRanges = (input: string, total: number): number[][] => {
    return input.split(",").map(part => {
      const [s, e] = part.trim().split("-").map(n => parseInt(n.trim(), 10) - 1);
      const end = isNaN(e) ? s : e;
      const pages: number[] = [];
      for (let i = Math.max(0, s); i <= Math.min(total - 1, end); i++) pages.push(i);
      return pages;
    }).filter(p => p.length > 0);
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const groups = parseRanges(ranges, pageCount);

      for (let i = 0; i < groups.length; i++) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(srcPdf, groups[i]);
        pages.forEach(p => newPdf.addPage(p));
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `split-part${i + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang tách PDF..." />
      <StudioLayout
        title="PDF Splitter ✂️"
        subtitle={file ? `${pageCount} trang — Nhập khoảng trang cần tách` : "Chọn file PDF"}
        downloadLabel="Tách & Tải"
        downloadDisabled={!file}
        onDownload={handleSplit}
        sidebarTools={[
          { icon: <Scissors size={18} />, label: "Split", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setPageCount(0); } },
        ]}
      >
        {!file ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px] border-dashed border-2 hover:border-primary group"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <Scissors size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả file PDF vào đây</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="card-neo">
              <p className="font-semibold text-foreground mb-1">{file.name}</p>
              <p className="text-sm text-muted-foreground">Tổng: {pageCount} trang</p>
            </div>
            <div className="card-neo space-y-4">
              <label className="block text-sm font-semibold text-foreground">
                Nhập khoảng trang (VD: <code className="bg-muted px-1 rounded">1-3, 4, 5-6</code>)
              </label>
              <input
                type="text"
                value={ranges}
                onChange={e => setRanges(e.target.value)}
                className="w-full border border-border rounded-2xl px-4 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="VD: 1-3, 4-6, 7"
              />
              <p className="text-xs text-muted-foreground">Mỗi khoảng sẽ tạo ra 1 file PDF riêng khi tải về.</p>
            </div>
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PdfSplitter;
