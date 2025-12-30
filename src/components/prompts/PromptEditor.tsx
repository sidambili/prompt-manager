'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/lib/slug';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().max(500, 'Description is too long').default(''),
  subcategory_id: z.string().min(1, 'Category is required'),
  is_public: z.boolean().default(false),
  is_listed: z.boolean().default(true),
});

interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

type PromptEditorProps = {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    slug: string;
    is_public: boolean;
    is_listed: boolean;
    subcategory_id: string;
  };
};

export default function PromptEditor({ prompt }: PromptEditorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      subcategory_id: prompt.subcategory_id,
      is_public: prompt.is_public,
      is_listed: prompt.is_listed,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('categories')
        .select('id, name, subcategories(id, name)')
        .order('sort_rank', { ascending: true });
      if (data) {
        setCategories(data as unknown as Category[]);
      }
      setIsLoading(false);
    };
    fetchCategories();
  }, [supabase]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    try {
      // Generate new slug if title changed
      const newSlug = values.title !== prompt.title ? slugify(values.title) : prompt.slug;

      const { error } = await supabase
        .from('prompts')
        .update({
          title: values.title,
          content: values.content,
          description: values.description,
          subcategory_id: values.subcategory_id,
          is_public: values.is_public,
          is_listed: values.is_listed,
          slug: newSlug,
        })
        .eq('id', prompt.id);

      if (error) throw error;

      // Create revision entry
      await supabase.from('prompt_revisions').insert({
        prompt_id: prompt.id,
        title: values.title,
        content: values.content,
        description: values.description,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      // Redirect to canonical URL
      router.push(`/prompts/${newSlug}--${prompt.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to update prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/prompts/${prompt.slug}--${prompt.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Prompt</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metadata */}
            <div className="md:col-span-1 space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoading}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <div key={cat.id}>
                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase bg-muted/30">
                              {cat.name}
                            </div>
                            {cat.subcategories.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Public</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Anyone can view this prompt
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_listed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Listed</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Show in public listings
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch('is_public')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter prompt content..."
                        className="min-h-[400px] font-mono text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/prompts/${prompt.slug}--${prompt.id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
