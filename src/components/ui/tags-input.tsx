"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagsInputProps {
    value?: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
    maxLength?: number;
    className?: string;
}

export function TagsInput({
    value = [],
    onChange,
    placeholder = "Add a tag...",
    maxTags = 10,
    maxLength = 24,
    className,
}: TagsInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    const addTag = () => {
        const tag = inputValue.trim().toLowerCase();

        if (!tag) return;

        if (tag.length > maxLength) {
            setError(`Tag too long (max ${maxLength} chars)`);
            return;
        }

        if (value.includes(tag)) {
            setError("Tag already exists");
            setInputValue("");
            return;
        }

        if (value.length >= maxTags) {
            setError(`Max ${maxTags} tags allowed`);
            return;
        }

        onChange([...value, tag]);
        setInputValue("");
        setError(null);
    };

    const removeTag = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
        setError(null);
    };

    const isMaxReached = value.length >= maxTags;

    return (
        <div className={cn("space-y-3 py-2 px-3 rounded-sm border", className)} id="tags-input-container">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {value.map((tag, index) => (
                        <Badge
                            key={`${tag}-${index}`}
                            variant="secondary"
                            className="h-7 px-3 text-xs font-medium flex items-center gap-1 hover:bg-secondary/80 transition-colors rounded-sm"
                        >
                            <span>{tag}</span>
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        removeTag(index);
                                    }
                                }}
                                className="inline-flex items-center justify-center rounded-sm hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                aria-label={`Remove tag: ${tag}`}
                            >
                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (error) setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => inputValue && addTag()}
                    placeholder={placeholder}
                    disabled={isMaxReached}
                    className={cn(
                        "h-10 text-sm",
                        isMaxReached && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Tag input"
                    aria-describedby={error ? "tags-error" : undefined}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    disabled={!inputValue || isMaxReached}
                    className="h-10 px-3 shrink-0"
                    aria-label="Add tag"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {error && (
                <div
                    id="tags-error"
                    className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-sm"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {isMaxReached && (
                <p className="text-xs text-muted-foreground">
                    Maximum {maxTags} tags reached
                </p>
            )}
        </div>
    );
}
