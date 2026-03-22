import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { ImageDown, Settings, Download } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const ImageCompressor = () => {
  const [original, setOriginal] = useState<File | null>(null);
  const [compressed, setCompressed] = useState<Blob | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [compressedUrl, setCompressedUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [quality, setQuality] = useState(0.7);

  const handleFile = useCallback(async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    setOriginal(file);
    setOriginalUrl(URL.createObjectURL(file));
    setCompressed(null);
    setCompressedUrl("");
  }, []);

  const handleCompress = async () => {
    if (!original) return;
    setProcessing(true);
    try {
      const result = await imageCompression(original, {
        maxSizeMB: quality * 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      setCompressed(result);
      setCompressedUrl(URL.createObjectURL(result));
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressed) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `compressed-${original?.name || "image.jpg"}`;
    a.click();
  };

  const reduction = original && compressed
    ? Math.round((1 - compressed.size / original.size) * 100)
    : 0;

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang nén ảnh..." />
      <StudioLayout
        title="Smart Compressor 🖼️"
        subtitle={compressed ? `Giảm ${reduction}% dung lượng` : "Chọn ảnh để nén"}
        downloadLabel="Tải ảnh nén"
        downloadDisabled={!compressed}
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <ImageDown size={18} />, label: "Compress", active: true },
          { icon: <Settings size={18} />, label: "Settings" },
        ]}
      >
        {!original ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[300px] border-dashed border-2 hover:border-primary group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <ImageDown size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả hoặc bấm để chọn ảnh</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-foreground">Chất lượng:</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm text-muted-foreground font-medium w-12">{Math.round(quality * 100)}%</span>
              <button
                onClick={handleCompress}
                className="btn-bounce bg-primary text-primary-foreground rounded-3xl px-5 py-2 font-semibold text-sm shadow-md"
              >
                Nén
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
                  Gốc — {(original.size / 1024).toFixed(0)} KB
                </div>
                <img src={originalUrl} alt="Original" className="w-full object-contain max-h-80" />
              </div>
              {compressedUrl && (
                <div className="rounded-3xl border border-border overflow-hidden">
                  <div className="bg-mint/10 px-4 py-2 text-sm font-medium text-mint">
                    Đã nén — {((compressed?.size || 0) / 1024).toFixed(0)} KB ({reduction}% giảm)
                  </div>
                  <img src={compressedUrl} alt="Compressed" className="w-full object-contain max-h-80" />
                </div>
              )}
            </div>
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default ImageCompressor;
