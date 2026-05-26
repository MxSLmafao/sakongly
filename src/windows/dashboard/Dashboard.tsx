import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ConversationView } from "./ConversationView";
import { Settings } from "./Settings/Settings";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

type Tab = "conversations" | "settings";

export function Dashboard() {
  useGlobalShortcuts();
  const [tab, setTab] = useState<Tab>("conversations");

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Left nav */}
        <nav className="w-48 flex flex-col border-r border-border shrink-0">
          <div className="px-4 py-3 font-semibold text-sm tracking-tight">Sakongly</div>
          <Separator />
          <div className="flex flex-col gap-1 p-2">
            <NavItem label="Conversations" active={tab === "conversations"} onClick={() => setTab("conversations")} />
            <NavItem label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
          </div>
        </nav>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {tab === "conversations" ? (
            <>
              <Sidebar />
              <ConversationView />
            </>
          ) : (
            <Settings />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {label}
    </button>
  );
}
