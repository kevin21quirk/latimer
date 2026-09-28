"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  UserPlus,
  Users,
  Building2,
  Heart,
  Sparkles
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
  companyName: string | null;
  charityName: string | null;
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  interests: string[];
  _count: {
    members: number;
    posts: number;
  };
};

export default function DiscoverClient({
  user,
  allUsers,
  allGroups,
}: {
  user: User & { email: string };
  allUsers: User[];
  allGroups: Group[];
}) {
  const router = useRouter();
  const [interestSearch, setInterestSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter by interest search
  const filteredUsers = interestSearch
    ? allUsers.filter((u) =>
        u.interests.some((interest) =>
          interest.toLowerCase().includes(interestSearch.toLowerCase())
        )
      )
    : [];

  const filteredGroups = interestSearch
    ? allGroups.filter((g) =>
        g.interests.some((interest) =>
          interest.toLowerCase().includes(interestSearch.toLowerCase())
        )
      )
    : [];

  // Get recommendations based on user's interests
  const recommendedUsers = allUsers
    .map((u) => {
      const sharedInterests = u.interests.filter((interest) =>
        user.interests?.includes(interest)
      );
      return {
        ...u,
        sharedInterests,
        matchScore: sharedInterests.length,
      };
    })
    .filter((u) => u.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  const recommendedGroups = allGroups
    .map((g) => {
      const sharedInterests = g.interests.filter((interest) =>
        user.interests?.includes(interest)
      );
      return {
        ...g,
        sharedInterests,
        matchScore: sharedInterests.length,
      };
    })
    .filter((g) => g.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  const handleJoinGroup = async (groupId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error joining group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId: string) => {
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

  const individuals = filteredUsers.filter((u) => u.accountType === "INDIVIDUAL");
  const companies = filteredUsers.filter((u) => u.accountType === "COMPANY");
  const charities = filteredUsers.filter((u) => u.accountType === "CHARITY");

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="discover" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground">Find people, groups, and organisations that match your interests</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interest Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search by Interest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g., Gardening, Cooking, Sports..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="mb-4"
                />

                {interestSearch && (
                  <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="users">
                        People ({filteredUsers.length})
                      </TabsTrigger>
                      <TabsTrigger value="groups">
                        Groups ({filteredGroups.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="mt-4">
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="all">All ({filteredUsers.length})</TabsTrigger>
                          <TabsTrigger value="individuals">Individuals ({individuals.length})</TabsTrigger>
                          <TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger>
                          <TabsTrigger value="charities">Charities ({charities.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                              {filteredUsers.map((u) => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback className="bg-accent text-white">
                                        {u.firstName[0]}{u.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">
                                        {u.accountType === "COMPANY" && u.companyName ? u.companyName : 
                                         u.accountType === "CHARITY" && u.charityName ? u.charityName :
                                         `${u.firstName} ${u.lastName}`}
                                      </p>
                                      <p className="text-sm text-muted-foreground">{u.accountType}</p>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {u.interests.slice(0, 3).map((interest, idx) => (
                                          <span key={idx} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                            {interest}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <Button size="sm" onClick={() => handleConnect(u.id)} disabled={loading}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="individuals">
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                              {individuals.map((u) => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback className="bg-accent text-white">
                                        {u.firstName[0]}{u.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{u.firstName} {u.lastName}</p>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {u.interests.slice(0, 3).map((interest, idx) => (
                                          <span key={idx} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                            {interest}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <Button size="sm" onClick={() => handleConnect(u.id)} disabled={loading}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="companies">
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                              {companies.map((u) => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback className="bg-blue-500 text-white">
                                        <Building2 className="h-5 w-5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{u.companyName || `${u.firstName} ${u.lastName}`}</p>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {u.interests.slice(0, 3).map((interest, idx) => (
                                          <span key={idx} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                            {interest}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <Button size="sm" onClick={() => handleConnect(u.id)} disabled={loading}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="charities">
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                              {charities.map((u) => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback className="bg-pink-500 text-white">
                                        <Heart className="h-5 w-5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{u.charityName || `${u.firstName} ${u.lastName}`}</p>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {u.interests.slice(0, 3).map((interest, idx) => (
                                          <span key={idx} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                            {interest}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <Button size="sm" onClick={() => handleConnect(u.id)} disabled={loading}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Connect
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </TabsContent>

                    <TabsContent value="groups" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {filteredGroups.map((g) => (
                            <div key={g.id} className="rounded-lg border p-4">
                              <div className="mb-2 flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-purple-500 text-white">
                                    <Users className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-semibold">{g.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {g._count.members} members • {g._count.posts} posts
                                  </p>
                                </div>
                              </div>
                              {g.description && (
                                <p className="mb-2 text-sm text-muted-foreground">{g.description}</p>
                              )}
                              <div className="mb-3 flex flex-wrap gap-1">
                                {g.interests.slice(0, 5).map((interest, idx) => (
                                  <span key={idx} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                              <Button size="sm" onClick={() => handleJoinGroup(g.id)} disabled={loading} className="w-full">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Join Group
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                )}

                {!interestSearch && (
                  <div className="py-8 text-center text-muted-foreground">
                    <Sparkles className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                    <p>Enter an interest to discover people and groups</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recommendations */}
          <div className="space-y-6">
            {/* Recommended People */}
            {recommendedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended People</CardTitle>
                  <p className="text-xs text-muted-foreground">Based on your interests</p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recommendedUsers.map((rec) => (
                        <div key={rec.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-accent text-xs text-white">
                                {rec.firstName[0]}{rec.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">
                                {rec.accountType === "COMPANY" && rec.companyName ? rec.companyName :
                                 rec.accountType === "CHARITY" && rec.charityName ? rec.charityName :
                                 `${rec.firstName} ${rec.lastName}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {rec.sharedInterests.length} shared interest{rec.sharedInterests.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="mb-2 flex flex-wrap gap-1">
                            {rec.sharedInterests.slice(0, 2).map((interest, idx) => (
                              <span key={idx} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                {interest}
                              </span>
                            ))}
                          </div>
                          <Button size="sm" onClick={() => handleConnect(rec.id)} disabled={loading} className="w-full">
                            <UserPlus className="mr-2 h-3 w-3" />
                            Connect
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Recommended Groups */}
            {recommendedGroups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Groups</CardTitle>
                  <p className="text-xs text-muted-foreground">Based on your interests</p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recommendedGroups.map((rec) => (
                        <div key={rec.id} className="rounded-lg border p-3">
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
                            {rec.sharedInterests.slice(0, 2).map((interest, idx) => (
                              <span key={idx} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                {interest}
                              </span>
                            ))}
                          </div>
                          <Button size="sm" onClick={() => handleJoinGroup(rec.id)} disabled={loading} className="w-full">
                            <UserPlus className="mr-2 h-3 w-3" />
                            Join Group
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Your Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Interests</CardTitle>
              </CardHeader>
              <CardContent>
                {user.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, idx) => (
                      <span key={idx} className="rounded-full bg-accent px-3 py-1 text-sm text-white">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No interests set</p>
                    <Link href="/profile">
                      <Button size="sm" variant="outline" className="mt-2">
                        Add Interests
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
