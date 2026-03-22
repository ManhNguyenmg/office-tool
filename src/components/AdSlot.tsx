const AdSlot = ({ className = "" }: { className?: string }) => (
  <div className={`w-full h-24 bg-muted/50 rounded-3xl flex items-center justify-center text-muted-foreground font-medium border border-dashed border-border my-8 ${className}`}>
    Advertisement Space
  </div>
);

export default AdSlot;
