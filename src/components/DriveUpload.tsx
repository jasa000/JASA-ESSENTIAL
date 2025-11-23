
"use client";

import React, { useState } from "react";

export default function DriveUpload() {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) { // 100 MB limit
        setError("File is too large. Maximum size is 100 MB.");
        return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setLoading(true);
    setError(null);
    setLink(null);

    try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        
        if (res.ok && data?.link) {
            setLink(data.link);
            alert("File uploaded successfully! Link: " + data.link);
        } else {
            throw new Error(data.error || "An unknown error occurred during upload.");
        }
    } catch (err: any) {
        setError(err.message);
        alert("Upload failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="text-xl font-bold">Upload Document to Drive</h2>
      <input 
        accept="application/pdf,.doc,.docx,image/*" 
        type="file" 
        onChange={handleFileChange} 
        disabled={loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {loading && <div className="flex items-center gap-2 text-blue-600">Uploading...</div>}
      {link && (
        <div className="text-green-600">
          Upload successful! <a href={link} target="_blank" rel="noreferrer" className="underline font-medium">View File</a>
        </div>
      )}
      {error && <div className="text-red-600">Error: {error}</div>}
    </div>
  );
}
