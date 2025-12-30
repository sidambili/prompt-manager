"use client";

import { Wrench } from "lucide-react";
import { useState } from "react";

const MOCK_TOOLS = [
    { id: "calc", name: "Calculator" },
    { id: "web", name: "Web Search" },
    { id: "vision", name: "Vision" },
    { id: "code", name: "Code Interpreter" },
];

export default function ToolFilter() {
    const [selectedTools, setSelectedTools] = useState<string[]>([]);

    const toggleTool = (id: string) => {
        setSelectedTools(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col gap-3" id="tool-filter-root">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 px-3" id="tool-filter-label">
                Tools
            </h3>
            <div className="flex flex-col gap-1 px-1" id="tool-filter-list">
                {MOCK_TOOLS.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id);
                    return (
                        <button
                            key={tool.id}
                            onClick={() => toggleTool(tool.id)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all group ${isSelected
                                    ? "bg-brand/10 text-brand font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                }`}
                            id={`tool-filter-item-${tool.id}`}
                        >
                            <Wrench className={`h-3.5 w-3.5 ${isSelected ? "text-brand" : "text-muted-foreground/60 group-hover:text-muted-foreground"}`} />
                            {tool.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
