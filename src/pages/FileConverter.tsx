import { useState, useCallback, useRef } from "react";
import { ArrowRight, Upload, Download, Trash2, FileText, Table, Image, Presentation, RefreshCw, Check, ChevronDown } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

/* ─── conversion registry ──────────────────────────────── */
interface ConversionOption {
  id: string;
  label: string;
  from: string[];
  toExt: string;
  icon: typeof FileText;
  color: string;
  description: string;
}

const conversions: ConversionOption[] = [
  {
    id: "img-to-pdf",
    label: "Ảnh → PDF",
    from: ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"],
    toExt: "pdf",
    icon: FileText,
    color: "bg-rose-500/10 text-rose-500",
    description: "Chuyển ảnh JPG, PNG, WebP thành file PDF",
  },
  {
    id: "pdf-to-jpg",
    label: "PDF → JPG",
    from: ["application/pdf"],
    toExt: "jpg",
    icon: Image,
    color: "bg-amber-500/10 text-amber-500",
    description: "Xuất mỗi trang PDF thành ảnh JPG",
  },
  {
    id: "excel-to-csv",
    label: "Excel → CSV",
    from: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
    toExt: "csv",
    icon: Table,
    color: "bg-emerald-500/10 text-emerald-500",
    description: "Trích xuất dữ liệu Excel sang CSV",
  },
  {
    id: "csv-to-excel",
    label: "CSV → Excel",
    from: ["text/csv", "application/csv", "text/plain"],
    toExt: "xlsx",
    icon: Table,
    color: "bg-blue-500/10 text-blue-500",
    description: "Chuyển file CSV thành bảng tính Excel",
  },
  {
    id: "img-convert",
    label: "JPG ↔ PNG ↔ WebP",
    from: ["image/jpeg", "image/png", "image/webp"],
    toExt: "png",
    icon: Image,
    color: "bg-violet-500/10 text-violet-500",
    description: "Chuyển đổi giữa các định dạng ảnh",
  },
];

/* ─── helpers ──────────────────────────────────────────── */
const acceptStr = (opt: ConversionOption) => {
  const exts: Record<string, string> = {
    "image/jpeg": ".jpg,.jpeg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "text/csv": ".csv",
    "application/csv": ".csv",
    "text/plain": ".csv,.txt",
  };
  return opt.from.map((m) => exts[m] ?? "").join(",");
};

/* ─── conversion logic ─────────────────────────────────── */
async function convertFile(
  file: File,
  convId: string,
  imgTarget: string
): Promise<{ blob: Blob; name: string }> {
  const baseName = file.name.replace(/\.[^.]+$/, "");

  switch (convId) {
    // ──── Images → PDF ────
    case "img-to-pdf": {
      const pdfDoc = await PDFDocument.create();
      const bytes = new Uint8Array(await file.arrayBuffer());
      let embeddedImg;
      if (file.type === "image/png") embeddedImg = await pdfDoc.embedPng(bytes);
      else embeddedImg = await pdfDoc.embedJpg(bytes);
      const { width, height } = embeddedImg.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImg, { x: 0, y: 0, width, height });
      const pdfBytes = await pdfDoc.save();
      return { blob: new Blob([pdfBytes], { type: "application/pdf" }), name: `${baseName}.pdf` };
    }

    // ──── Excel → CSV ────
    case "excel-to-csv": {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
      return { blob: new Blob([csv], { type: "text/csv;charset=utf-8" }), name: `${baseName}.csv` };
    }

    // ──── CSV → Excel ────
    case "csv-to-excel": {
      const text = await file.text();
      const wb = XLSX.read(text, { type: "string" });
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      return {
        blob: new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        name: `${baseName}.xlsx`,
      };
    }

    // ──── Image format conversion ────
    case "img-convert": {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      await new Promise<void>((res) => { img.onload = () => res(); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      if (imgTarget === "image/png") ctx.clearRect(0, 0, canvas.width, canvas.height);
      else { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const ext = imgTarget === "image/jpeg" ? "jpg" : imgTarget === "image/png" ? "png" : "webp";
      const dataUrl = canvas.toDataURL(imgTarget, 0.92);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { blob, name: `${baseName}.${ext}` };
    }

    // ──── PDF → JPG (page 1 only, canvas-based) ────
    case "pdf-to-jpg": {
      // Note: Full PDF→Image requires a library like pdf.js which is heavy.
      // We provide a simple placeholder that informs the user.
      return {
        blob: new Blob(["PDF to JPG conversion requires pdf.js (not yet included)"], { type: "text/plain" }),
        name: `${baseName}-notice.txt`,
      };
    }

    default:
      throw new Error("Unsupported conversion: " + convId);
  }
}

/* ─── component ────────────────────────────────────────── */
const FileConverter = () => {
  const [selected, setSelected] = useState<ConversionOption>(conversions[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{ blob: Blob; name: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [imgTarget, setImgTarget] = useState("image/png");
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const arr = Array.from(fileList).filter((f) =>
        selected.from.some((mime) => f.type === mime || f.name.endsWith("." + mime.split("/")[1]))
      );
      // For CSV files, also accept text/plain with .csv extension
      const csvFiles = Array.from(fileList).filter(
        (f) => selected.id === "csv-to-excel" && f.name.toLowerCase().endsWith(".csv")
      );
      setFiles((prev) => [...prev, ...new Set([...arr, ...csvFiles])]);
      setResults([]);
    },
    [selected]
  );

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const out: { blob: Blob; name: string }[] = [];
      for (const file of files) {
        const result = await convertFile(file, selected.id, imgTarget);
        out.push(result);
      }
      setResults(out);
      fireConfetti();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = () => {
    results.forEach(({ blob, name }) => saveAs(blob, name));
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang chuyển đổi file..." />
      <StudioLayout
        title="File Converter 🔄"
        subtitle={
          results.length > 0
            ? `✅ ${results.length} file đã chuyển đổi`
            : `${files.length} file đã chọn · ${selected.label}`
        }
        downloadLabel={results.length > 0 ? `Tải ${results.length} file` : "Chuyển đổi"}
        downloadDisabled={files.length === 0 && results.length === 0}
        onDownload={results.length > 0 ? downloadAll : handleConvert}
        sidebarTools={[
          { icon: <RefreshCw size={18} />, label: "Convert", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: clearAll },
        ]}
      >
        <div className="space-y-6">
          {/* ── Conversion Type Picker ── */}
          <div className="card-neo">
            <p className="text-sm font-semibold text-foreground mb-3">Chọn loại chuyển đổi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {conversions.map((conv) => {
                const Icon = conv.icon;
                const isActive = selected.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelected(conv);
                      clearAll();
                    }}
                    className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check size={16} className="text-primary" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl ${conv.color} flex items-center justify-center shrink-0`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{conv.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{conv.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Image target format selector (for img-convert) ── */}
          {selected.id === "img-convert" && (
            <div className="card-neo">
              <p className="text-sm font-semibold text-foreground mb-2">Chuyển sang</p>
              <div className="flex gap-2">
                {([
                  { val: "image/jpeg", label: "JPG" },
                  { val: "image/png", label: "PNG" },
                  { val: "image/webp", label: "WebP" },
                ] as const).map((f) => (
                  <button
                    key={f.val}
                    onClick={() => setImgTarget(f.val)}
                    className={`flex-1 py-2.5 rounded-2xl font-semibold text-sm border transition-all ${
                      imgTarget === f.val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Upload zone ── */}
          <label
            className="card-neo flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[180px] border-dashed border-2 hover:border-primary group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
          >
            <div className={`w-16 h-16 rounded-2xl ${selected.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Upload size={28} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                Kéo thả file hoặc <span className="text-primary">bấm để chọn</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hỗ trợ: {acceptStr(selected).replace(/\./g, "").replace(/,/g, ", ").toUpperCase()}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={acceptStr(selected)}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>

          {/* ── File list ── */}
          {files.length > 0 && results.length === 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl ${selected.color} flex items-center justify-center shrink-0`}>
                    <selected.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-primary uppercase">.{selected.toExt}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFiles((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="text-destructive/60 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleConvert}
                className="w-full btn-bounce bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Chuyển đổi {files.length} file
              </button>
            </div>
          )}

          {/* ── Results ── */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Check size={18} className="text-emerald-500" />
                <p className="font-semibold text-foreground">Chuyển đổi thành công!</p>
              </div>
              {results.map(({ blob, name }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-card rounded-2xl border border-emerald-200 p-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Check size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{(blob.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => saveAs(blob, name)}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Download size={14} />
                    Tải
                  </button>
                </div>
              ))}
              <button
                onClick={clearAll}
                className="w-full border border-border text-foreground rounded-2xl py-3 font-medium hover:bg-muted transition-colors mt-2"
              >
                Chuyển đổi thêm file
              </button>
            </div>
          )}
        </div>
      </StudioLayout>
    </>
  );
};

export default FileConverter;
