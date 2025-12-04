
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { 
    getDriveUsageAction, 
    getDriveFilesAction, 
    deleteDriveFileAction
} from "@/app/actions/drive-actions";
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
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, HardDrive, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type DriveFile = {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  webViewLink: string;
  orderStatus: 'Active' | 'Delivered' | 'Cancelled/Rejected' | 'Unused' | null;
};

type DriveUsage = {
  limit: number;
  usage: number;
  usageInDrive: number;
};

export default function ManageDrivePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [usage, setUsage] = useState<DriveUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFile, setDeletingFile] = useState<DriveFile | null>(null);
  const [activeTab, setActiveTab] = useState("all");


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedUsage, fetchedFiles] = await Promise.all([
        getDriveUsageAction(),
        getDriveFilesAction(),
      ]);
      setUsage(fetchedUsage);
      setFiles(fetchedFiles);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch Google Drive data: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("admin")) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        router.push("/");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, toast, fetchData]);

  const handleDelete = async () => {
    if (!deletingFile) return;
    try {
      await deleteDriveFileAction(deletingFile.id);
      toast({
        title: "File Deleted",
        description: `"${deletingFile.name}" has been removed from Google Drive.`,
      });
      fetchData(); // Refresh data
      setDeletingFile(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message,
      });
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };
  
  const filteredFiles = useMemo(() => {
    if (activeTab === "all") return files;
    if (activeTab === "unused") return files.filter(f => f.orderStatus === "Unused" || f.orderStatus === "Cancelled/Rejected");
    return files.filter(f => f.orderStatus?.toLowerCase() === activeTab);
  }, [files, activeTab]);

  const renderUsageCard = () => {
    if (isLoading || !usage) {
      return (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      );
    }

    const usagePercent = (usage.usage / usage.limit) * 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive /> Google Drive Storage
          </CardTitle>
          <CardDescription>
            Your current storage usage across your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div>
              <div className="flex justify-between text-sm font-medium">
                <span>Used</span>
                <span>
                  {formatBytes(usage.usage)} / {formatBytes(usage.limit)}
                </span>
              </div>
              <Progress value={usagePercent} className="mt-1 h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Usage in Drive folder specifically: {formatBytes(usage.usageInDrive)}
            </p>
        </CardContent>
      </Card>
    );
  };
  
  const renderStatusBadge = (status: DriveFile['orderStatus']) => {
    switch (status) {
        case 'Active':
            return <Badge variant="default">Active Order</Badge>;
        case 'Delivered':
            return <Badge variant="secondary">Delivered</Badge>;
        case 'Cancelled/Rejected':
            return <Badge variant="destructive">Cancelled/Rejected</Badge>;
        case 'Unused':
            return <Badge variant="outline">Unused</Badge>;
        default:
            return <Badge variant="outline">Unknown</Badge>;
    }
};

  const renderFilesTable = (fileList: DriveFile[]) => {
    if (isLoading) {
       return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
       )
    }
    if(fileList.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No files found for this filter.</p>
            </div>
        )
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Date Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fileList.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium truncate max-w-sm">{file.name}</TableCell>
              <TableCell>{renderStatusBadge(file.orderStatus)}</TableCell>
              <TableCell>{file.size}</TableCell>
              <TableCell>{new Date(file.createdTime).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeletingFile(file)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Manage Google Drive
        </h1>
        <p className="mt-2 text-muted-foreground">
          View storage usage and manage your uploaded documents based on order status.
        </p>

        <div className="my-8">
            {renderUsageCard()}
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                Filter files based on their linked order status to manage storage.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Files</TabsTrigger>
                    <TabsTrigger value="active">Active Orders</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered</TabsTrigger>
                    <TabsTrigger value="unused" className="text-destructive">Unused/Archived</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-4">
                      {renderFilesTable(filteredFiles)}
                  </TabsContent>
                  <TabsContent value="active" className="mt-4">
                      {renderFilesTable(filteredFiles)}
                  </TabsContent>
                  <TabsContent value="delivered" className="mt-4">
                      {renderFilesTable(filteredFiles)}
                  </TabsContent>
                  <TabsContent value="unused" className="mt-4">
                      <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4"/>
                        <p>These files are from cancelled/rejected orders or are not associated with any order. They are likely safe to delete.</p>
                      </div>
                      {renderFilesTable(filteredFiles)}
                  </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && setDeletingFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              file "{deletingFile?.name}" from your Google Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
