"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Heart,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Building2,
  HandHeart,
  Calendar,
  Plus,
  MessageCircle,
  Home,
  HeartHandshake,
  Search,
  Bell,
  User,
  Shield,
  AlertCircle,
  Flag,
  MoreVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlatformHeader from "@/components/shared/PlatformHeader";
import SafeSpaceSection from "@/components/dashboard/SafeSpaceSection";
import ReportPostDialog from "@/components/moderation/ReportPostDialog";
import ConnectionRequestsDialog from "@/components/connections/ConnectionRequestsDialog";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
  bio: string | null;
};

type Post = {
  id: string;
  content: string;
  postType: string;
  images: string[];
  video: string | null;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    accountType: string;
    profileImage: string | null;
    companyName: string | null;
  };
  likes: { userId: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
};

type UserGroup = {
  id: string;
  name: string;
  _count: {
    joinRequests: number;
  };
};

type UnreadMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

type PendingConnectionRequest = {
  id: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    accountType: string;
  };
};

export default function DashboardClient({
  user,
  initialPosts,
  userGroups = [],
  pendingConnectionRequests = [],
}: {
  user: User;
  initialPosts: Post[];
  userGroups?: UserGroup[];
  pendingConnectionRequests?: PendingConnectionRequest[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState("GENERAL");
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentContent, setCommentContent] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showMessageAlert, setShowMessageAlert] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("public");
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [pendingConnections, setPendingConnections] = useState(pendingConnectionRequests);
  const [groupsWithRequests, setGroupsWithRequests] = useState(userGroups);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // Show notification dialog on first load if there are pending requests
  useEffect(() => {
    const sessionKey = `notification_shown_${user.id}`;
    const hasShown = sessionStorage.getItem(sessionKey);
    
    if (!hasShown && !hasShownNotification) {
      const totalPendingRequests = 
        pendingConnections.length + 
        groupsWithRequests.reduce((sum, g) => sum + g._count.joinRequests, 0);
      
      if (totalPendingRequests > 0) {
        setShowNotificationDialog(true);
        setHasShownNotification(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [user.id, pendingConnections.length, groupsWithRequests, hasShownNotification]);

  const handleAcceptConnection = async (connectionId: string) => {
    setProcessingRequest(connectionId);
    try {
      const response = await fetch('/api/connections/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      if (response.ok) {
        setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    setProcessingRequest(connectionId);
    try {
      const response = await fetch('/api/connections/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      if (response.ok) {
        setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
      }
    } catch (error) {
      console.error('Error rejecting connection:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleApproveGroupRequest = async (groupId: string, requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        setGroupsWithRequests(prev => 
          prev.map(g => {
            if (g.id === groupId) {
              return {
                ...g,
                _count: {
                  joinRequests: Math.max(0, g._count.joinRequests - 1)
                }
              };
            }
            return g;
          }).filter(g => g._count.joinRequests > 0)
        );
      }
    } catch (error) {
      console.error('Error approving group request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectGroupRequest = async (groupId: string, requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        setGroupsWithRequests(prev => 
          prev.map(g => {
            if (g.id === groupId) {
              return {
                ...g,
                _count: {
                  joinRequests: Math.max(0, g._count.joinRequests - 1)
                }
              };
            }
            return g;
          }).filter(g => g._count.joinRequests > 0)
        );
      }
    } catch (error) {
      console.error('Error rejecting group request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreatingGroup(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      interests: formData.get("interests") 
        ? (formData.get("interests") as string).split(",").map(i => i.trim()).filter(i => i.length > 0)
        : [],
      isPrivate: formData.get("isPrivate") === "on",
    };

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        form.reset();
        setShowCreateGroupDialog(false);
        alert("Group created successfully! It will appear once an admin approves it.");
        router.refresh();
      } else {
        alert("Failed to create group. Please try again.");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error creating group. Please try again.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const checkUnreadMessages = async () => {
    try {
      console.log('=== CHECKING UNREAD MESSAGES ===');
      console.log('Calling /api/messages/unread...');
      const response = await fetch('/api/messages/unread');
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API returned data:', data);
        console.log('Count:', data.count);
        console.log('Messages array length:', data.messages?.length);
        
        if (data.count > 0) {
          console.log(`Found ${data.count} unread messages`);
          setUnreadMessageCount(data.count);
          setUnreadMessages(data.messages);
          
          // Only show popup if not shown in this session
          const hasShownPopup = sessionStorage.getItem('unreadMessagesPopupShown');
          console.log('Has shown popup this session?', hasShownPopup);
          
          if (!hasShownPopup) {
            console.log('SETTING showMessageAlert to TRUE');
            setShowMessageAlert(true);
            sessionStorage.setItem('unreadMessagesPopupShown', 'true');
            console.log('Popup should now be visible');
          } else {
            console.log('Popup already shown this session, skipping');
            console.log('To test again, clear sessionStorage or logout/login');
          }
        } else {
          console.log('No unread messages found (count is 0)');
        }
      } else {
        console.error('API call failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  useEffect(() => {
    console.log('Dashboard mounted, checking for unread messages...');
    checkUnreadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setLoading(true);
    setModerationError(null);
    
    try {
      // Check content moderation first
      const moderationCheck = await fetch("/api/posts/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          images: selectedImages.length,
        }),
      });

      const moderationResult = await moderationCheck.json();

      if (moderationResult.blocked) {
        setModerationError(moderationResult.reason || "Your post contains content that violates our community guidelines. Please review and modify your post.");
        setLoading(false);
        return;
      }

      if (moderationResult.needsReview) {
        const confirmPost = confirm(
          "Your post has been flagged for review due to potentially sensitive content. It will be reviewed by our moderation team before being published. Do you want to continue?"
        );
        if (!confirmPost) {
          setLoading(false);
          return;
        }
      }

      // Convert images to base64 for now (in production, use proper file upload)
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });
        imageUrls.push(base64);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          postType,
          images: imageUrls,
          groupId: selectedGroup === "public" ? null : selectedGroup,
          riskScore: moderationResult.riskScore || 0,
          isFlagged: moderationResult.needsReview || false,
        }),
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setNewPostContent("");
        setPostType("GENERAL");
        setSelectedImages([]);
        setSelectedGroup("public");
        setSafetyWarning(null);
      } else {
        const errorData = await response.json();
        setModerationError(errorData.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setModerationError("An error occurred while creating your post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p.id === postId ? updatedPost : p));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleAddComment = async (postId: string) => {
    const content = commentContent[postId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        setCommentContent({ ...commentContent, [postId]: "" });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setSelectedImages(prev => [...prev, ...imageFiles].slice(0, 4)); // Max 4 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "HELP_REQUEST":
        return <HandHeart className="h-4 w-4 text-accent" />;
      case "BUSINESS_AD":
        return <Building2 className="h-4 w-4 text-accent" />;
      case "EVENT":
        return <Calendar className="h-4 w-4 text-accent" />;
      default:
        return null;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "HELP_REQUEST":
        return "Help Request";
      case "BUSINESS_AD":
        return "Business Ad";
      case "EVENT":
        return "Event";
      default:
        return "Post";
    }
  };

  console.log('Render - showMessageAlert:', showMessageAlert, 'unreadMessageCount:', unreadMessageCount, 'messages:', unreadMessages.length);

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="dashboard" />

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
            <DialogDescription>
              Create a community group. It will be reviewed by an admin before becoming visible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your group"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="interests">Interests (Optional)</Label>
              <Input
                id="interests"
                name="interests"
                placeholder="e.g., Gardening, Cooking, Sports (comma-separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Help people discover your group based on shared interests
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                className="h-4 w-4"
              />
              <Label htmlFor="isPrivate" className="cursor-pointer">
                Make this group private
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateGroupDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingGroup}>
                {creatingGroup ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pending Requests Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pending Requests</DialogTitle>
            <DialogDescription>
              You have requests awaiting your attention
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingConnections.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Connection Requests ({pendingConnections.length})</h3>
                <div className="space-y-3">
                  {pendingConnections.map((req) => (
                    <div key={req.id} className="rounded-lg border p-3">
                      <div className="mb-3 flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent text-white">
                            {req.requester.firstName[0]}{req.requester.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{req.requester.firstName} {req.requester.lastName}</p>
                          <p className="text-xs text-muted-foreground">{req.requester.accountType}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptConnection(req.id)}
                          disabled={processingRequest === req.id}
                          className="flex-1"
                        >
                          {processingRequest === req.id ? 'Processing...' : 'Accept'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectConnection(req.id)}
                          disabled={processingRequest === req.id}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {groupsWithRequests.filter(g => g._count.joinRequests > 0).length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">
                  Group Join Requests ({groupsWithRequests.reduce((sum, g) => sum + g._count.joinRequests, 0)})
                </h3>
                <div className="space-y-3">
                  {groupsWithRequests.filter(g => g._count.joinRequests > 0).map((group) => (
                    <div key={group.id} className="rounded-lg border p-3">
                      <div className="mb-2">
                        <p className="font-medium">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group._count.joinRequests} pending request{group._count.joinRequests > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link href={`/groups/${group.id}/manage?tab=requests`}>
                        <Button size="sm" variant="outline" className="w-full">
                          View All Requests
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingConnections.length === 0 && groupsWithRequests.filter(g => g._count.joinRequests > 0).length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">All requests have been handled!</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button onClick={() => setShowNotificationDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connection Requests Dialog - shows on login if there are pending requests */}
      <ConnectionRequestsDialog />

      {/* Unread Messages Alert Dialog */}
      <Dialog open={showMessageAlert} onOpenChange={setShowMessageAlert}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MessageCircle className="h-6 w-6 text-accent" />
              You have {unreadMessageCount} unread {unreadMessageCount === 1 ? 'message' : 'messages'}!
            </DialogTitle>
            <DialogDescription>
              Click on any message below to view and reply
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] space-y-3 overflow-y-auto">
            {unreadMessages.map((msg) => (
              <Link key={msg.id} href={`/messages?userId=${msg.sender.id}`} onClick={() => setShowMessageAlert(false)}>
                <div className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-accent text-white">
                      {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {msg.content}
                    </p>
                  </div>
                  <div className="flex h-2 w-2 shrink-0 rounded-full bg-accent" />
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowMessageAlert(false)}>
              Close
            </Button>
            <Link href="/messages">
              <Button className="bg-accent hover:bg-accent/90" onClick={() => setShowMessageAlert(false)}>
                View All Messages
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-[1920px] px-2 sm:px-4 py-2 sm:py-4">
        <div className="grid gap-2 sm:gap-4 lg:grid-cols-12">
          {/* Left Sidebar - Hidden on mobile and tablet */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-20 space-y-2">
              {/* Home */}
              <Link href="/dashboard" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Home</span>
              </Link>

              {/* Help & Support */}
              <Link href="/help-support" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <HeartHandshake className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-semibold text-gray-900">Help & Support</span>
              </Link>

              {/* Community Groups */}
              <div>
                <Link href="/groups" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Community Groups</span>
                </Link>
                {userGroups.filter(g => g._count.joinRequests > 0).map((group) => (
                  <Link 
                    key={group.id}
                    href={`/groups/${group.id}/manage?tab=requests`}
                    className="ml-14 rounded-lg p-2 text-sm hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{group.name}</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {group._count.joinRequests}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </Link>
                ))}
              </div>

              {/* Messages */}
              <Link href="/messages" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Messages</span>
              </Link>

              {/* Discover Community */}
              <Link href="/discover" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <Search className="h-5 w-5 text-orange-600" />
                </div>
                <span className="font-semibold text-gray-900">Discover Community</span>
              </Link>

              {/* Wellbeing & Guidance */}
              <Link href="/wellbeing" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <span className="font-semibold text-gray-900">Wellbeing & Guidance</span>
              </Link>

              {/* Local Services */}
              <Link href="/local-services" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="font-semibold text-gray-900">Local Services</span>
              </Link>

              {/* Alerts & Updates */}
              <Link href="/alerts" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <Bell className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-semibold text-gray-900">Alerts & Updates</span>
              </Link>

              {/* My Profile */}
              <Link href="/profile" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 transition-colors border-t mt-2 pt-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-accent text-sm text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">My Profile</p>
                </div>
              </Link>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 col-span-full">
            {/* Create Post Box */}
            <Card className="mb-2 sm:mb-4 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <h2 className="text-base sm:text-lg font-semibold">Create a Post</h2>
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  {moderationError && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Content Blocked</p>
                          <p>{moderationError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {safetyWarning && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                      <div className="flex items-start gap-2">
                        <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p>{safetyWarning}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent text-white">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder={`What's on your mind, ${user.firstName}?`}
                      value={newPostContent}
                      onChange={(e) => {
                        setNewPostContent(e.target.value);
                        setModerationError(null);
                      }}
                      rows={3}
                      className="flex-1 resize-none"
                    />
                  </div>
                  {/* Media Preview */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Select value={postType} onValueChange={setPostType}>
                          <SelectTrigger className="w-[140px] border-0 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GENERAL">General</SelectItem>
                            <SelectItem value="HELP_REQUEST">Help Request</SelectItem>
                            <SelectItem value="BUSINESS_AD">Business</SelectItem>
                            <SelectItem value="EVENT">Event</SelectItem>
                          </SelectContent>
                        </Select>
                        {userGroups.length > 0 && (
                          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[160px] border-0 text-sm">
                              <SelectValue placeholder="Post to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Everyone</SelectItem>
                              {userGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <ImageIcon className="h-5 w-5 text-green-500" />
                          <span className="hidden sm:inline">Photo</span>
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                      </div>
                      <Button type="submit" disabled={loading || !newPostContent.trim()} size="sm">
                        {loading ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        {post.user.profileImage ? (
                          <Image
                            src={post.user.profileImage}
                            alt={`${post.user.firstName} ${post.user.lastName}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {post.user.firstName[0]}{post.user.lastName[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {post.user.companyName || `${post.user.firstName} ${post.user.lastName}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} at {new Date(post.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                    {post.postType !== "GENERAL" && (
                      <div className="flex items-center gap-1 text-sm">
                        {getPostTypeIcon(post.postType)}
                        <span className="text-muted-foreground">
                          {getPostTypeLabel(post.postType)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Display Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={`mb-4 grid gap-2 ${
                      post.images.length === 1 ? 'grid-cols-1' : 
                      post.images.length === 2 ? 'grid-cols-2' : 
                      post.images.length === 3 ? 'grid-cols-3' : 
                      'grid-cols-2'
                    }`}>
                      {post.images.map((image, index) => (
                        <div key={index} className="relative overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="h-full w-full object-cover"
                            style={{ maxHeight: post.images.length === 1 ? '500px' : '300px' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Display Video */}
                  {post.video && (
                    <div className="mb-4">
                      <video
                        src={post.video}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: '500px' }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={
                        post.likes.some(like => like.userId === user.id)
                          ? "text-accent"
                          : ""
                      }
                    >
                      <Heart
                        className={`mr-1 h-4 w-4 ${
                          post.likes.some(like => like.userId === user.id)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                      {post.likes.length}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)}>
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {post.comments.length}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="mr-1 h-4 w-4" />
                      Share
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setReportingPostId(post.id);
                        setShowReportDialog(true);
                      }}
                      className="ml-auto text-muted-foreground hover:text-red-600"
                    >
                      <Flag className="mr-1 h-4 w-4" />
                      Report
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-accent text-xs text-white">
                              {comment.user.firstName[0]}{comment.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="rounded-lg bg-gray-100 px-3 py-2">
                              <p className="text-sm font-semibold">
                                {comment.user.firstName} {comment.user.lastName}
                              </p>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Comment Form */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-accent text-xs text-white">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-1 gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={commentContent[post.id] || ""}
                            onChange={(e) => setCommentContent({ ...commentContent, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentContent[post.id]?.trim()}
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <aside className="hidden md:block lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Community Groups</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No groups yet. Be the first to create one!
                </p>
                <Button size="sm" onClick={() => setShowCreateGroupDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Safe Space Section */}
          <SafeSpaceSection userId={user.id} />
        </aside>
        </div>
      </div>

      {/* Report Post Dialog */}
      {reportingPostId && (
        <ReportPostDialog
          postId={reportingPostId}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          onReported={() => {
            setReportingPostId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
