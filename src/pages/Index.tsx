import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Image, Table, Presentation, Upload, Shield, Clock, Lock,
  QrCode, Combine, FileSpreadsheet, ImageDown, Scissors, PackageOpen,
  PenLine, Droplets, RotateCw, Hash, Trash2, Layers, ScanText,
  RefreshCw, FileImage, KeyRound, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AdSlot from "@/components/AdSlot";
import { useCallback, useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" as const },
  }),
};

const zones = [
  {
    label: "🔄 Chuyển Đổi Định Dạng",
    color: "bg-primary",
    tools: [
      { to: "/file-converter",  title: "File Converter",   desc: "Chuyển đổi giữa các định dạng file",  icon: RefreshCw,      iconBg: "bg-primary/10 text-primary" },
      { to: "/pdf-to-word",     title: "PDF → Word",        desc: "Trích xuất văn bản từ PDF sang DOCX",  icon: FileText,        iconBg: "bg-rose/10 text-rose" },
      { to: "/image-convert",   title: "Chuyển đổi ảnh",   desc: "JPG ↔ PNG ↔ WebP",                    icon: RefreshCw,      iconBg: "bg-violet/10 text-violet" },
      { to: "/csv-to-excel",    title: "CSV → Excel",       desc: "Chuyển đổi CSV sang Excel",            icon: FileSpreadsheet, iconBg: "bg-mint/10 text-mint" },
      { to: "/image-to-pdf",    title: "Ảnh → PDF",         desc: "Ghép nhiều ảnh thành PDF",             icon: FileText,        iconBg: "bg-amber/10 text-amber" },
      { to: "/pdf-to-image",    title: "PDF → Ảnh",         desc: "Xuất từng trang PDF thành JPG",        icon: FileImage,       iconBg: "bg-rose/10 text-rose" },
    ],
  },
  {
    label: "📄 PDF Powerhouse",
    color: "bg-rose",
    tools: [
      { to: "/pdf-merge",        title: "Ghép PDF",          desc: "Hợp nhất nhiều file PDF",             icon: Combine,      iconBg: "bg-rose/10 text-rose" },
      { to: "/pdf-split",        title: "Tách PDF",          desc: "Chia PDF thành nhiều file",           icon: Scissors,     iconBg: "bg-orange-400/10 text-orange-400" },
      { to: "/pdf-compress",     title: "Nén PDF",           desc: "Giảm kích thước file PDF",            icon: PackageOpen,  iconBg: "bg-amber/10 text-amber" },
      { to: "/pdf-sign",         title: "Ký số PDF",         desc: "Vẽ hoặc gõ chữ ký vào PDF",          icon: PenLine,      iconBg: "bg-violet/10 text-violet" },
      { to: "/pdf-watermark",    title: "Watermark PDF",     desc: "Thêm chữ watermark bảo mật",          icon: Droplets,     iconBg: "bg-mint/10 text-mint" },
      { to: "/pdf-password",     title: "Mật khẩu PDF",      desc: "Thêm hoặc gỡ mật khẩu",              icon: KeyRound,     iconBg: "bg-primary/10 text-primary" },
      { to: "/pdf-rotate",       title: "Xoay trang PDF",    desc: "Xoay 90°/180°/270°",                  icon: RotateCw,     iconBg: "bg-rose/10 text-rose" },
      { to: "/pdf-delete-pages", title: "Xóa trang PDF",     desc: "Chọn và xóa trang khỏi PDF",          icon: Trash2,       iconBg: "bg-destructive/10 text-destructive" },
      { to: "/pdf-reorder",      title: "Sắp xếp trang",     desc: "Kéo thả đổi thứ tự trang",           icon: Layers,       iconBg: "bg-violet/10 text-violet" },
      { to: "/pdf-page-numbers", title: "Số trang PDF",      desc: "Thêm số trang tự động",               icon: Hash,         iconBg: "bg-mint/10 text-mint" },
      { to: "/pdf-ocr",          title: "OCR — Nhận dạng",   desc: "Trích xuất chữ từ ảnh/PDF scan",      icon: ScanText,     iconBg: "bg-primary/10 text-primary" },
    ],
  },
  {
    label: "💼 Office Suite",
    color: "bg-primary",
    tools: [
      { to: "/word",         title: "Word Magic",    desc: "Soạn văn bản & tải .docx",      icon: FileText,        iconBg: "bg-primary/10 text-primary" },
      { to: "/excel",        title: "Excel Express", desc: "Nhập bảng tính & xuất .xlsx",   icon: Table,           iconBg: "bg-mint/10 text-mint" },
      { to: "/ppt",          title: "Slide Maker",   desc: "Ảnh thành PowerPoint .pptx",    icon: Presentation,    iconBg: "bg-amber/10 text-amber" },
    ],
  },
  {
    label: "🖼 Image Studio",
    color: "bg-mint",
    tools: [
      { to: "/image-compress", title: "Nén ảnh",         desc: "Giảm dung lượng giữ chất lượng",   icon: ImageDown, iconBg: "bg-mint/10 text-mint" },
    ],
  },
  {
    label: "⚡ Generators",
    color: "bg-violet",
    tools: [
      { to: "/qr-generator", title: "QR Code", desc: "Tạo mã QR từ link hoặc văn bản", icon: QrCode, iconBg: "bg-violet/10 text-violet" },
    ],
  },
];

const badges = [
  { icon: Shield, text: "SSL Encrypted" },
  { icon: Clock,  text: "Auto-delete 1hr" },
  { icon: Lock,   text: "100% Client-side" },
];

/* ── Quick conversion shortcuts for hero section ── */
const quickLinks = [
  { label: "PDF → Word",    to: "/pdf-to-word" },
  { label: "Ảnh → PDF",     to: "/file-converter" },
  { label: "Excel → CSV",   to: "/file-converter" },
  { label: "CSV → Excel",   to: "/file-converter" },
  { label: "JPG ↔ PNG",     to: "/image-convert" },
  { label: "Ghép PDF",      to: "/pdf-merge" },
  { label: "Nén PDF",       to: "/pdf-compress" },
];

const Index = () => {
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Smart routing based on file type
    const type = file.type;
    if (type === "application/pdf") navigate("/pdf-merge");
    else if (type.startsWith("image/")) navigate("/file-converter");
    else if (type.includes("spreadsheetml") || type.includes("ms-excel") || file.name.endsWith(".csv"))
      navigate("/file-converter");
    else if (type.includes("wordprocessingml")) navigate("/word");
    else if (type.includes("presentationml")) navigate("/ppt");
    else navigate("/file-converter");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4 tracking-tight"
        >
          Công cụ xử lý file<br /><span className="text-primary">nhanh & miễn phí</span> ⚡
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="text-muted-foreground text-lg max-w-xl mx-auto mb-10"
        >
          PDF, ảnh, Office, OCR, QR Code — tất cả chạy trực tiếp trên trình duyệt. Không cần cài đặt. Không upload server.
        </motion.p>

        {/* ── Drop zone ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
          className={`max-w-2xl mx-auto rounded-3xl border-2 border-dashed p-10 transition-all duration-300 cursor-pointer ${
            dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
          }`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Upload size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground mb-1">Kéo thả file vào đây</p>
          <p className="text-sm text-muted-foreground mb-4">PDF, ảnh, Excel, Word, PowerPoint, CSV... — tự động nhận diện và chuyển đến công cụ phù hợp</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {label} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Badges ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-6 mt-6">
          {badges.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon size={14} /><span>{text}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Tool zones ── */}
      {zones.map((zone, zi) => (
        <section key={zone.label} className="max-w-7xl mx-auto px-4 py-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <div className={`w-1.5 h-8 rounded-full ${zone.color}`} />
              <h2 className="text-2xl font-bold text-foreground">{zone.label}</h2>
              <span className="text-sm text-muted-foreground ml-1">({zone.tools.length} công cụ)</span>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {zone.tools.map((tool, ti) => (
                <motion.div key={tool.to + tool.title} variants={fadeUp} custom={ti + 1}>
                  <Link to={tool.to} className="card-neo group block h-full">
                    <div className={`w-10 h-10 rounded-2xl ${tool.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <tool.icon size={20} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 text-sm leading-tight">{tool.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
          {zi < zones.length - 1 && <AdSlot />}
        </section>
      ))}

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="font-bold text-foreground">OfficeTool</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2026 OfficeTool — Mọi xử lý diễn ra hoàn toàn trên trình duyệt. Không lưu dữ liệu.
            </p>
            <div className="flex items-center gap-4">
              {badges.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon size={12} /><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
