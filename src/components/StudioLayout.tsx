import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdSlot from "./AdSlot";

interface StudioLayoutProps {
  title: string;
  subtitle: string;
  sidebarTools: { icon: ReactNode; label: string; onClick?: () => void; active?: boolean }[];
  children: ReactNode;
  onDownload: () => void;
  downloadLabel: string;
  downloadDisabled?: boolean;
}

const StudioLayout = ({
  title,
  subtitle,
  sidebarTools,
  children,
  onDownload,
  downloadLabel,
  downloadDisabled = false,
}: StudioLayoutProps) => (
  <div className="min-h-screen flex flex-col">
    <div className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Trang chủ
          </Link>
          <div className="h-5 w-px bg-border" />
          <h1 className="font-bold text-foreground">{title}</h1>
        </div>
        <Button
          onClick={onDownload}
          disabled={downloadDisabled}
          className="btn-bounce bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl px-6 font-semibold shadow-md disabled:opacity-40"
        >
          <Download size={16} className="mr-2" />
          {downloadLabel}
        </Button>
      </div>
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar - tools */}
      <div className="w-16 border-r border-border bg-muted/30 flex flex-col items-center py-4 gap-2 shrink-0">
        {sidebarTools.map((tool, i) => (
          <button
            key={i}
            onClick={tool.onClick}
            title={tool.label}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              tool.active
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Center - main content */}
      <div className="flex-1 overflow-auto p-6">
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
        {children}
      </div>

      {/* Right sidebar - ad + info */}
      <div className="w-64 border-l border-border bg-muted/20 p-4 shrink-0 hidden lg:flex flex-col">
        <AdSlot className="h-60 my-0" />
      </div>
    </div>
  </div>
);

export default StudioLayout;
