
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getHomepageContent, updateHomepageContent, categories as defaultCategories } from "@/lib/data";
import { uploadImageAction } from "@/app/actions/upload-image-action";
import type { HomepageContent, Category } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, ArrowUp, ArrowDown, Pencil, Lock, Unlock } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRef } from "react";

const MAX_BANNERS = 4;
const TITLE_MAX_LENGTH = 40;
const CTA_MAX_LENGTH = 25;

const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required.").max(TITLE_MAX_LENGTH),
  cta: z.string().min(1, "CTA is required.").max(CTA_MAX_LENGTH),
  href: z.string().min(1, "Link is required."),
  imageUrl: z.string().min(1, "Image is required."),
});

const homepageSchema = z.object({
  categoryImages: z.object({
    stationary: z.string().optional(),
    books: z.string().optional(),
    xerox: z.string().optional(),
    electronics: z.string().optional(),
  }),
  banners: z.array(bannerSchema).max(MAX_BANNERS),
});

type FormData = z.infer<typeof homepageSchema>;

export default function ManageHomepagePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);
  
  const categoryFileInputRefs = {
    stationary: useRef<HTMLInputElement>(null),
    books: useRef<HTMLInputElement>(null),
    xerox: useRef<HTMLInputElement>(null),
    electronics: useRef<HTMLInputElement>(null),
  };

  const form = useForm<FormData>({
    resolver: zodResolver(homepageSchema),
    defaultValues: {
      categoryImages: {
        stationary: "",
        books: "",
        xerox: "",
        electronics: "",
      },
      banners: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "banners",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        router.push('/');
      } else {
        fetchContent();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, toast]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const content = await getHomepageContent();
      if (content) {
        form.reset({
          categoryImages: {
            stationary: content.categoryImages?.stationary || "",
            books: content.categoryImages?.books || "",
            xerox: content.categoryImages?.xerox || "",
            electronics: content.categoryImages?.electronics || "",
          },
          banners: content.banners || [],
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch homepage content." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image smaller than 4MB.'});
        return null;
    }
    
    setIsSubmitting(true);
    let uploadedUrl: string | null = null;
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
      });
      
      const uploadResult = await uploadImageAction(base64);
      if (uploadResult.success && uploadResult.url) {
          uploadedUrl = uploadResult.url;
      } else {
          toast({ variant: 'destructive', title: 'Upload failed', description: uploadResult.error });
      }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Upload failed', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
    return uploadedUrl;
  }

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const contentToUpdate: HomepageContent = {
        categoryImages: values.categoryImages,
        banners: values.banners.map(banner => ({
          ...banner
        })),
      };

      await updateHomepageContent(contentToUpdate);
      toast({ title: "Success", description: "Homepage content has been updated." });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to update content: ${error.message}` });
    } finally {
      setIsSubmitting(false);
      setEditingBannerIndex(null);
    }
  }
  
  const handleCategoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>, category: 'stationary' | 'books' | 'xerox' | 'electronics') => {
      const file = e.target.files?.[0];
      if (file) {
          const uploadedUrl = await handleFileUpload(file);
          if (uploadedUrl) {
              form.setValue(`categoryImages.${category}`, uploadedUrl, { shouldDirty: true });
          }
      }
      e.target.value = '';
  };
  
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (file) {
          const uploadedUrl = await handleFileUpload(file);
          if (uploadedUrl) {
              form.setValue(`banners.${index}.imageUrl`, uploadedUrl, { shouldDirty: true });
          }
      }
      e.target.value = '';
  };

  if (authLoading || isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }
  
  const titleCharCount = (index: number) => `${form.watch(`banners.${index}.title`)?.length || 0} / ${TITLE_MAX_LENGTH}`;
  const ctaCharCount = (index: number) => `${form.watch(`banners.${index}.cta`)?.length || 0} / ${CTA_MAX_LENGTH}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Manage Homepage</h1>
      <p className="mt-2 text-muted-foreground">Update category images and promotional banners.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Category Images</CardTitle>
                    <CardDescription>Update the images for the main service categories.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {defaultCategories.map(cat => {
                        const categoryKey = cat.href.replace('/', '') as keyof HomepageContent['categoryImages'];
                        const currentImage = form.watch(`categoryImages.${categoryKey}`);
                        return (
                            <div key={cat.id}>
                                <FormLabel>{cat.name}</FormLabel>
                                <div className="mt-2 aspect-square w-full relative border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                                    {currentImage ? <Image src={currentImage} alt={cat.name} fill className="object-cover" /> : <span className="text-muted-foreground">No Image</span>}
                                </div>
                                <Input type="file" accept="image/*" className="hidden" ref={categoryFileInputRefs[categoryKey]} onChange={(e) => handleCategoryFileChange(e, categoryKey)} disabled={isSubmitting}/>
                                <div className="mt-2 flex gap-2">
                                  <Button type="button" variant="outline" className="flex-1" onClick={() => categoryFileInputRefs[categoryKey].current?.click()} disabled={isSubmitting}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button type="button" variant="destructive" className="flex-1" disabled={!currentImage || isSubmitting}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will remove the image for the {cat.name} category. The service will show a default placeholder.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => form.setValue(`categoryImages.${categoryKey}`, '', { shouldDirty: true })}>
                                          Confirm Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Promotional Banners</CardTitle>
                    <CardDescription>Manage the rotating banners on the homepage. You can have up to {MAX_BANNERS} banners.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {fields.map((field, index) => {
                        const isEditing = editingBannerIndex === index;
                        return (
                        <Card key={field.id} className="p-4 relative">
                           <div className="flex justify-between items-start">
                                <h4 className="font-bold mb-4">Banner {index + 1}</h4>
                                <div className="flex gap-1">
                                    <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp className="h-4 w-4" /></Button>
                                    <Button type="button" variant="ghost" size="icon" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}><ArrowDown className="h-4 w-4" /></Button>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditingBannerIndex(isEditing ? null : index)}>
                                        {isEditing ? <Unlock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button type="button" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently remove this banner. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => remove(index)}>Delete Banner</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                           </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                     <FormField
                                        control={form.control}
                                        name={`banners.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex justify-between">
                                                    <FormLabel>Title</FormLabel>
                                                    <span className="text-xs text-muted-foreground">{titleCharCount(index)}</span>
                                                </div>
                                                <FormControl><Input {...field} maxLength={TITLE_MAX_LENGTH} disabled={!isEditing} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`banners.${index}.cta`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex justify-between">
                                                    <FormLabel>Call to Action Text</FormLabel>
                                                    <span className="text-xs text-muted-foreground">{ctaCharCount(index)}</span>
                                                </div>
                                                <FormControl><Input {...field} maxLength={CTA_MAX_LENGTH} disabled={!isEditing} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`banners.${index}.href`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Link URL</FormLabel>
                                                <FormControl><Input {...field} placeholder="/stationary" disabled={!isEditing} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormLabel>Banner Image</FormLabel>
                                    <div className="mt-2 aspect-video w-full relative border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                                        {form.watch(`banners.${index}.imageUrl`) ? <Image src={form.watch(`banners.${index}.imageUrl`)} alt={`Banner ${index + 1}`} fill className="object-cover" /> : <span className="text-muted-foreground">No Image</span>}
                                    </div>
                                    <Input type="file" accept="image/*" className="mt-2" onChange={(e) => handleBannerFileChange(e, index)} disabled={isSubmitting || !isEditing}/>
                                    <FormField control={form.control} name={`banners.${index}.imageUrl`} render={({ field }) => <FormMessage />} />
                                </div>
                            </div>
                        </Card>
                    )}})}
                    {fields.length < MAX_BANNERS && (
                        <Button type="button" variant="outline" onClick={() => {
                            append({ title: '', cta: '', href: '', imageUrl: '' });
                            setEditingBannerIndex(fields.length);
                        }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Banner
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="sticky bottom-0 bg-background py-4 border-t">
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Homepage Content"}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
