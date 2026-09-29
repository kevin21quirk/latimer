"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  UserMinus, 
  Ban, 
  Flag, 
  Search,
  Check,
  X,
  MessageCircle,
  Building2,
  Heart,
  Users
} from "lucide-react";
import PlatformHeader from "@/components/shared/PlatformHeader";
import Link from "next/link";

type User = {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
  interests: string[];
};

type RecommendedUser = User & {
  sharedInterests: string[];
  matchScore: number;
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  interests: string[];
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    members: number;
    posts: number;
  };
};

type RecommendedGroup = Group & {
  sharedInterests: string[];
  matchScore: number;
  isPending: boolean;
};

type Connection = {
  id: string;
  status: string;
  requesterId: string;
  addresseeId: string;
  requester: User;
  addressee: User;
};

export default function ContactsClient({
  user,
  connections,
  allUsers,
  userRecommendations,
  groupRecommendations,
}: {
  user: User & { email: string };
  connections: Connection[];
  allUsers: User[];
  userRecommendations: RecommendedUser[];
  groupRecommendations: RecommendedGroup[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportUserId, setReportUserId] = useState<string>("");
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDescription, setReportDescription] = useState("");

  const acceptedConnections = connections.filter(c => c.status === "ACCEPTED");
  const pendingRequests = connections.filter(
    c => c.status === "PENDING" && c.addresseeId === user.id
  );
  const sentRequests = connections.filter(
    c => c.status === "PENDING" && c.requesterId === user.id
  );
  const blockedUsers = connections.filter(c => c.status === "BLOCKED");

  const getConnectionStatus = (userId: string) => {
    return connections.find(
      c => 
        (c.requesterId === user.id && c.addresseeId === userId) ||
        (c.addresseeId === user.id && c.requesterId === userId)
    );
  };

  const filteredUsers = allUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const individuals = filteredUsers.filter(u => u.accountType === "INDIVIDUAL");
  const companies = filteredUsers.filter(u => u.accountType === "COMPANY");
  const charities = filteredUsers.filter(u => u.accountType === "CHARITY");

  const handleSendRequest = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: userId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user?")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/connections/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (connectionId: string) => {
    if (!confirm("Are you sure you want to unblock this user?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;

    setLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId: reportUserId,
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (response.ok) {
        setShowReportDialog(false);
        setReportUserId("");
        setReportReason("");
        setReportDescription("");
        alert("Report submitted successfully. An admin will review it.");
      }
    } catch (error) {
      console.error("Error reporting user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="contacts" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your connections and find new people</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Search Users */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Search People</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {searchQuery ? (
                <Tabs defaultValue="individuals" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="individuals" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Individuals ({individuals.length})
                    </TabsTrigger>
                    <TabsTrigger value="companies" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Companies ({companies.length})
                    </TabsTrigger>
                    <TabsTrigger value="charities" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Charities ({charities.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="individuals" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {individuals.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No individuals found</p>
                      ) : (
                        individuals.map((u) => {
                    const connection = getConnectionStatus(u.id);
                    const isBlocked = connection?.status === "BLOCKED";
                    const isPending = connection?.status === "PENDING";
                    const isConnected = connection?.status === "ACCEPTED";

                    return (
                      <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-accent text-white">
                              {u.firstName[0]}{u.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{u.accountType}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isBlocked ? (
                            <span className="text-sm text-red-600">Blocked</span>
                          ) : isConnected ? (
                            <>
                              <Link href={`/messages?userId=${u.id}`}>
                                <Button size="sm" variant="outline">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBlockUser(u.id)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          ) : isPending ? (
                            <span className="text-sm text-muted-foreground">Pending</span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(u.id)}
                              disabled={loading}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Connect
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReportUserId(u.id);
                              setShowReportDialog(true);
                            }}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="companies" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {companies.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No companies found</p>
                      ) : (
                        companies.map((u) => {
                          const connection = getConnectionStatus(u.id);
                          const isBlocked = connection?.status === "BLOCKED";
                          const isPending = connection?.status === "PENDING";
                          const isConnected = connection?.status === "ACCEPTED";

                          return (
                            <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-blue-500 text-white">
                                    <Building2 className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{u.accountType}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {isBlocked ? (
                                  <span className="text-sm text-red-600">Blocked</span>
                                ) : isConnected ? (
                                  <>
                                    <Link href={`/messages?userId=${u.id}`}>
                                      <Button size="sm" variant="outline">
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleBlockUser(u.id)}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : isPending ? (
                                  <span className="text-sm text-muted-foreground">Pending</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendRequest(u.id)}
                                    disabled={loading}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReportUserId(u.id);
                                    setShowReportDialog(true);
                                  }}
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="charities" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {charities.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No charities found</p>
                      ) : (
                        charities.map((u) => {
                          const connection = getConnectionStatus(u.id);
                          const isBlocked = connection?.status === "BLOCKED";
                          const isPending = connection?.status === "PENDING";
                          const isConnected = connection?.status === "ACCEPTED";

                          return (
                            <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-pink-500 text-white">
                                    <Heart className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{u.accountType}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {isBlocked ? (
                                  <span className="text-sm text-red-600">Blocked</span>
                                ) : isConnected ? (
                                  <>
                                    <Link href={`/messages?userId=${u.id}`}>
                                      <Button size="sm" variant="outline">
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleBlockUser(u.id)}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : isPending ? (
                                  <span className="text-sm text-muted-foreground">Pending</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendRequest(u.id)}
                                    disabled={loading}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReportUserId(u.id);
                                    setShowReportDialog(true);
                                  }}
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-sm">Start typing to search for people</p>
                  <p className="mt-2 text-xs">Or check out recommendations below based on your interests</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Requests ({pendingRequests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.map((conn) => {
                      const requester = conn.requester;
                      return (
                        <div key={conn.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-accent text-xs text-white">
                                {requester.firstName[0]}{requester.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold">
                              {requester.firstName} {requester.lastName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(conn.id)}
                              disabled={loading}
                              className="flex-1"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(conn.id)}
                              disabled={loading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended for You ({userRecommendations.length + groupRecommendations.length})</CardTitle>
                <p className="text-xs text-muted-foreground">Based on shared interests</p>
              </CardHeader>
              <CardContent>
                {userRecommendations.length === 0 && groupRecommendations.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No recommendations yet. Add interests to your profile to get personalized recommendations!
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your interests: {user.interests.length > 0 ? user.interests.join(", ") : "None set"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {groupRecommendations.map((rec) => (
                        <div key={rec.id} className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-purple-500 text-xs text-white">
                                <Users className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{rec.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {rec.sharedInterests.length} shared interest{rec.sharedInterests.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="mb-2 flex flex-wrap gap-1">
                            {rec.sharedInterests.slice(0, 3).map((interest: string, idx: number) => (
                              <span key={idx} className="rounded-full bg-purple-200 px-2 py-0.5 text-xs text-purple-800">
                                {interest}
                              </span>
                            ))}
                            {rec.sharedInterests.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{rec.sharedInterests.length - 3} more
                              </span>
                            )}
                          </div>
                          {rec.isPending ? (
                            <p className="text-center text-xs text-muted-foreground">Request Pending</p>
                          ) : (
                            <Link href={`/groups`}>
                              <Button size="sm" className="w-full">
                                <UserPlus className="mr-2 h-3 w-3" />
                                View Group
                              </Button>
                            </Link>
                          )}
                        </div>
                      ))}
                      {userRecommendations.map((rec) => {
                        const connection = getConnectionStatus(rec.id);
                        const isConnected = connection?.status === "ACCEPTED";
                        const isPending = connection?.status === "PENDING";

                        return (
                          <div key={rec.id} className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-accent text-xs text-white">
                                  {rec.firstName[0]}{rec.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  {rec.firstName} {rec.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {rec.sharedInterests.length} shared interest{rec.sharedInterests.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="mb-2 flex flex-wrap gap-1">
                              {rec.sharedInterests.slice(0, 3).map((interest, idx) => (
                                <span key={idx} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                  {interest}
                                </span>
                              ))}
                              {rec.sharedInterests.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{rec.sharedInterests.length - 3} more
                                </span>
                              )}
                            </div>
                            {!isConnected && !isPending && (
                              <Button
                                size="sm"
                                onClick={() => handleSendRequest(rec.id)}
                                disabled={loading}
                                className="w-full"
                              >
                                <UserPlus className="mr-2 h-3 w-3" />
                                Connect
                              </Button>
                            )}
                            {isPending && (
                              <p className="text-center text-xs text-muted-foreground">Request Pending</p>
                            )}
                            {isConnected && (
                              <p className="text-center text-xs text-green-600">Connected</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* My Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Connections ({acceptedConnections.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {acceptedConnections.map((conn) => {
                      const contact = conn.requesterId === user.id ? conn.addressee : conn.requester;
                      return (
                        <div key={conn.id} className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-accent text-xs text-white">
                              {contact.firstName[0]}{contact.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Blocked Users */}
            {blockedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Blocked Users ({blockedUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {blockedUsers.map((conn) => {
                      const blocked = conn.requesterId === user.id ? conn.addressee : conn.requester;
                      return (
                        <div key={conn.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-400 text-xs text-white">
                                {blocked.firstName[0]}{blocked.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold">
                              {blocked.firstName} {blocked.lastName}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblockUser(conn.id)}
                            disabled={loading}
                            className="w-full"
                          >
                            <UserPlus className="mr-2 h-3 w-3" />
                            Unblock
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please provide details about why you&apos;re reporting this user
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportUser} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="HARASSMENT">Harassment</SelectItem>
                  <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate Content</SelectItem>
                  <SelectItem value="FAKE_ACCOUNT">Fake Account</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Additional Details (Optional)</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more information..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReportDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !reportReason}>
                Submit Report
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
