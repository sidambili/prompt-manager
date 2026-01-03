import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { parseSlugId } from "@/lib/slug";
import PromptViewer from "@/components/prompts/PromptViewer";

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { id: actualId } = parseSlugId(id) || { id };

    const { data: prompt, error } = await supabase
        .from("prompts")
        .select("*, subcategory:subcategories(name, category:categories(name))")
        .eq("id", actualId)
        .single();

    if (error || !prompt) {
        console.error("Error fetching prompt:", error);
        return redirect("/dashboard");
    }

    return <PromptViewer prompt={prompt} />;
}
