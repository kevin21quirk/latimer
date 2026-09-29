"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Settings, Users, UserX, UserCheck, Trash2, Upload } from "lucide-react";
import PlatformHeader from "@/components/shared/PlatformHeader";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
};

type Member = {
  id: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
  };
};

type JoinRequest = {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
  };
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  status: string;
  createdAt: Date;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  members: Member[];
  joinRequests: JoinRequest[];
};

export default function GroupManageClient({ user, group }: { user: User; group: Group }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(group.description || "");
  const [isPrivate, setIsPrivate] = useState(group.isPrivate);
  const [groupImage, setGroupImage] = useState(group.image);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "requests") {
      setActiveTab("requests");
    }
  }, [searchParams]);

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert image to base64 if a new file was selected
      let imageData = groupImage;
      if (selectedFile) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          isPrivate,
          image: imageData,
        }),
      });

      if (response.ok) {
        alert("Group updated successfully!");
        setSelectedFile(null);
        router.refresh();
      } else {
        alert("Failed to update group");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Error updating group");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Error removing member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="groups" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Group: {group.name}</h1>
          <p className="text-muted-foreground">Edit group details and manage members</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="members">Members ({group.members.length})</TabsTrigger>
            <TabsTrigger value="requests">Join Requests ({group.joinRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
                <CardDescription>Update your group information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateGroup} className="space-y-4">
                  <div>
                    <Label>Group Image</Label>
                    <div className="mt-2">
                      <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-lg bg-accent">
                        {selectedFile ? (
                          <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-full w-full rounded-lg object-cover" />
                        ) : groupImage ? (
                          <img src={groupImage} alt={group.name} className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <Users className="h-16 w-16 text-accent-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                            }
                          }}
                          className="max-w-xs"
                        />
                        {selectedFile && (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedFile(null);
                              const input = document.getElementById("image") as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Recommended: Square image, at least 400x400px. Click &quot;Save Changes&quot; to upload.
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isPrivate" className="cursor-pointer">
                      Make this group private
                    </Label>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>Manage your group members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent text-white">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                        <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                          {member.role}
                        </Badge>
                      </div>
                      {member.user.id !== group.creator.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.id, `${member.user.firstName} ${member.user.lastName}`)}
                          disabled={loading}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  {group.members.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>No members yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Join Requests</CardTitle>
                <CardDescription>Approve or reject users who want to join your group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.joinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent text-white">
                            {request.user.firstName[0]}{request.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.user.firstName} {request.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{request.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={loading}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {group.joinRequests.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>No pending join requests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
