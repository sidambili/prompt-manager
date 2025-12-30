"use client";

import { Cpu } from "lucide-react";
import { useState } from "react";

const MOCK_MODELS = [
    { id: "gpt-5", name: "GPT 5+" },
    { id: "claude-3-5", name: "Claude 3.5" },
    { id: "gemini-1-5", name: "Gemini 1.5" },
    { id: "grok-2", name: "Grok 2" },
    { id: "gpt-4o", name: "GPT 4o" },
];

export default function ModelFilter() {
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-3" id="model-filter-root">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 px-3" id="model-filter-label">
                Models
            </h3>
            <div className="grid grid-cols-1 gap-1 px-1" id="model-filter-list">
                {MOCK_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                        <button
                            key={model.id}
                            onClick={() => setSelectedModel(isSelected ? null : model.id)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all group ${isSelected
                                    ? "bg-brand/10 text-brand font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                }`}
                            id={`model-filter-item-${model.id}`}
                        >
                            <Cpu className={`h-3.5 w-3.5 ${isSelected ? "text-brand" : "text-muted-foreground/60 group-hover:text-muted-foreground"}`} />
                            {model.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
