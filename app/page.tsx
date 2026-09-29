import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Building2, MessageCircle, Calendar, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto flex h-16 sm:h-20 md:h-24 items-center justify-between px-4">
          <Link href="/" className="flex h-full items-center">
            <div className="relative h-full w-auto max-w-[150px] sm:max-w-[200px] md:max-w-none" style={{ aspectRatio: '785/667' }}>
              <Image
                src="/logos/BL-Connect-Trans.png"
                alt="Burton Latimer Connect Logo"
                fill
                className="object-cover"
                style={{ objectPosition: 'left center' }}
                priority
              />
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="sm:h-10">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="sm:h-10">Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative bg-gradient-to-b from-white to-muted py-12 sm:py-16 md:py-20">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Hero images/burton-town.webp"
              alt="Burton Latimer Town"
              fill
              className="object-cover opacity-40"
              priority
            />
          </div>
          <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black" style={{ textShadow: '-2px -2px 0 #B8860B, 2px -2px 0 #B8860B, -2px 2px 0 #B8860B, 2px 2px 0 #B8860B, -3px -3px 0 #B8860B, 3px -3px 0 #B8860B, -3px 3px 0 #B8860B, 3px 3px 0 #B8860B' }}>
              Welcome to Burton Latimer Connect
            </h1>
            <p className="mx-auto mb-6 sm:mb-8 max-w-2xl text-base sm:text-lg md:text-xl text-black px-4">
              A social platform bringing together individuals, charities, and businesses 
              to support and connect with our local community.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About the Platform Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-accent/5 to-white py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-4 sm:mb-6 inline-block animate-fade-in rounded-full bg-accent/10 px-4 sm:px-6 py-2">
                <span className="text-xs sm:text-sm font-semibold text-accent">ABOUT THE PLATFORM</span>
              </div>
              <h2 className="mb-4 sm:mb-6 animate-slide-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                Bringing Burton Latimer Together
              </h2>
              <p className="mb-8 sm:mb-12 animate-slide-up text-base sm:text-lg text-muted-foreground px-4" style={{ animationDelay: '0.1s' }}>
                Burton Latimer Connect is more than just a social platform—it&apos;s a digital hub designed 
                to strengthen our local community bonds and support those who need it most.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group animate-fade-in border-2 transition-all duration-300 hover:border-accent hover:shadow-lg" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 transition-transform duration-300 group-hover:scale-110">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">For Individuals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connect with neighbours, share experiences, ask for help, and build meaningful 
                    relationships within your local community. Stay informed about local events and news.
                  </p>
                </CardContent>
              </Card>

              <Card className="group animate-fade-in border-2 transition-all duration-300 hover:border-accent hover:shadow-lg" style={{ animationDelay: '0.3s' }}>
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 transition-transform duration-300 group-hover:scale-110">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">For Charities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Reach those in need, organize community support initiatives, share your mission, 
                    and connect with volunteers and donors who want to make a difference.
                  </p>
                </CardContent>
              </Card>

              <Card className="group animate-fade-in border-2 transition-all duration-300 hover:border-accent hover:shadow-lg" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 transition-transform duration-300 group-hover:scale-110">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">For Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Promote your services to local customers, build brand awareness, engage with 
                    the community, and support local causes while growing your business.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 animate-fade-in rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 p-8 md:p-12" style={{ animationDelay: '0.5s' }}>
              <div className="mx-auto max-w-3xl text-center">
                <h3 className="mb-4 text-2xl font-bold md:text-3xl">
                  Supporting Our Vulnerable Community Members
                </h3>
                <p className="mb-6 text-lg text-muted-foreground">
                  At the heart of Burton Latimer Connect is our commitment to supporting elderly, 
                  vulnerable, and isolated members of our community. Our platform makes it easy to:
                </p>
                <div className="grid gap-4 text-left md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                      <span className="text-xs font-bold text-white">✓</span>
                    </div>
                    <p className="text-muted-foreground">Request and offer help with daily tasks and errands</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                      <span className="text-xs font-bold text-white">✓</span>
                    </div>
                    <p className="text-muted-foreground">Connect isolated individuals with friendly neighbours</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                      <span className="text-xs font-bold text-white">✓</span>
                    </div>
                    <p className="text-muted-foreground">Share important local services and resources</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                      <span className="text-xs font-bold text-white">✓</span>
                    </div>
                    <p className="text-muted-foreground">Build a safer, more connected community for everyone</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 sm:mb-12 text-center text-2xl sm:text-3xl md:text-4xl font-bold">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                    <Users className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Create Your Profile</CardTitle>
                  <CardDescription>
                    Register as an individual, charity, or business. Share your story and connect with neighbours.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                    <MessageCircle className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Connect & Share</CardTitle>
                  <CardDescription>
                    Post updates, share photos, ask for help, or advertise your services to the community.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                    <Heart className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Support Each Other</CardTitle>
                  <CardDescription>
                    Join groups, message neighbours, and help vulnerable members of our community.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 sm:mb-12 text-center text-2xl sm:text-3xl md:text-4xl font-bold">Platform Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Users className="mb-2 h-8 w-8 text-accent" />
                  <CardTitle>Social Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Stay updated with posts from your neighbours, local businesses, and community organisations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Building2 className="mb-2 h-8 w-8 text-accent" />
                  <CardTitle>Business Advertising</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Local businesses can promote their services and connect with potential customers.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Heart className="mb-2 h-8 w-8 text-accent" />
                  <CardTitle>Help Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ask for assistance or offer help to vulnerable community members.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <MessageCircle className="mb-2 h-8 w-8 text-accent" />
                  <CardTitle>Direct Messaging</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connect privately with other members through our secure messaging system.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="mb-2 h-8 w-8 text-accent" />
                  <CardTitle>Community Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Join or create groups based on interests, neighbourhoods, or causes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="mb-2 h-8 w-8 text-accent" />
                  <CardTitle>GDPR Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your data is protected and managed in accordance with GDPR regulations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-4xl font-bold">Stay Connected</h2>
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 overflow-hidden rounded-lg">
                <Image
                  src="/Hero images/bl-comm-group.png"
                  alt="Burton Latimer Community Group"
                  width={1200}
                  height={400}
                  className="h-auto w-full"
                  priority
                />
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-[#1877F2]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#1877F2]">
                      <MessageCircle className="h-6 w-6" />
                      Facebook Community
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Current Facebook community groups. If you would like to be added to this page as a community 
                      Facebook group, please contact us and we&apos;ll add you to our website.
                    </p>
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">Burton Latimer Community Group</p>
                      <a
                        href="https://www.facebook.com/groups/438268502964828"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full bg-[#1877F2] hover:bg-[#166FE5]">
                          <MessageCircle className="mr-2 h-5 w-5" />
                          Visit Facebook Group
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent">
                      <Users className="h-6 w-6" />
                      Burton Latimer Connect
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Join our dedicated social platform to connect with local people, charities, and companies. 
                      Share posts, join groups, send messages, and build meaningful connections.
                    </p>
                    <Link href="/login">
                      <Button className="w-full" variant="default">
                        <Users className="mr-2 h-5 w-5" />
                        Login to Connect
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold">Join Our Community Today</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Whether you&apos;re an individual looking to connect, a charity seeking support, 
              or a business wanting to reach local customers, Burton Latimer Community is here for you.
            </p>
            <Link href="/register">
              <Button size="lg">Create Your Account</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-2xl border-2 border-[#B8860B] bg-white px-8 py-6 shadow-lg">
              <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Built by</span>
                  <Image
                    src="/logos/Asset 2@4000x.png"
                    alt="AI Bridge Solutions"
                    width={180}
                    height={60}
                    className="h-10 w-auto"
                  />
                </div>
                <div className="h-px w-full bg-gray-200 md:h-16 md:w-px" />
                <div className="flex flex-col gap-1.5 text-center text-sm md:text-left">
                  <a 
                    href="https://aibridgesolutions.co.uk" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-medium text-gray-700 transition-colors hover:text-[#B8860B]"
                  >
                    🌐 aibridgesolutions.co.uk
                  </a>
                  <a 
                    href="mailto:support@aibridgesolutions.co.uk" 
                    className="font-medium text-gray-700 transition-colors hover:text-[#B8860B]"
                  >
                    ✉️ support@aibridgesolutions.co.uk
                  </a>
                  <a 
                    href="tel:+447359969266" 
                    className="font-medium text-gray-700 transition-colors hover:text-[#B8860B]"
                  >
                    📞 +44 7359 969266
                  </a>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              &copy; 2026 Burton Latimer Connect. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
