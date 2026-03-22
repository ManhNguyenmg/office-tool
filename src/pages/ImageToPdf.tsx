import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Trash2, GripVertical } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const ImageToPdf = () => {
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    const newEntries = imgs.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...newEntries]);
  }, []);

  const removeImage = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.create();
      for (const { file } of images) {
        const bytes = await file.arrayBuffer();
        let img;
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          img = await pdf.embedJpg(bytes);
        } else {
          img = await pdf.embedPng(bytes);
        }
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images-to-pdf.pdf";
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang tạo PDF từ ảnh..." />
      <StudioLayout
        title="Ảnh → PDF 📄"
        subtitle={`${images.length} ảnh đã chọn`}
        downloadLabel="Tạo PDF"
        downloadDisabled={images.length === 0}
        onDownload={handleConvert}
        sidebarTools={[
          { icon: <FileText size={18} />, label: "Convert", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => setImages([]) },
        ]}
      >
        <label
          className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[160px] border-dashed border-2 hover:border-primary group mb-6"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <FileText size={36} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-medium text-muted-foreground">Kéo thả ảnh vào đây (JPG, PNG)</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => handleFiles(e.target.files)} />
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map(({ url, file }, i) => (
              <div key={i} className="relative group rounded-2xl overflow-hidden border border-border">
                <img src={url} alt={file.name} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => removeImage(i)} className="text-white">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default ImageToPdf;
