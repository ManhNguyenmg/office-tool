import { useState, useCallback } from "react";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

// Configure pdf.js worker
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
/* ── Extract text from PDF ── */
async function extractTextFromPdf(file: File): Promise<{ pages: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(pageText);
  }

  return { pages };
}

/* ── Build DOCX from extracted text ── */
async function buildDocx(pages: string[], fileName: string): Promise<Blob> {
  const children: Paragraph[] = [];

  pages.forEach((pageText, idx) => {
    // Add page header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `— Trang ${idx + 1} —`,
            bold: true,
            size: 20,
            font: "Arial",
            color: "888888",
          }),
        ],
        spacing: { before: idx > 0 ? 400 : 0, after: 200 },
      })
    );

    // Split text into paragraphs by sentence boundaries
    const sentences = pageText.split(/(?<=[.!?])\s+/);
    let currentParagraph = "";

    for (const sentence of sentences) {
      currentParagraph += (currentParagraph ? " " : "") + sentence;
      // Create a new paragraph every ~3 sentences or at the end
      if (currentParagraph.split(/[.!?]/).length > 3 || sentence === sentences[sentences.length - 1]) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: currentParagraph,
                size: 24,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          })
        );
        currentParagraph = "";
      }
    }

    // If page was empty
    if (pageText.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "(Trang này không có văn bản — có thể là ảnh hoặc scan)",
              italics: true,
              size: 22,
              font: "Arial",
              color: "AAAAAA",
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/* ── Component ── */
const PdfToDocx = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [progress, setProgress] = useState("");

  const handleFile = useCallback((files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    if (f.type !== "application/pdf") return;
    setFile(f);
    setResult(null);
    setPreview([]);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress("Đang đọc file PDF...");
    try {
      // Step 1: Extract text
      setProgress("Đang trích xuất văn bản từ PDF...");
      const { pages } = await extractTextFromPdf(file);
      setPreview(pages.slice(0, 3)); // Preview first 3 pages

      // Step 2: Build DOCX
      setProgress("Đang tạo file Word (.docx)...");
      const baseName = file.name.replace(/\.pdf$/i, "");
      const blob = await buildDocx(pages, baseName);

      setResult({ blob, name: `${baseName}.docx` });
      fireConfetti();
    } catch (err) {
      console.error("PDF to DOCX error:", err);
      setProgress("Lỗi: Không thể xử lý file PDF này");
    } finally {
      setProcessing(false);
      setProgress("");
    }
  };

  const handleDownload = () => {
    if (result) {
      saveAs(result.blob, result.name);
    } else {
      handleConvert();
    }
  };

  const clearAll = () => {
    setFile(null);
    setResult(null);
    setPreview([]);
  };

  return (
    <>
      <ProcessingModal isOpen={processing} message={progress || "Đang chuyển đổi..."} />
      <StudioLayout
        title="PDF → Word 📝"
        subtitle={
          result
            ? `✅ Đã chuyển đổi: ${result.name}`
            : file
            ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
            : "Chuyển file PDF sang Word (.docx)"
        }
        downloadLabel={result ? "Tải .docx" : "Chuyển đổi"}
        downloadDisabled={!file}
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <FileText size={18} />, label: "Convert", active: true },
          { icon: <Trash2 size={18} />, label: "Clear", onClick: clearAll },
        ]}
      >
        <div className="space-y-6">
          {/* Upload zone */}
          {!file ? (
            <label
              className="card-neo flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[280px] border-dashed border-2 hover:border-primary group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files);
              }}
            >
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={36} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">
                  Kéo thả file PDF hoặc <span className="text-primary">bấm để chọn</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hỗ trợ mọi file PDF — trích xuất văn bản sang Word
                </p>
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files)}
              />
            </label>
          ) : !result ? (
            /* File selected - ready to convert */
            <div className="space-y-4">
              <div className="card-neo flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <FileText size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-rose-500">PDF</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-primary">DOCX</span>
                </div>
                <button onClick={clearAll} className="text-destructive/60 hover:text-destructive">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="card-neo bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Cách hoạt động</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                      <li>Trích xuất văn bản từ mỗi trang PDF</li>
                      <li>Tạo file Word (.docx) với nội dung đã trích xuất</li>
                      <li>Toàn bộ xử lý trên trình duyệt — không upload server</li>
                      <li>Lưu ý: Ảnh và format phức tạp có thể không được giữ nguyên</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConvert}
                className="w-full btn-bounce bg-primary text-primary-foreground rounded-2xl py-4 font-semibold shadow-md flex items-center justify-center gap-2 text-lg"
              >
                <FileText size={20} />
                Chuyển đổi sang Word
              </button>
            </div>
          ) : (
            /* Result */
            <div className="space-y-4">
              <div className="card-neo border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Download size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{result.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(result.blob.size / 1024).toFixed(1)} KB · Sẵn sàng tải xuống
                    </p>
                  </div>
                  <button
                    onClick={() => saveAs(result.blob, result.name)}
                    className="btn-bounce bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold shadow-md flex items-center gap-2"
                  >
                    <Download size={18} />
                    Tải .docx
                  </button>
                </div>
              </div>

              {/* Text preview */}
              {preview.length > 0 && (
                <div className="card-neo">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Xem trước nội dung ({preview.length} trang đầu)
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {preview.map((text, i) => (
                      <div key={i} className="rounded-2xl bg-muted/50 p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Trang {i + 1}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {text.length > 500 ? text.slice(0, 500) + "..." : text || "(Không có văn bản)"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={clearAll}
                className="w-full border border-border text-foreground rounded-2xl py-3 font-medium hover:bg-muted transition-colors"
              >
                Chuyển đổi file khác
              </button>
            </div>
          )}
        </div>
      </StudioLayout>
    </>
  );
};

export default PdfToDocx;
