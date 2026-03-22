import { useState, useCallback } from "react";
import { ScanText, Trash2, Copy, Download } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const PdfOcr = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState("vie+eng");

  const handleFile = useCallback((files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") return;
    setFile(f);
    setText("");
  }, []);

  const loadTesseract = (): Promise<any> =>
    new Promise((resolve, reject) => {
      if ((window as any).Tesseract) return resolve((window as any).Tesseract);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js";
      script.onload = () => resolve((window as any).Tesseract);
      script.onerror = reject;
      document.head.appendChild(script);
    });

  const handleOcr = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setText("");
    try {
      const Tesseract = await loadTesseract();
      const worker = await Tesseract.createWorker(lang, 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const imageUrl = URL.createObjectURL(file);
      const { data: { text: result } } = await worker.recognize(imageUrl);
      URL.revokeObjectURL(imageUrl);
      await worker.terminate();
      setText(result.trim());
      fireConfetti();
    } catch (err) {
      setText("❌ Không thể nhận dạng văn bản. Hãy thử với ảnh rõ hơn.");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const copyText = () => { navigator.clipboard.writeText(text); };

  const downloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocr-result-${file?.name || "text"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const languages = [
    { value: "vie+eng", label: "Việt + Anh" },
    { value: "vie", label: "Tiếng Việt" },
    { value: "eng", label: "English" },
    { value: "chi_sim", label: "Tiếng Trung" },
  ];

  return (
    <>
      <ProcessingModal isOpen={processing} message={`Đang nhận dạng văn bản... ${progress}%`} />
      <StudioLayout
        title="OCR — Nhận Dạng Chữ 🔍"
        subtitle="Trích xuất văn bản từ ảnh hoặc PDF scan"
        downloadLabel="Tải .txt"
        downloadDisabled={!text}
        onDownload={downloadTxt}
        sidebarTools={[
          { icon: <ScanText size={18} />, label: "OCR", active: true },
          { icon: <Copy size={18} />, label: "Copy", onClick: copyText },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: () => { setFile(null); setText(""); } },
        ]}
      >
        <div className="space-y-6 max-w-2xl">
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer border-dashed border-2 hover:border-primary group py-8"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
          >
            {file
              ? <p className="font-medium text-foreground">📄 {file.name}</p>
              : <>
                  <ScanText size={36} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-muted-foreground">Kéo thả ảnh (JPG, PNG) hoặc PDF</span>
                  <span className="text-xs text-muted-foreground">Hỗ trợ tài liệu scan, chụp màn hình</span>
                </>
            }
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFile(e.target.files)} />
          </label>

          {file && (
            <div className="card-neo space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Ngôn ngữ nhận dạng</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map(l => (
                    <button key={l.value} onClick={() => setLang(l.value)}
                      className={`px-4 py-2 rounded-2xl text-sm border transition-all ${lang === l.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              {!text && (
                <button onClick={handleOcr}
                  className="w-full btn-bounce bg-primary text-primary-foreground rounded-2xl py-3 font-semibold shadow-md">
                  🔍 Bắt đầu nhận dạng
                </button>
              )}
            </div>
          )}

          {text && (
            <div className="card-neo space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Kết quả ({text.split(/\s+/).filter(Boolean).length} từ)</p>
                <button onClick={copyText}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-primary/30 rounded-xl px-3 py-1.5 transition-all hover:bg-primary/5">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full h-64 bg-muted/30 rounded-2xl border border-border p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">✏️ Bạn có thể chỉnh sửa kết quả trước khi tải</p>
            </div>
          )}
        </div>
      </StudioLayout>
    </>
  );
};

export default PdfOcr;
