import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, Download, Palette } from "lucide-react";
import StudioLayout from "@/components/StudioLayout";
import { fireConfetti } from "@/lib/confetti";

const QrGenerator = () => {
  const [value, setValue] = useState("https://neotoolbox.app");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#2563EB");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.png";
    a.click();
    fireConfetti();
  };

  return (
    <StudioLayout
      title="QR Code Generator 📱"
      subtitle="Tạo mã QR từ link hoặc văn bản"
      downloadLabel="Tải QR"
      downloadDisabled={!value.trim()}
      onDownload={handleDownload}
      sidebarTools={[
        { icon: <QrCode size={18} />, label: "QR", active: true },
        { icon: <Palette size={18} />, label: "Style" },
      ]}
    >
      <div className="max-w-lg mx-auto space-y-6">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập URL hoặc văn bản..."
          className="w-full h-12 rounded-3xl border border-border bg-card px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Kích thước:</label>
          <input
            type="range"
            min={128}
            max={512}
            step={32}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm text-muted-foreground w-12">{size}px</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Màu sắc:</label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            className="w-10 h-10 rounded-2xl cursor-pointer border-0"
          />
        </div>

        <div ref={canvasRef} className="flex justify-center p-8 bg-card rounded-3xl border border-border">
          {value.trim() ? (
            <QRCodeCanvas value={value} size={size} fgColor={fgColor} bgColor="#FFFFFF" level="H" />
          ) : (
            <p className="text-muted-foreground">Nhập nội dung để tạo QR</p>
          )}
        </div>
      </div>
    </StudioLayout>
  );
};

export default QrGenerator;
