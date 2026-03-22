import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Image, Trash2, Download } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfToImage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [scale, setScale] = useState(2);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    setFile(files[0]);
    setImages([]);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      // Use PDF.js via CDN to render pages
      const url = URL.createObjectURL(file);
      // @ts-ignore
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) {
        // Dynamically load PDF.js
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      // @ts-ignore
      const pdfDoc = await window.pdfjsLib.getDocument(url).promise;
      const imgs: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        imgs.push(canvas.toDataURL("image/jpeg", 0.92));
      }
      setImages(imgs);
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = () => {
    images.forEach((img, i) => {
      const a = document.createElement("a");
      a.href = img;
      a.download = `page-${i + 1}.jpg`;
      a.click();
    });
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang chuyển đổi sang ảnh..." />
      <StudioLayout
        title="PDF → Ảnh 🖼️"
        subtitle={images.length > 0 ? `${images.length} ảnh sẵn sàng tải` : "Chọn PDF để chuyển thành ảnh"}
        downloadLabel={`Tải ${images.length > 0 ? `${images.length} ảnh` : "ảnh"}`}
        downloadDisabled={images.length === 0}
        onDownload={downloadAll}
        sidebarTools={[
          { icon: <Image size={18} />, label: "Convert", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setImages([]); } },
        ]}
      >
        {!file ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px] border-dashed border-2 hover:border-primary group"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <Image size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả file PDF vào đây</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="card-neo space-y-4">
              <p className="font-semibold text-foreground">{file.name}</p>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Chất lượng:</label>
                <input type="range" min={1} max={3} step={0.5} value={scale}
                  onChange={e => setScale(Number(e.target.value))}
                  className="flex-1 accent-primary" />
                <span className="text-sm text-muted-foreground w-20">
                  {scale === 1 ? "Thấp" : scale === 2 ? "Trung bình" : "Cao"}
                </span>
              </div>
              {images.length === 0 && (
                <button onClick={handleConvert}
                  className="btn-bounce bg-primary text-primary-foreground rounded-3xl px-8 py-3 font-semibold shadow-md">
                  Chuyển đổi
                </button>
              )}
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="rounded-2xl border border-border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Trang {i + 1}</span>
                      <a href={img} download={`page-${i + 1}.jpg`}
                        className="text-primary hover:text-primary/80">
                        <Download size={14} />
                      </a>
                    </div>
                    <img src={img} alt={`Trang ${i + 1}`} className="w-full object-contain max-h-48" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PdfToImage;
