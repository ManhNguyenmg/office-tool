import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { PackageOpen, Trash2 } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    setFile(files[0]);
    setResult(null);
  }, []);

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      // Re-save with compression (pdf-lib removes unused objects)
      const compressed = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([compressed], { type: "application/pdf" });
      setResult({ blob, size: blob.size });
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed-${file?.name || "file.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reduction = file && result
    ? Math.round((1 - result.size / file.size) * 100)
    : 0;

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang nén PDF..." />
      <StudioLayout
        title="PDF Compressor 📦"
        subtitle={result ? `Giảm ${reduction}% kích thước` : "Chọn file PDF để nén"}
        downloadLabel="Tải PDF đã nén"
        downloadDisabled={!result}
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <PackageOpen size={18} />, label: "Compress", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setResult(null); } },
        ]}
      >
        {!file ? (
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px] border-dashed border-2 hover:border-primary group"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            <PackageOpen size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-medium text-muted-foreground">Kéo thả file PDF vào đây</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="card-neo space-y-3">
              <p className="font-semibold text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">Kích thước gốc: {(file.size / 1024).toFixed(1)} KB</p>
              {result && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    ✅ Sau nén: {(result.size / 1024).toFixed(1)} KB — giảm {reduction}%
                  </p>
                </div>
              )}
            </div>
            {!result && (
              <button
                onClick={handleCompress}
                className="btn-bounce bg-primary text-primary-foreground rounded-3xl px-8 py-3 font-semibold shadow-md"
              >
                Bắt đầu nén
              </button>
            )}
          </div>
        )}
      </StudioLayout>
    </>
  );
};

export default PdfCompressor;
