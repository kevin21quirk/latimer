"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HeartHandshake,
  AlertCircle,
  Clock,
  CheckCircle,
  MapPin,
  Plus,
  User,
  ArrowLeft,
} from "lucide-react";
import PlatformHeader from "@/components/shared/PlatformHeader";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
};

type HelpRequest = {
  id: string;
  title: string;
  description: string;
  type: string;
  urgency: string;
  status: string;
  location: string | null;
  createdAt: Date;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city?: string;
  };
  helper?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  } | null;
};

export default function HelpSupportClient({
  user,
  myRequests,
  helpingWith,
  nearbyRequests,
}: {
  user: User;
  myRequests: HelpRequest[];
  helpingWith: HelpRequest[];
  nearbyRequests: HelpRequest[];
}) {
  const router = useRouter();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      type: formData.get("type"),
      urgency: formData.get("urgency"),
      location: formData.get("location"),
    };

    try {
      const response = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowRequestDialog(false);
        router.refresh();
      } else {
        alert("Failed to create help request. Please try again.");
      }
    } catch (error) {
      console.error("Error creating help request:", error);
      alert("Error creating help request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfferHelp = async (requestId: string) => {
    try {
      const response = await fetch(`/api/help-requests/${requestId}/offer`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to offer help. Please try again.");
      }
    } catch (error) {
      console.error("Error offering help:", error);
      alert("Error offering help. Please try again.");
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="help-support" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Help & Support</h1>
            <p className="text-muted-foreground">Request help or offer support to your community</p>
          </div>
          <Button onClick={() => setShowRequestDialog(true)} size="lg" className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-5 w-5" />
            Request Help
          </Button>
        </div>

        {/* Create Help Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Help</DialogTitle>
              <DialogDescription>
                Tell your community what you need help with
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <Label htmlFor="title">What do you need help with?</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Need help with grocery shopping"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide more details about what you need..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type of Help</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANIONSHIP">Companionship</SelectItem>
                    <SelectItem value="FOOD_SUPPORT">Food Support</SelectItem>
                    <SelectItem value="TRANSPORT">Transport</SelectItem>
                    <SelectItem value="HOME_HELP">Home Help</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">How urgent is this?</Label>
                <Select name="urgency" defaultValue="MEDIUM">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - Can wait</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Within a week</SelectItem>
                    <SelectItem value="HIGH">High - Within 24 hours</SelectItem>
                    <SelectItem value="URGENT">Urgent - Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Burton Latimer High Street"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? "Creating..." : "Create Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="nearby" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nearby">
              <MapPin className="mr-2 h-4 w-4" />
              Nearby Requests ({nearbyRequests.length})
            </TabsTrigger>
            <TabsTrigger value="my-requests">
              <User className="mr-2 h-4 w-4" />
              My Requests ({myRequests.length})
            </TabsTrigger>
            <TabsTrigger value="helping">
              <HeartHandshake className="mr-2 h-4 w-4" />
              I&apos;m Helping ({helpingWith.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {nearbyRequests.length === 0 ? (
                <div className="col-span-2 py-12 text-center">
                  <HeartHandshake className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No help requests nearby at the moment</p>
                </div>
              ) : (
                nearbyRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-accent text-white">
                              {request.requester?.firstName[0]}{request.requester?.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {request.requester?.firstName} {request.requester?.lastName}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm text-gray-700">{request.description}</p>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                          {getTypeLabel(request.type)}
                        </span>
                        {request.location && (
                          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {request.location}
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleOfferHelp(request.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <HeartHandshake className="mr-2 h-4 w-4" />
                        Offer to Help
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-requests" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {myRequests.length === 0 ? (
                <div className="col-span-2 py-12 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">You haven&apos;t created any help requests yet</p>
                  <Button onClick={() => setShowRequestDialog(true)} className="mt-4">
                    Create Your First Request
                  </Button>
                </div>
              ) : (
                myRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm text-gray-700">{request.description}</p>
                      <div className="mb-3 flex items-center gap-2">
                        {request.status === "OPEN" && (
                          <span className="flex items-center gap-1 text-sm text-blue-600">
                            <Clock className="h-4 w-4" />
                            Waiting for helper
                          </span>
                        )}
                        {request.status === "IN_PROGRESS" && request.helper && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              Being helped by {request.helper.firstName} {request.helper.lastName}
                            </span>
                          </div>
                        )}
                        {request.status === "FULFILLED" && (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="helping" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {helpingWith.length === 0 ? (
                <div className="col-span-2 py-12 text-center">
                  <HeartHandshake className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">You&apos;re not currently helping with any requests</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check the &quot;Nearby Requests&quot; tab to offer help
                  </p>
                </div>
              ) : (
                helpingWith.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent text-white">
                            {request.requester?.firstName[0]}{request.requester?.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{request.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Helping {request.requester?.firstName} {request.requester?.lastName}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm text-gray-700">{request.description}</p>
                      <div className="flex items-center gap-2">
                        {request.status === "IN_PROGRESS" && (
                          <span className="flex items-center gap-1 text-sm text-blue-600">
                            <Clock className="h-4 w-4" />
                            In progress
                          </span>
                        )}
                        {request.status === "FULFILLED" && (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Completed - Thank you!
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
