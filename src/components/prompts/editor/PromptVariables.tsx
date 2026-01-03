"use client";

import { Check, GitFork } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Variable {
    key: string;
    raw: string;
}

interface PromptVariablesProps {
    variables: Variable[];
    values: Record<string, string>;
    onValueChange: (key: string, value: string) => void;
    missingCount: number;
}

export function PromptVariables({ variables, values, onValueChange, missingCount }: PromptVariablesProps) {
    return (
        <div className="rounded-sm border bg-card/50 shadow-sm overflow-hidden" id="variables-inspector">
            <div className="bg-muted/30 px-5 py-3 border-b flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Parameters
                </h3>
                <Badge
                    variant="outline"
                    className={cn(
                        "text-[10px] h-4 rounded-sm border-transparent",
                        variables.length === 0
                            ? "bg-muted/50 text-muted-foreground"
                            : missingCount === 0
                                ? "bg-brand/20 text-brand"
                                : "bg-orange/10 text-orange-400"
                    )}
                >
                    {variables.length === 0
                        ? "NONE"
                        : missingCount === 0
                            ? "READY"
                            : `${missingCount} MISSING`}
                </Badge>
            </div>
            <div className="p-5 space-y-5">
                {variables.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                        <div className="h-8 w-8 rounded-sm bg-muted mx-auto flex items-center justify-center opacity-40">
                            <GitFork className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                            No parameters detected
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                            Use {"{{variable}}"} syntax to add parameters
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {variables.map((variable, idx) => (
                            <div key={variable.key} className="space-y-1.5 group" id={`param-group-${idx}`}>
                                <div className="flex justify-between items-center px-0.5">
                                    <label
                                        htmlFor={`field-${variable.key}`}
                                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-focus-within:text-brand transition-colors"
                                    >
                                        {variable.raw}
                                    </label>
                                    {values[variable.key] && (
                                        <Check className="h-3 w-3 text-brand" />
                                    )}
                                </div>
                                <Input
                                    id={`field-${variable.key}`}
                                    value={values[variable.key] || ""}
                                    onChange={(e) => onValueChange(variable.key, e.target.value)}
                                    placeholder={`Set ${variable.raw}...`}
                                    className="h-8 text-[13px] font-mono bg-background/50 border-border/50 focus:border-brand focus:ring-0 transition-all"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
