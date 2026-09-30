"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Megaphone, Pencil, Store, ImageIcon, Globe } from "lucide-react";

const BUSINESS_TYPES = [
  "Retail & Shopping",
  "Food & Drink",
  "Trades & Home Services",
  "Health & Beauty",
  "Professional Services",
  "Automotive",
  "Childcare & Education",
  "Pets & Animals",
  "Fitness & Sport",
  "Arts & Entertainment",
  "IT & Digital Services",
  "Cleaning Services",
  "Garden & Landscaping",
  "Property & Accommodation",
  "Transport & Delivery",
  "Other",
];

export type BusinessUser = {
  id: string;
  accountType: string;
  companyName: string | null;
  charityName: string | null;
  charityNumber: string | null;
  businessType: string | null;
  description: string | null;
  website: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  profileImage: string | null;
  coverImage: string | null;
};

export default function BusinessPanel({ user, community }: { user: BusinessUser; community: string }) {
  const isCompany = user.accountType === "COMPANY";
  const displayName = isCompany ? user.companyName : user.charityName;

  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [coverImage, setCoverImage] = useState(user.coverImage);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"profileImage" | "coverImage" | null>(null);
  const [error, setError] = useState("");
  const [businessType, setBusinessType] = useState(user.businessType ?? "");

  const uploadImage = async (file: File, field: "profileImage" | "coverImage") => {
    setUploading(field);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/profile/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, field }),
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      if (field === "profileImage") setProfileImage(data.profileImage);
      else setCoverImage(data.coverImage);
    } catch {
      setError("Image upload failed. Please try a smaller image.");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.get("companyName") || undefined,
          charityName: formData.get("charityName") || undefined,
          charityNumber: formData.get("charityNumber") || undefined,
          businessType: businessType || undefined,
          description: formData.get("description") || undefined,
          website: formData.get("website") || undefined,
          phoneNumber: formData.get("phoneNumber") || undefined,
          address: formData.get("address") || undefined,
          city: formData.get("city") || undefined,
          postcode: formData.get("postcode") || undefined,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      setShowEdit(false);
      window.location.reload();
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-2 overflow-hidden shadow-sm sm:mb-4">
      {/* Cover image */}
      <div className="relative h-28 w-full bg-gradient-to-r from-accent/20 to-accent/5 sm:h-36">
        {coverImage && (
          <Image src={coverImage} alt="Cover" fill className="object-cover" unoptimized />
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute right-2 top-2 gap-1 text-xs"
          disabled={uploading !== null}
          onClick={() => document.getElementById("cover-upload")?.click()}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {uploading === "coverImage" ? "Uploading..." : coverImage ? "Change cover" : "Add cover"}
        </Button>
        <input
          id="cover-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "coverImage")}
        />
      </div>

      <CardHeader className="flex flex-row items-start justify-between gap-3 px-3 pb-2 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <button
            type="button"
            onClick={() => document.getElementById("logo-upload")?.click()}
            className="relative -mt-8 h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-white bg-accent text-white shadow"
            title="Upload logo"
          >
            {profileImage ? (
              <Image src={profileImage} alt="Logo" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Building2 className="h-7 w-7" />
              </span>
            )}
          </button>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "profileImage")}
          />
          <div>
            <CardTitle className="text-base sm:text-lg">
              {displayName || (isCompany ? "Your business" : "Your charity")}
            </CardTitle>
            {user.businessType && (
              <p className="text-xs text-muted-foreground">{user.businessType}</p>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setShowEdit(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 px-3 pb-4 sm:px-6">
        {user.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{user.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add a description so residents know what you offer.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {isCompany && (
            <Link href={`/${community}/businesses`}>
              <Button variant="secondary" size="sm" className="gap-1">
                <Store className="h-3.5 w-3.5" /> View your listing
              </Button>
            </Link>
          )}
          {user.website && (
            <a href={user.website} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="gap-1">
                <Globe className="h-3.5 w-3.5" /> Website
              </Button>
            </a>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md bg-accent/10 p-3 text-xs text-muted-foreground">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>
            To advertise, create a post below and choose{" "}
            <span className="font-semibold">Business</span> as the post type — it will be shown to
            the community as a business ad.
          </p>
        </div>
      </CardContent>

      {/* Edit profile dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {isCompany ? "business" : "charity"} profile</DialogTitle>
            <DialogDescription>
              This information appears on your public listing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {isCompany ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bp-companyName">Business name *</Label>
                  <Input id="bp-companyName" name="companyName" defaultValue={user.companyName ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bp-businessType">Business type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger id="bp-businessType">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bp-charityName">Charity name *</Label>
                  <Input id="bp-charityName" name="charityName" defaultValue={user.charityName ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bp-charityNumber">Charity registration number</Label>
                  <Input id="bp-charityNumber" name="charityNumber" defaultValue={user.charityNumber ?? ""} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="bp-description">Description</Label>
              <Textarea
                id="bp-description"
                name="description"
                rows={4}
                defaultValue={user.description ?? ""}
                placeholder={isCompany ? "What does your business offer?" : "What does your charity do?"}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bp-website">Website</Label>
                <Input id="bp-website" name="website" type="url" placeholder="https://" defaultValue={user.website ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-phone">Phone</Label>
                <Input id="bp-phone" name="phoneNumber" type="tel" defaultValue={user.phoneNumber ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-address">Address</Label>
              <Input id="bp-address" name="address" defaultValue={user.address ?? ""} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bp-city">City</Label>
                <Input id="bp-city" name="city" defaultValue={user.city ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-postcode">Postcode</Label>
                <Input id="bp-postcode" name="postcode" defaultValue={user.postcode ?? ""} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
