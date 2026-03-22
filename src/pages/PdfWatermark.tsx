import { useState, useCallback } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { Droplets, Trash2 } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfWatermark = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.2);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    setFile(files[0]);
  }, []);

  const handleApply = async () => {
    if (!file || !text.trim()) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) * 0.1;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.6, 0.6, 0.6),
          opacity,
          rotate: degrees(45),
        });
      }
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang thêm watermark..." />
      <StudioLayout
        title="Watermark PDF 💧"
        subtitle="Thêm chữ watermark lên tất cả trang PDF"
        downloadLabel="Thêm & Tải"
        downloadDisabled={!file || !text.trim()}
        onDownload={handleApply}
        sidebarTools={[
          { icon: <Droplets size={18} />, label: "Watermark", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => setFile(null) },
        ]}
      >
        <div className="space-y-6 max-w-md">
          <label
            className="card-neo flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed border-2 hover:border-primary group py-8"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            {file
              ? <p className="font-medium text-foreground">{file.name}</p>
              : <>
                  <Droplets size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-muted-foreground">Chọn file PDF</span>
                </>
            }
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>

          <div className="card-neo space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nội dung watermark</label>
              <input type="text" value={text} onChange={e => setText(e.target.value)}
                placeholder="VD: CONFIDENTIAL, BẢO MẬT..."
                className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Độ trong suốt: {Math.round(opacity * 100)}%</label>
              <input type="range" min={0.05} max={0.5} step={0.05} value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="w-full accent-primary" />
            </div>
          </div>

          {/* Preview */}
          <div className="card-neo flex items-center justify-center h-40 border-dashed border-2 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity }}>
              <span className="text-gray-500 font-bold text-3xl rotate-45 whitespace-nowrap select-none">{text || "WATERMARK"}</span>
            </div>
            <span className="text-xs text-muted-foreground z-10">Xem trước</span>
          </div>
        </div>
      </StudioLayout>
    </>
  );
};

export default PdfWatermark;
