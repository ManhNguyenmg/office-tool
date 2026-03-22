import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Office tools
import WordTool from "./pages/WordTool";
import ExcelTool from "./pages/ExcelTool";
import PptTool from "./pages/PptTool";
import CsvToExcel from "./pages/CsvToExcel";

// PDF tools
import PdfMerger from "./pages/PdfMerger";
import PdfSplitter from "./pages/PdfSplitter";
import PdfCompressor from "./pages/PdfCompressor";
import PdfToImage from "./pages/PdfToImage";
import PdfSign from "./pages/PdfSign";
import PdfWatermark from "./pages/PdfWatermark";
import PdfPassword from "./pages/PdfPassword";
import PdfRotate from "./pages/PdfRotate";
import PdfDeletePages from "./pages/PdfDeletePages";
import PdfReorder from "./pages/PdfReorder";
import PdfPageNumbers from "./pages/PdfPageNumbers";
import PdfOcr from "./pages/PdfOcr";

// Image tools
import ImageCompressor from "./pages/ImageCompressor";
import ImageConverter from "./pages/ImageConverter";
import ImageToPdf from "./pages/ImageToPdf";

// Other
import QrGenerator from "./pages/QrGenerator";
import FileConverter from "./pages/FileConverter";
import PdfToDocx from "./pages/PdfToDocx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Office */}
          <Route path="/word" element={<WordTool />} />
          <Route path="/excel" element={<ExcelTool />} />
          <Route path="/ppt" element={<PptTool />} />
          <Route path="/csv-to-excel" element={<CsvToExcel />} />

          {/* PDF */}
          <Route path="/pdf-merge" element={<PdfMerger />} />
          <Route path="/pdf-split" element={<PdfSplitter />} />
          <Route path="/pdf-compress" element={<PdfCompressor />} />
          <Route path="/pdf-to-image" element={<PdfToImage />} />
          <Route path="/pdf-sign" element={<PdfSign />} />
          <Route path="/pdf-watermark" element={<PdfWatermark />} />
          <Route path="/pdf-password" element={<PdfPassword />} />
          <Route path="/pdf-rotate" element={<PdfRotate />} />
          <Route path="/pdf-delete-pages" element={<PdfDeletePages />} />
          <Route path="/pdf-reorder" element={<PdfReorder />} />
          <Route path="/pdf-page-numbers" element={<PdfPageNumbers />} />
          <Route path="/pdf-ocr" element={<PdfOcr />} />

          {/* Image */}
          <Route path="/image-compress" element={<ImageCompressor />} />
          <Route path="/image-convert" element={<ImageConverter />} />
          <Route path="/image-to-pdf" element={<ImageToPdf />} />

          {/* Other */}
          <Route path="/qr-generator" element={<QrGenerator />} />
          <Route path="/file-converter" element={<FileConverter />} />
          <Route path="/pdf-to-word" element={<PdfToDocx />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
