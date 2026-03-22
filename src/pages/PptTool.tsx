import { useState, useCallback } from "react";
import PptxGenJS from "pptxgenjs";
import { ImagePlus, X, Layers } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

interface ImageFile {
  file: File;
  preview: string;
  dataUrl: string;
}

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PptTool = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await readAsDataURL(file);
      newImages.push({ file, preview: URL.createObjectURL(file), dataUrl });
    }
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleDownload = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const pptx = new PptxGenJS();
      for (const img of images) {
        const slide = pptx.addSlide();
        slide.addImage({ data: img.dataUrl, x: 0.5, y: 0.5, w: 9, h: 5 });
      }
      await pptx.writeFile({ fileName: "cool-slides.pptx" });
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang tạo slide..." />
      <StudioLayout
        title="Slide Maker 🎨"
        subtitle={`${images.length} ảnh đã chọn`}
        downloadLabel="Tạo .pptx"
        downloadDisabled={images.length === 0}
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <ImagePlus size={18} />, label: "Images", active: true },
          { icon: <Layers size={18} />, label: "Layout" },
        ]}
      >
        <label
          className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px] border-dashed border-2 hover:border-primary group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <ImagePlus size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Kéo thả hoặc bấm để chọn ảnh
          </span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
            {images.map((img, i) => (
              <div key={i} className="relative group rounded-2xl overflow-hidden border border-border aspect-video">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PptTool;
