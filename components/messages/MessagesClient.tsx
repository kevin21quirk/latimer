"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Send, Plus, Search } from "lucide-react";
import PlatformHeader from "@/components/shared/PlatformHeader";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
  companyName?: string | null;
  charityName?: string | null;
};

type Message = {
  id: string;
  content: string;
  read: boolean;
  createdAt: Date;
  senderId: string;
  receiverId: string;
  sender: User;
  receiver: User;
};

export default function MessagesClient({
  user,
  conversations,
  users,
}: {
  user: User;
  conversations: Message[];
  users: (User & { accountType: string })[];
}) {
  const searchParams = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(conversations);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState<string>("");
  const [composeMessage, setComposeMessage] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setSelectedUser(userId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedUser) {
      markMessagesAsRead(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!conversationSearchQuery || conversationSearchQuery.trim().length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(conversationSearchQuery)}`
        );
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [conversationSearchQuery]);

  const markMessagesAsRead = async (senderId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      });
      
      // Update local state to mark messages as read
      setMessages(messages.map(msg => 
        msg.senderId === senderId && msg.receiverId === user.id
          ? { ...msg, read: true }
          : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const conversationUsers = Array.from(
    new Map(
      messages.map((msg) => {
        const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender;
        return [otherUser.id, otherUser];
      })
    ).values()
  );

  // Show search results if searching, otherwise show existing conversations
  const displayUsers = conversationSearchQuery.length >= 1 
    ? searchResults 
    : conversationUsers;

  const selectedMessages = selectedUser
    ? messages.filter(
        (msg) =>
          (msg.senderId === user.id && msg.receiverId === selectedUser) ||
          (msg.senderId === selectedUser && msg.receiverId === user.id)
      )
    : [];

  const filteredUsers = users.filter((u) => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(searchLower) ||
      u.lastName.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.accountType.toLowerCase().includes(searchLower)
    );
  });

  const handleComposeMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeMessage.trim() || !composeRecipient) return;

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: composeRecipient,
          content: composeMessage,
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages([...messages, newMsg]);
        setComposeMessage("");
        setComposeRecipient("");
        setShowComposeDialog(false);
        setSelectedUser(composeRecipient);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser,
          content: newMessage,
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformHeader user={user} currentPage="messages" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Messages</CardTitle>
              {mounted && <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Compose New Message</DialogTitle>
                    <DialogDescription>
                      Select a recipient and write your message
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleComposeMessage} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Search Users:</label>
                      <Input
                        placeholder="Search by name, email, or account type..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="mb-3"
                      />
                      <label className="mb-2 block text-sm font-medium">Select Recipient:</label>
                      <ScrollArea className="h-[200px] rounded-md border">
                        <div className="p-2 space-y-1">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setComposeRecipient(u.id);
                                  setUserSearchQuery("");
                                }}
                                className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-muted ${
                                  composeRecipient === u.id ? "bg-muted border-2 border-primary" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                                      {u.firstName[0]}{u.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {u.firstName} {u.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {u.accountType}{u.email ? ` • ${u.email}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                              No users found
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      {composeRecipient && (
                        <p className="mt-2 text-sm text-green-600">
                          ✓ Selected: {filteredUsers.find(u => u.id === composeRecipient)?.firstName} {filteredUsers.find(u => u.id === composeRecipient)?.lastName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Message:</label>
                      <Textarea
                        value={composeMessage}
                        onChange={(e) => setComposeMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={5}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowComposeDialog(false);
                          setComposeMessage("");
                          setComposeRecipient("");
                          setUserSearchQuery("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send Message"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>}
            </CardHeader>
            <CardContent>
              {/* Search Conversations */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search People, Businesses, Charities"
                    value={conversationSearchQuery}
                    onChange={(e) => setConversationSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {/* Search Results or Existing Conversations */}
              {conversationSearchQuery.length >= 1 ? (
                <ScrollArea className="h-[550px]">
                  <div className="space-y-2">
                    {isSearching ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Searching...
                      </p>
                    ) : displayUsers.length > 0 ? (
                      displayUsers.map((foundUser) => (
                        <button
                          key={foundUser.id}
                          onClick={async () => {
                            // Send connection request
                            try {
                              const response = await fetch('/api/connections', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ addresseeId: foundUser.id }),
                              });
                              
                              if (response.ok) {
                                alert(`Connection request sent to ${foundUser.firstName} ${foundUser.lastName}! They will be notified and can accept or decline your request.`);
                                setConversationSearchQuery("");
                              } else {
                                const error = await response.json();
                                if (error.error === "Connection already exists") {
                                  alert(`You already have a connection request with ${foundUser.firstName} ${foundUser.lastName}.`);
                                } else {
                                  alert('Failed to send connection request. Please try again.');
                                }
                              }
                            } catch (error) {
                              console.error('Error sending connection request:', error);
                              alert('Failed to send connection request. Please try again.');
                            }
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted ${
                            selectedUser === foundUser.id ? "bg-muted" : ""
                          }`}
                        >
                          <Avatar>
                            <AvatarFallback className="bg-accent text-accent-foreground">
                              {foundUser.firstName[0]}
                              {foundUser.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {foundUser.firstName} {foundUser.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {foundUser.accountType === "COMPANY" && foundUser.companyName
                                ? foundUser.companyName
                                : foundUser.accountType === "CHARITY" && foundUser.charityName
                                ? foundUser.charityName
                                : foundUser.accountType}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No people, businesses, or charities found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              ) : conversationUsers.length > 0 ? (
                <ScrollArea className="h-[550px]">
                  <div className="space-y-2">
                    {conversationUsers.map((convUser) => (
                      <button
                        key={convUser.id}
                        onClick={() => setSelectedUser(convUser.id)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted ${
                          selectedUser === convUser.id ? "bg-muted" : ""
                        }`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {convUser.firstName[0]}
                            {convUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {convUser.firstName} {convUser.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click to view messages
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="mb-2">No conversations yet</p>
                  <p className="text-sm">Search for people to start chatting</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader>
              {selectedUser && (
                <CardTitle>
                  {(() => {
                    const selectedUserData =
                      conversationUsers.find((u) => u.id === selectedUser) ||
                      users.find((u) => u.id === selectedUser);
                    return selectedUserData
                      ? `${selectedUserData.firstName} ${selectedUserData.lastName}`
                      : "Select a conversation";
                  })()}
                </CardTitle>
              )}
              {!selectedUser && <CardTitle>Select a conversation</CardTitle>}
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {selectedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.senderId === user.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderId === user.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`mt-1 text-xs ${
                                msg.senderId === user.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {selectedMessages.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      )}
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex h-[500px] items-center justify-center">
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
