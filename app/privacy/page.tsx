import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Burton Latimer Connect
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Burton Latimer Connect (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our social platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>We collect information that you provide directly to us, including:</p>
              <ul>
                <li>Name and contact information (email, phone number)</li>
                <li>Date of birth</li>
                <li>Address and postcode</li>
                <li>Account type (Individual, Charity, or Company)</li>
                <li>Company name or charity number (if applicable)</li>
                <li>Profile information and bio</li>
                <li>Posts, comments, and messages</li>
                <li>Group memberships and interactions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Enable you to connect with other community members</li>
                <li>Send you updates and notifications (with your consent)</li>
                <li>Respond to your comments and questions</li>
                <li>Protect against fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We are committed to complying with the General Data Protection Regulation (GDPR). 
                You have the right to:
              </p>
              <ul>
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Request erasure of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We implement appropriate technical and organisational measures to protect your personal 
                data against unauthorized access, alteration, disclosure, or destruction. Your password 
                is encrypted using industry-standard bcrypt hashing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this Privacy Policy, unless a longer retention 
                period is required by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please 
                contact us through our <Link href="/contact" className="text-accent hover:underline">Contact page</Link>.
              </p>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            Last updated: February 10, 2026
          </p>
        </div>
      </main>
    </div>
  );
}
