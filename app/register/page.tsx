"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function RegisterForm() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string>("INDIVIDUAL");
  const [businessType, setBusinessType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      accountType: accountType as "INDIVIDUAL" | "CHARITY" | "COMPANY",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: formData.get("dateOfBirth") ? (formData.get("dateOfBirth") as string) : undefined,
      phoneNumber: formData.get("phoneNumber") ? (formData.get("phoneNumber") as string) : undefined,
      address: formData.get("address") ? (formData.get("address") as string) : undefined,
      city: (formData.get("city") as string) || "Burton Latimer",
      postcode: formData.get("postcode") ? (formData.get("postcode") as string) : undefined,
      companyName: formData.get("companyName") ? (formData.get("companyName") as string) : undefined,
      businessType: businessType || undefined,
      website: formData.get("website") ? (formData.get("website") as string) : undefined,
      charityName: formData.get("charityName") ? (formData.get("charityName") as string) : undefined,
      charityNumber: formData.get("charityNumber") ? (formData.get("charityNumber") as string) : undefined,
      description: formData.get("description") ? (formData.get("description") as string) : undefined,
      bio: formData.get("bio") ? (formData.get("bio") as string) : undefined,
      interests: formData.get("interests") 
        ? (formData.get("interests") as string).split(",").map(i => i.trim()).filter(i => i.length > 0)
        : [],
      gdprConsent: formData.get("gdprConsent") === "on",
      marketingConsent: formData.get("marketingConsent") === "on",
    };

    if (!data.gdprConsent) {
      setError("You must accept the privacy policy and terms of service to register.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image
              src="/logos/BL-Connect-Trans.png"
              alt="Burton Latimer Connect Logo"
              width={300}
              height={300}
              className="h-32 w-auto"
              priority
            />
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Join Burton Latimer Connect and connect with your neighbours
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select name="accountType" value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="CHARITY">Charity</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {accountType === "INDIVIDUAL" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>
              )}

              {accountType === "COMPANY" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" name="companyName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select name="businessType" value={businessType} onValueChange={setBusinessType} required>
                      <SelectTrigger id="businessType">
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Retail & Shopping">Retail & Shopping</SelectItem>
                        <SelectItem value="Food & Drink">Food & Drink</SelectItem>
                        <SelectItem value="Trades & Home Services">Trades & Home Services</SelectItem>
                        <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                        <SelectItem value="Professional Services">Professional Services</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Childcare & Education">Childcare & Education</SelectItem>
                        <SelectItem value="Pets & Animals">Pets & Animals</SelectItem>
                        <SelectItem value="Fitness & Sport">Fitness & Sport</SelectItem>
                        <SelectItem value="Arts & Entertainment">Arts & Entertainment</SelectItem>
                        <SelectItem value="IT & Digital Services">IT & Digital Services</SelectItem>
                        <SelectItem value="Cleaning Services">Cleaning Services</SelectItem>
                        <SelectItem value="Garden & Landscaping">Garden & Landscaping</SelectItem>
                        <SelectItem value="Property & Accommodation">Property & Accommodation</SelectItem>
                        <SelectItem value="Transport & Delivery">Transport & Delivery</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Contact First Name *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Contact Last Name *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>
                </>
              )}

              {accountType === "CHARITY" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="charityName">Charity Name *</Label>
                    <Input id="charityName" name="charityName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="charityNumber">Charity Registration Number *</Label>
                    <Input id="charityNumber" name="charityNumber" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Contact First Name *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Contact Last Name *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>

              {accountType === "INDIVIDUAL" && (
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                </div>
              )}

              {(accountType === "COMPANY" || accountType === "CHARITY") && (
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" type="url" placeholder="https://" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" type="tel" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue="Burton Latimer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" name="postcode" />
                </div>
              </div>

              {accountType === "INDIVIDUAL" && (
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              )}

              {(accountType === "COMPANY" || accountType === "CHARITY") && (
                <div className="space-y-2">
                  <Label htmlFor="description">{accountType === "COMPANY" ? "Company Description" : "Charity Description"} *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder={accountType === "COMPANY" ? "Describe your business, products, and services..." : "Describe your charity's mission and activities..."}
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="interests">Interests (Optional)</Label>
                <Input
                  id="interests"
                  name="interests"
                  placeholder="e.g., Gardening, Cooking, Sports (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Help us connect you with people who share your interests
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="gdprConsent"
                    name="gdprConsent"
                    className="mt-1"
                    required
                  />
                  <Label htmlFor="gdprConsent" className="text-sm font-normal">
                    I accept the{" "}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Terms of Service
                    </Link>
                    . I understand my data will be processed in accordance with GDPR. *
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="marketingConsent"
                    name="marketingConsent"
                    className="mt-1"
                  />
                  <Label htmlFor="marketingConsent" className="text-sm font-normal">
                    I would like to receive updates and news about the Burton Latimer Community
                    (optional)
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary underline">
                  Login here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
