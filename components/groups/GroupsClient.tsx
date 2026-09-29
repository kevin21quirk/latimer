"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Users, Lock, Globe, Settings } from "lucide-react";
import PlatformHeader from "@/components/shared/PlatformHeader";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  createdAt: Date;
  status?: string;
  members: { userId: string; role: string }[];
  _count: {
    members: number;
    posts: number;
  };
};

type UserGroup = {
  id: string;
  role: string;
  joinedAt: Date;
  group: Group;
};

type CreatedGroup = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  status: string;
  createdAt: Date;
  _count: {
    members: number;
    posts: number;
  };
};

export default function GroupsClient({
  user,
  groups,
  userGroups,
  createdGroups,
}: {
  user: User;
  groups: Group[];
  userGroups: UserGroup[];
  createdGroups: CreatedGroup[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allGroups, setAllGroups] = useState(groups);

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

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
        const result = await response.json();
        form.reset();
        setOpen(false);
        alert("Group created successfully! It will appear once an admin approves it.");
      } else {
        alert("Failed to create group. Please try again.");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error creating group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });

      if (response.ok) {
        setAllGroups(
          allGroups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  members: [...group.members, { userId: user.id, role: "member" }],
                  _count: { ...group._count, members: group._count.members + 1 },
                }
              : group
          )
        );
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      });

      if (response.ok) {
        setAllGroups(
          allGroups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  members: group.members.filter((m) => m.userId !== user.id),
                  _count: { ...group._count, members: group._count.members - 1 },
                }
              : group
          )
        );
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const isMember = (group: Group) => group.members.some((m) => m.userId === user.id);

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="groups" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Community Groups</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Groups</TabsTrigger>
            <TabsTrigger value="my-groups">
              My Groups ({createdGroups.filter(g => g.status !== "REJECTED").length + userGroups.filter(ug => !createdGroups.some(cg => cg.id === ug.group.id)).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {allGroups.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-semibold">No groups available yet</p>
                <p className="text-muted-foreground">
                  Be the first to create a community group! Click &quot;Create Group&quot; above to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allGroups.map((group) => (
                  <Card key={group.id}>
                  <CardHeader>
                    <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-accent overflow-hidden">
                      {group.image ? (
                        <img src={group.image} alt={group.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-12 w-12 text-accent-foreground" />
                      )}
                    </div>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.isPrivate ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      {group.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
                      <span>{group._count.members} members</span>
                      <span>{group._count.posts} posts</span>
                    </div>
                    {isMember(group) ? (
                      <div className="space-y-2">
                        <Badge className="w-full justify-center">Member</Badge>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          Leave Group
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleJoinGroup(group.id)}
                      >
                        Join Group
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-groups">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Created Groups (exclude rejected) */}
              {createdGroups.filter(g => g.status !== "REJECTED").map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-accent overflow-hidden">
                      {group.image ? (
                        <img src={group.image} alt={group.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-12 w-12 text-accent-foreground" />
                      )}
                    </div>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.isPrivate ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      {group.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
                      <span>{group._count.members} members</span>
                      <span>{group._count.posts} posts</span>
                    </div>
                    <div className="space-y-2">
                      <Badge 
                        variant={group.status === "PENDING" ? "default" : group.status === "APPROVED" ? "secondary" : "destructive"}
                        className="w-full justify-center"
                      >
                        {group.status === "PENDING" ? "⏳ Pending Admin Approval" : group.status === "APPROVED" ? "✓ Approved" : "✗ Rejected"}
                      </Badge>
                      <Badge variant="outline" className="w-full justify-center">
                        Creator (Admin)
                      </Badge>
                      {group.status === "APPROVED" && (
                        <Link href={`/groups/${group.id}/manage`}>
                          <Button variant="default" className="w-full">
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Group
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Joined Groups (exclude created groups to avoid duplicates) */}
              {userGroups.filter(ug => !createdGroups.some(cg => cg.id === ug.group.id)).map((userGroup) => (
                <Card key={userGroup.id}>
                  <CardHeader>
                    <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-accent overflow-hidden">
                      {userGroup.group.image ? (
                        <img src={userGroup.group.image} alt={userGroup.group.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-12 w-12 text-accent-foreground" />
                      )}
                    </div>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{userGroup.group.name}</CardTitle>
                      {userGroup.group.isPrivate ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      {userGroup.group.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
                      <span>{userGroup.group._count.members} members</span>
                      <span>{userGroup.group._count.posts} posts</span>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-full justify-center">
                        {userGroup.role}
                      </Badge>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleLeaveGroup(userGroup.group.id)}
                      >
                        Leave Group
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {userGroups.filter(ug => !createdGroups.some(cg => cg.id === ug.group.id)).length === 0 && createdGroups.filter(g => g.status !== "REJECTED").length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    You haven&apos;t created or joined any groups yet. Browse all groups to find communities
                    that interest you, or create your own!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
