interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Permet de définir la taille du widget dans la grille
}

export function WidgetWrapper({ title, children, className = "" }: WidgetWrapperProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded shadow-sm flex flex-col font-['Calibri','Arial',sans-serif] ${className}`}>
      {/* En-tête du Widget */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 rounded-t">
        <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {/* Contenu du Widget */}
      <div className="p-4 flex-1">
        {children}
      </div>
    </div>
  );
}