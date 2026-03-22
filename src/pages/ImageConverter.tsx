import { useState, useCallback } from "react";
import { RefreshCw, Trash2, Download } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

type Format = "image/jpeg" | "image/png" | "image/webp";

const ImageConverter = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
  const [targetFormat, setTargetFormat] = useState<Format>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const imgs = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...imgs]);
    setResults([]);
  }, []);

  const ext = targetFormat === "image/jpeg" ? "jpg" : targetFormat === "image/png" ? "png" : "webp";

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const converted: { name: string; url: string }[] = [];
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const img = new window.Image();
        await new Promise<void>(res => { img.onload = () => res(); img.src = url; });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        if (targetFormat === "image/png") {
          // Transparent background for PNG
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL(targetFormat, quality);
        const baseName = file.name.replace(/\.[^.]+$/, "");
        converted.push({ name: `${baseName}.${ext}`, url: dataUrl });
      }
      setResults(converted);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = () => {
    results.forEach(({ name, url }) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    });
  };

  const formats: { value: Format; label: string }[] = [
    { value: "image/jpeg", label: "JPG" },
    { value: "image/png", label: "PNG" },
    { value: "image/webp", label: "WebP" },
  ];

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang chuyển đổi ảnh..." />
      <StudioLayout
        title="Chuyển Đổi Ảnh 🔁"
        subtitle={results.length > 0 ? `${results.length} ảnh đã chuyển đổi` : `${files.length} ảnh đã chọn`}
        downloadLabel={`Tải ${results.length > 0 ? `${results.length} ảnh .${ext}` : "ảnh"}`}
        downloadDisabled={results.length === 0}
        onDownload={downloadAll}
        sidebarTools={[
          { icon: <RefreshCw size={18} />, label: "Convert", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFiles([]); setResults([]); } },
        ]}
      >
        <div className="space-y-6">
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer border-dashed border-2 hover:border-primary group py-8"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <RefreshCw size={36} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả ảnh (JPG, PNG, WebP)</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </label>

          {files.length > 0 && (
            <div className="card-neo space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Chuyển sang định dạng</label>
                <div className="flex gap-2">
                  {formats.map(f => (
                    <button key={f.value} onClick={() => setTargetFormat(f.value)}
                      className={`flex-1 py-2.5 rounded-2xl font-semibold text-sm border transition-all ${targetFormat === f.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {targetFormat !== "image/png" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Chất lượng: {Math.round(quality * 100)}%</label>
                  <input type="range" min={0.5} max={1} step={0.05} value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    className="w-full accent-primary" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">{files.length} file: {files.map(f => f.name).join(", ")}</p>
              {results.length === 0 && (
                <button onClick={handleConvert}
                  className="w-full btn-bounce bg-primary text-primary-foreground rounded-2xl py-3 font-semibold shadow-md">
                  Chuyển đổi ngay
                </button>
              )}
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {results.map(({ name, url }, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <img src={url} alt={name} className="w-full h-28 object-cover" />
                  <div className="px-3 py-2 flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground truncate">{name}</span>
                    <a href={url} download={name} className="text-primary shrink-0">
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </StudioLayout>
    </>
  );
};

export default ImageConverter;
