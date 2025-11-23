
import DriveUpload from "@/components/DriveUpload";

export default function UploadDocumentPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Upload Your Document</h1>
            <p className="mt-2 text-muted-foreground">Upload your documents securely to Google Drive.</p>
            <div className="mt-8">
                <DriveUpload />
            </div>
        </div>
    );
}
