import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
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
        <h1 className="mb-8 text-4xl font-bold">Terms and Conditions</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                By accessing and using Burton Latimer Connect, you accept and agree to be bound by 
                the terms and provisions of this agreement. If you do not agree to these terms, 
                please do not use our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>To use certain features of our platform, you must register for an account. You agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>You agree not to:</p>
              <ul>
                <li>Post content that is illegal, harmful, threatening, abusive, or offensive</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, stalk, or harm other users</li>
                <li>Spam or send unsolicited messages</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with the proper functioning of the platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Ownership</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                You retain ownership of any content you post on Burton Latimer Connect. By posting 
                content, you grant us a non-exclusive, worldwide, royalty-free license to use, 
                display, and distribute your content on the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Burton Latimer Connect is a community platform. We expect all users to treat each 
                other with respect and kindness. Content that violates our community guidelines may 
                be removed, and repeat offenders may have their accounts suspended or terminated.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without 
                notice, for conduct that we believe violates these Terms of Service or is harmful to 
                other users, us, or third parties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Burton Latimer Connect is provided &quot;as is&quot; without warranties of any kind, either 
                express or implied. We do not guarantee that the platform will be uninterrupted, 
                secure, or error-free.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                To the fullest extent permitted by law, Burton Latimer Connect shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages resulting 
                from your use of the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any 
                material changes. Your continued use of the platform after such modifications 
                constitutes acceptance of the updated terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                If you have any questions about these Terms and Conditions, please contact us through 
                our <Link href="/contact" className="text-accent hover:underline">Contact page</Link>.
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
