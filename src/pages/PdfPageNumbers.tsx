import { useState, useCallback } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Hash, Trash2 } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center";

const PdfPageNumbers = () => {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [prefix, setPrefix] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    setFile(files[0]);
  }, []);

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = `${prefix}${i + startFrom}`;
        const fontSize = 11;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        let x = width / 2 - textWidth / 2;
        let y = 20;
        if (position === "bottom-right") { x = width - textWidth - 20; y = 20; }
        if (position === "bottom-left") { x = 20; y = 20; }
        if (position === "top-center") { x = width / 2 - textWidth / 2; y = height - 30; }
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
      });
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `numbered-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  const positions: { value: Position; label: string }[] = [
    { value: "bottom-center", label: "Dưới giữa" },
    { value: "bottom-right", label: "Dưới phải" },
    { value: "bottom-left", label: "Dưới trái" },
    { value: "top-center", label: "Trên giữa" },
  ];

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang thêm số trang..." />
      <StudioLayout
        title="Số Trang PDF 🔢"
        subtitle="Thêm số trang tự động vào mỗi trang PDF"
        downloadLabel="Thêm số trang"
        downloadDisabled={!file}
        onDownload={handleApply}
        sidebarTools={[
          { icon: <Hash size={18} />, label: "Number", active: true },
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
              ? <p className="font-medium text-foreground">📄 {file.name}</p>
              : <>
                  <Hash size={28} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-muted-foreground">Chọn file PDF</span>
                </>
            }
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>

          <div className="card-neo space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Vị trí số trang</label>
              <div className="grid grid-cols-2 gap-2">
                {positions.map(p => (
                  <button key={p.value} onClick={() => setPosition(p.value)}
                    className={`py-2 rounded-2xl text-sm border transition-all ${position === p.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Bắt đầu từ số</label>
                <input type="number" min={1} value={startFrom}
                  onChange={e => setStartFrom(Number(e.target.value))}
                  className="w-full border border-border rounded-2xl px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Tiền tố (tuỳ chọn)</label>
                <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)}
                  placeholder="VD: Trang "
                  className="w-full border border-border rounded-2xl px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
              </div>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 text-center text-sm text-muted-foreground">
              Xem trước: <span className="font-semibold text-foreground">{prefix || ""}{startFrom}</span>, <span className="font-semibold text-foreground">{prefix || ""}{startFrom + 1}</span>, <span className="font-semibold text-foreground">{prefix || ""}{startFrom + 2}</span>...
            </div>
          </div>
        </div>
      </StudioLayout>
    </>
  );
};

export default PdfPageNumbers;
