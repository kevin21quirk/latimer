"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { REPORT_CATEGORIES } from "@/lib/moderation";
import { AlertCircle } from "lucide-react";

interface ReportPostDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported?: () => void;
}

export default function ReportPostDialog({
  postId,
  open,
  onOpenChange,
  onReported,
}: ReportPostDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to report post");
      }

      onOpenChange(false);
      setSelectedReason("");
      setDetails("");
      
      if (onReported) {
        onReported();
      }

      alert("Thank you for your report. Our moderation team will review this content.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Report Post
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting content that violates our guidelines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label>Why are you reporting this post? *</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REPORT_CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                  <RadioGroupItem value={category.value} id={category.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={category.value} className="cursor-pointer font-medium">
                      {category.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context that might help our moderation team..."
              rows={4}
            />
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-900">
              <strong>Important:</strong> False reports may result in action against your account. 
              If you&apos;re in immediate danger, call 999. For urgent support, contact Samaritans on 116 123.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedReason}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? "Reporting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
