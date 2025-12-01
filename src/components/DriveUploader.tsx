
"use client";

import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Link, Loader2 } from "lucide-react";

type DriveUploaderProps = {
  onUploadSuccess?: () => void;
};

export default function DriveUploader({ onUploadSuccess }: DriveUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) { // 100 MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum size is 100 MB.",
      });
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    setFileName(file.name);
    setLoading(true);
    setLink(null);

    // Simulate progress
    setProgress(0);
    const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      clearInterval(progressInterval);
      setProgress(100);
      
      const data = await res.json();
      
      if (res.ok && data?.link) {
        setLink(data.link);
        if(onUploadSuccess) onUploadSuccess();
      } else {
        throw new Error(data.error || "An unknown error occurred during upload.");
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message,
      });
    } finally {
      setLoading(false);
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        id="drive-upload-input"
        accept="application/pdf,.doc,.docx,image/*"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {loading ? `Uploading ${fileName}...` : "Choose File"}
      </Button>
      
      {loading && <Progress value={progress} />}
      
      {link && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Link className="mr-2 h-4 w-4" />
          <span>Upload complete!</span>
          <Button variant="link" asChild className="p-0 h-auto">
            <a href={link} target="_blank" rel="noopener noreferrer">View File</a>
          </Button>
        </div>
      )}
    </div>
  );
}
