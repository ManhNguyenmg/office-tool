import { useState } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Type, AlignLeft, FileText } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import ProcessingModal from "@/components/ProcessingModal";
import { fireConfetti } from "@/lib/confetti";

const WordTool = () => {
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleDownload = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    try {
      const doc = new Document({
        sections: [{
          children: text.split("\n").map(
            (line) => new Paragraph({ children: [new TextRun({ text: line, size: 24, font: "Arial" })] })
          ),
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "magic-document.docx");
      fireConfetti();
    } finally {
      setProcessing(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <>
      <ProcessingModal isOpen={processing} message="Đang tạo file Word..." />
      <StudioLayout
        title="Word Magic ✍️"
        subtitle={`${wordCount} từ · ${text.length} ký tự`}
        downloadLabel="Tải .docx"
        downloadDisabled={!text.trim()}
        onDownload={handleDownload}
        sidebarTools={[
          { icon: <Type size={18} />, label: "Text", active: true },
          { icon: <AlignLeft size={18} />, label: "Format" },
          { icon: <FileText size={18} />, label: "Template" },
        ]}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bắt đầu viết gì đó..."
          className="w-full h-[calc(100vh-200px)] bg-card rounded-3xl border border-border p-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-base leading-relaxed"
        />
      </StudioLayout>
    </>
  );
};

export default WordTool;
