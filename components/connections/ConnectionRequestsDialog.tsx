"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Check, X } from "lucide-react";
import Image from "next/image";

type ConnectionRequest = {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    accountType: string;
    profileImage: string | null;
    companyName: string | null;
    charityName: string | null;
  };
};

export default function ConnectionRequestsDialog() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/connections/pending');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
        if (data.length > 0) {
          setOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (response.ok) {
        setRequests(requests.filter(r => r.id !== connectionId));
        alert('Connection accepted! You can now message this person.');
      } else {
        alert('Failed to accept connection request.');
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection request.');
    }
  };

  const handleDecline = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRequests(requests.filter(r => r.id !== connectionId));
      } else {
        alert('Failed to decline connection request.');
      }
    } catch (error) {
      console.error('Error declining connection:', error);
      alert('Failed to decline connection request.');
    }
  };

  if (loading || requests.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            Connection Requests
          </DialogTitle>
          <DialogDescription>
            {requests.length} {requests.length === 1 ? 'person wants' : 'people want'} to connect with you
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Avatar className="h-12 w-12">
                  {request.requester.profileImage ? (
                    <Image
                      src={request.requester.profileImage}
                      alt={`${request.requester.firstName} ${request.requester.lastName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {request.requester.firstName[0]}
                      {request.requester.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">
                    {request.requester.firstName} {request.requester.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.requester.accountType === "COMPANY" && request.requester.companyName
                      ? request.requester.companyName
                      : request.requester.accountType === "CHARITY" && request.requester.charityName
                      ? request.requester.charityName
                      : request.requester.accountType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(request.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
