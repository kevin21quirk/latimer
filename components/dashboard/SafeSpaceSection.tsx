"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Lock, Heart, AlertCircle, MessageCircle, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type AnonymousPost = {
  id: string;
  content: string;
  createdAt: Date;
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      accountType: string;
    };
  }[];
};

export default function SafeSpaceSection({ userId }: { userId: string }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [content, setContent] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [anonymousPosts, setAnonymousPosts] = useState<AnonymousPost[]>([]);
  const [showMyPosts, setShowMyPosts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/posts/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          anonymousContactEmail: contactEmail || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      setContent("");
      setContactEmail("");
      setShowCreateDialog(false);
      
      // Refresh posts
      fetchAnonymousPosts();
    } catch (error) {
      console.error("Error creating anonymous post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnonymousPosts = async () => {
    try {
      const response = await fetch("/api/posts/anonymous");
      if (response.ok) {
        const posts = await response.json();
        setAnonymousPosts(posts);
      }
    } catch (error) {
      console.error("Error fetching anonymous posts:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Safe Space Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-purple-900">Safe Space</CardTitle>
              <CardDescription className="text-purple-700">
                A confidential space for vulnerable community members
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-purple-900">
              <Lock className="h-5 w-5" />
              What is Safe Space?
            </h3>
            <p className="mb-3 text-sm text-gray-700">
              Safe Space allows you to post anonymously about sensitive issues, concerns, or situations 
              where you need support but prefer to remain private. Your identity is protected, and only 
              verified services, charities, and trained support staff can respond.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">Your posts are completely anonymous to other users</span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">Only you can see which posts are yours</span>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">Verified charities and services can offer support</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-gray-700">Optional: Provide contact email for direct support</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 mb-1">Emergency Support</p>
                <p className="text-amber-800">
                  If you&apos;re in immediate danger, please call <strong>999</strong>. 
                  For urgent mental health support, call <strong>Samaritans: 116 123</strong> (24/7).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Lock className="mr-2 h-4 w-4" />
              Post Anonymously
            </Button>
            <Button
              onClick={() => {
                setShowMyPosts(!showMyPosts);
                if (!showMyPosts) fetchAnonymousPosts();
              }}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {showMyPosts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showMyPosts ? "Hide" : "View"} My Posts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Anonymous Posts (only visible to user) */}
      {showMyPosts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              My Anonymous Posts
            </CardTitle>
            <CardDescription>
              Only you can see that these posts are yours. They appear anonymous to everyone else.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {anonymousPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You haven&apos;t created any anonymous posts yet.
              </p>
            ) : (
              <div className="space-y-4">
                {anonymousPosts.map((post) => (
                  <div key={post.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Avatar className="h-8 w-8 bg-purple-100">
                        <AvatarFallback className="text-purple-600">
                          <Shield className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">Anonymous</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="mb-3 whitespace-pre-wrap text-sm">{post.content}</p>
                    
                    {/* Responses from services */}
                    {post.comments.length > 0 && (
                      <div className="mt-4 space-y-3 border-t pt-3">
                        <p className="text-xs font-semibold text-gray-600">Support Responses:</p>
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="rounded bg-blue-50 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {comment.user.firstName[0]}{comment.user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-medium">
                                  {comment.user.firstName} {comment.user.lastName}
                                  {comment.user.accountType === "CHARITY" && (
                                    <span className="ml-1 text-blue-600">(Charity)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Anonymous Post Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Create Anonymous Post
            </DialogTitle>
            <DialogDescription>
              Share your concerns or situation anonymously. Your identity will be protected.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-purple-50 p-4 text-sm">
              <p className="mb-2 font-semibold text-purple-900">Your post will be:</p>
              <ul className="space-y-1 text-purple-800">
                <li>• Completely anonymous to all users</li>
                <li>• Visible only to verified support services and charities</li>
                <li>• Monitored by our safeguarding team</li>
                <li>• Kept confidential and secure</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="content">What would you like to share? *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your concerns, situation, or what support you need... Be as detailed as you feel comfortable."
                className="mt-2 min-h-[200px]"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Take your time. Write as much or as little as you need.
              </p>
            </div>

            <div>
              <Label htmlFor="email">Contact Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                If you&apos;d like services to contact you directly, provide an email. This remains private 
                and is only shared with verified support organisations who respond to your post.
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-900">
                <strong>Remember:</strong> If you&apos;re in immediate danger, call 999. For urgent mental 
                health support, call Samaritans on 116 123 (24/7).
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Posting..." : "Post Anonymously"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
