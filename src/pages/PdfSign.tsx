import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { PenLine, Trash2, Type, Edit3 } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

type SignMode = "draw" | "type";

const PdfSign = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SignMode>("draw");
  const [typedSig, setTypedSig] = useState("");
  const [processing, setProcessing] = useState(false);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // percent
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.[0]) return;
    if (files[0].type !== "application/pdf") return;
    setFile(files[0]);
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigDataUrl(null);
  };

  const captureSignature = () => {
    if (mode === "draw") {
      setSigDataUrl(canvasRef.current!.toDataURL("image/png"));
    } else {
      // Render typed signature to canvas
      const canvas = document.createElement("canvas");
      canvas.width = 400; canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "transparent";
      ctx.font = "italic 52px 'Georgia', serif";
      ctx.fillStyle = "#1a1a2e";
      ctx.textBaseline = "middle";
      ctx.fillText(typedSig, 10, 52);
      setSigDataUrl(canvas.toDataURL("image/png"));
    }
  };

  const handleApply = async () => {
    if (!file || !sigDataUrl) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Convert data URL to bytes
      const base64 = sigDataUrl.split(",")[1];
      const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const img = await pdf.embedPng(imgBytes);

      const sigW = 150;
      const sigH = (img.height / img.width) * sigW;
      const x = (position.x / 100) * width;
      const y = (position.y / 100) * height;

      firstPage.drawImage(img, { x, y, width: sigW, height: sigH });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang thêm chữ ký..." />
      <StudioLayout
        title="Ký số PDF ✍️"
        subtitle="Vẽ hoặc gõ chữ ký, đặt vào PDF"
        downloadLabel="Áp dụng chữ ký"
        downloadDisabled={!file || !sigDataUrl}
        onDownload={handleApply}
        sidebarTools={[
          { icon: <Edit3 size={18} />, label: "Draw", active: mode === "draw", onClick: () => { setMode("draw"); setSigDataUrl(null); } },
          { icon: <Type size={18} />, label: "Type", active: mode === "type", onClick: () => { setMode("type"); setSigDataUrl(null); } },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setSigDataUrl(null); clearCanvas(); } },
        ]}
      >
        <div className="space-y-6 max-w-xl">
          {/* File upload */}
          <label
            className="card-neo flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed border-2 hover:border-primary group py-6"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            {file
              ? <p className="font-medium text-foreground">📄 {file.name}</p>
              : <>
                  <PenLine size={28} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-muted-foreground">Chọn file PDF cần ký</span>
                </>
            }
            <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>

          {/* Mode toggle */}
          <div className="card-neo flex gap-2">
            <button onClick={() => { setMode("draw"); setSigDataUrl(null); }}
              className={`flex-1 py-2 rounded-2xl font-semibold text-sm transition-all ${mode === "draw" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              ✏️ Vẽ tay
            </button>
            <button onClick={() => { setMode("type"); setSigDataUrl(null); }}
              className={`flex-1 py-2 rounded-2xl font-semibold text-sm transition-all ${mode === "type" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              ⌨️ Gõ chữ
            </button>
          </div>

          {/* Signature input */}
          <div className="card-neo space-y-4">
            {mode === "draw" ? (
              <>
                <p className="text-sm font-semibold text-foreground">Vẽ chữ ký của bạn:</p>
                <canvas
                  ref={canvasRef}
                  width={480} height={140}
                  onMouseDown={startDraw} onMouseMove={draw}
                  onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  className="w-full border-2 border-dashed border-border rounded-2xl cursor-crosshair bg-white"
                  style={{ touchAction: "none" }}
                />
                <div className="flex gap-2">
                  <button onClick={clearCanvas}
                    className="px-4 py-2 rounded-2xl border border-border text-sm text-muted-foreground hover:bg-muted transition-all">
                    Xóa
                  </button>
                  <button onClick={captureSignature}
                    className="btn-bounce flex-1 bg-primary text-primary-foreground rounded-2xl py-2 text-sm font-semibold shadow-md">
                    Xác nhận chữ ký
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">Gõ tên của bạn:</p>
                <input type="text" value={typedSig} onChange={e => setTypedSig(e.target.value)}
                  placeholder="Nguyễn Văn A..."
                  className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "22px" }}
                />
                <button onClick={captureSignature} disabled={!typedSig.trim()}
                  className="w-full btn-bounce bg-primary text-primary-foreground rounded-2xl py-2 text-sm font-semibold shadow-md disabled:opacity-40">
                  Xác nhận chữ ký
                </button>
              </>
            )}
          </div>

          {/* Preview */}
          {sigDataUrl && (
            <div className="card-neo space-y-3">
              <p className="text-sm font-semibold text-foreground">✅ Chữ ký đã xác nhận:</p>
              <img src={sigDataUrl} alt="Chữ ký" className="max-h-16 border border-border rounded-xl bg-white p-2" />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Vị trí X (trái → phải): {position.x}%</p>
                <input type="range" min={0} max={80} value={position.x}
                  onChange={e => setPosition(p => ({ ...p, x: Number(e.target.value) }))}
                  className="w-full accent-primary" />
                <p className="text-xs text-muted-foreground">Vị trí Y (dưới → trên): {position.y}%</p>
                <input type="range" min={0} max={80} value={position.y}
                  onChange={e => setPosition(p => ({ ...p, y: Number(e.target.value) }))}
                  className="w-full accent-primary" />
              </div>
            </div>
          )}
        </div>
      </StudioLayout>
    </>
  );
};

export default PdfSign;
