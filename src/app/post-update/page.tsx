

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { addPost, getPosts, updatePost, deletePost } from "@/lib/posts";
import type { Post } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const postSchema = z.object({
  content: z.string().min(10, "Post must be at least 10 characters.").max(500, "Post must be 500 characters or less."),
});

export default function PostUpdatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
    },
  });

  const editForm = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
  });

  useEffect(() => {
    if (!loading) {
      if (!user || !user.roles.includes('admin')) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        router.push('/');
      }
    }
  }, [user, loading, router, toast]);

  useEffect(() => {
    if (user?.roles.includes('admin')) {
      fetchPosts();
    }
  }, [user]);

  useEffect(() => {
    if (editingPost) {
      editForm.reset({ content: editingPost.content });
    }
  }, [editingPost, editForm]);

  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    const fetchedPosts = await getPosts();
    setPosts(fetchedPosts);
    setIsLoadingPosts(false);
  };

  async function onSubmit(values: z.infer<typeof postSchema>) {
    if (!user) return;
    try {
      await addPost(values.content, user.uid);
      toast({ title: "Post Created", description: "Your new post has been published." });
      form.reset();
      fetchPosts();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  }
  
  async function onEditSubmit(values: z.infer<typeof postSchema>) {
    if (!editingPost) return;
    try {
      await updatePost(editingPost.id, { content: values.content });
      toast({ title: "Post Updated", description: "The post content has been saved." });
      fetchPosts();
      setIsEditDialogOpen(false);
      setEditingPost(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Updating Post", description: error.message });
    }
  }

  const handleToggleActive = async (post: Post) => {
    try {
      await updatePost(post.id, { isActive: !post.isActive });
      toast({ title: "Post Updated", description: `Post is now ${!post.isActive ? 'active' : 'inactive'}.` });
      fetchPosts();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      toast({ title: "Post Deleted", description: "The post has been successfully deleted." });
      fetchPosts();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };
  
  if (loading || !user?.roles.includes('admin')) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Post Updates</h1>
      <p className="mt-2 text-muted-foreground">Create and manage posts for your users.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>New Post</CardTitle>
              <CardDescription>Compose a new update to share.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Content</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What's on your mind?" {...field} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Posting..." : "Post Update"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Manage Posts</CardTitle>
              <CardDescription>View, activate, and delete existing posts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPosts ? (
                      <TableRow><TableCell colSpan={4} className="text-center">Loading posts...</TableCell></TableRow>
                    ) : posts.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">No posts found.</TableCell></TableRow>
                    ) : (
                      posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="max-w-xs truncate">{post.content}</TableCell>
                          <TableCell>
                             <Badge variant={post.isActive ? "default" : "secondary"}>
                              {post.isActive ? "Active" : "Inactive"}
                             </Badge>
                          </TableCell>
                           <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                   <div className="flex items-center space-x-2">
                                     <Switch
                                        id={`active-switch-${post.id}`}
                                        checked={post.isActive}
                                        aria-label="Toggle post active status"
                                    />
                                   </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to change the post status to {post.isActive ? "'Inactive'" : "'Active'"}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleToggleActive(post)}>Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                               </AlertDialog>
                               
                               <Dialog open={isEditDialogOpen && editingPost?.id === post.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingPost(null);
                                    editForm.reset();
                                  }
                                  setIsEditDialogOpen(open);
                                }}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Post</DialogTitle>
                                        <DialogDescription>
                                            Make changes to your post here. Click save when you're done.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...editForm}>
                                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                            <FormField
                                                control={editForm.control}
                                                name="content"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Content</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} rows={5} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                             <DialogFooter>
                                                <DialogClose asChild>
                                                  <Button type="button" variant="secondary">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                                  {editForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                               </Dialog>


                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the post. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    
