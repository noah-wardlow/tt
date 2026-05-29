import { Upload } from "lucide-react";
import { useState } from "react";
import {
  Button as AriaButton,
  DropZone,
  FileTrigger,
} from "react-aria-components";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FileDropUploadProps = {
  title?: string;
  description?: string;
  acceptedFileTypes?: string[];
  buttonLabel?: string;
  multiple?: boolean;
  onSelect: (files: FileList | null) => void | Promise<void>;
  className?: string;
};

export function FileDropUpload({
  title = "Upload a file",
  description = "Drag and drop a file here",
  acceptedFileTypes,
  buttonLabel = "Choose file",
  multiple = false,
  onSelect,
  className,
}: FileDropUploadProps) {
  const [isDropping, setIsDropping] = useState(false);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <DropZone
          onDropEnter={() => setIsDropping(true)}
          onDropExit={() => setIsDropping(false)}
          getDropOperation={(types) =>
            types.has("Files") || acceptedFileTypes?.some((type) => types.has(type))
              ? "copy"
              : "cancel"
          }
          onDrop={async (event) => {
            setIsDropping(false);
            const files = await Promise.all(
              event.items
                .filter((item) => item.kind === "file")
                .map((item) => item.getFile()),
            );
            if (files.length === 0) return;

            const dataTransfer = new DataTransfer();
            for (const file of multiple ? files : files.slice(0, 1)) {
              dataTransfer.items.add(file);
            }
            await onSelect(dataTransfer.files);
          }}
          className={cn(
            "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDropping
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload
              className={cn(
                "size-12",
                isDropping ? "text-primary" : "text-muted-foreground",
              )}
            />
            <div>
              <p className="font-medium">
                {isDropping ? "Drop your file here" : description}
              </p>
            </div>
            <FileTrigger
              acceptedFileTypes={acceptedFileTypes}
              allowsMultiple={multiple}
              onSelect={onSelect}
            >
              <AriaButton className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors">
                {buttonLabel}
              </AriaButton>
            </FileTrigger>
          </div>
        </DropZone>
      </CardContent>
    </Card>
  );
}
