"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Search,
  Menu,
  MessageSquare,
  Send,
  Shield,
  UserCircle,
  HelpCircle,
  Bookmark,
  Clock,
  Heart,
} from "lucide-react";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profileImage: string | null;
};

type MessageUser = {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  read: boolean;
  createdAt: string;
  sender: MessageUser;
};

export default function PlatformHeader({ user, currentPage = "dashboard" }: { user: User; currentPage?: string }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<MessageUser | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState("");

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
        setRecentMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/messages/unread')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setUnreadCount(data.count);
          setRecentMessages(data.messages);
        }
      })
      .catch((error) => console.error('Error fetching unread messages:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  const openMessagePopup = async (message: Message) => {
    setSelectedConversation(message.sender);
    setShowMessageDialog(true);
    
    // Fetch full conversation with this user
    try {
      const response = await fetch(`/api/messages?userId=${message.senderId}`);
      if (response.ok) {
        const messages = await response.json();
        setConversationMessages(messages);
      }
      
      // Mark messages as read
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: message.senderId }),
      });
      
      // Refresh unread count
      fetchUnreadMessages();
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content: replyMessage,
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setConversationMessages([...conversationMessages, newMsg]);
        setReplyMessage("");
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleLogout = async () => {
    // Clear notification flags from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('notification_shown_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-gray-300 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1920px] items-center justify-between px-4">
          <div className="flex items-center gap-2 lg:w-80">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative h-10 w-10">
                <Image
                  src="/logos/BL-Connect-Trans.png"
                  alt="BL Connect"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          </div>
          <nav className="flex items-center justify-center gap-2">
            <div className="h-12 w-20" />
            <div className="h-12 w-20" />
            <div className="h-12 w-20" />
          </nav>
          <div className="flex items-center gap-2 lg:w-80 lg:justify-end">
            <div className="h-10 w-10" />
            <div className="h-10 w-10" />
            <div className="h-10 w-10" />
            {user.accountType === "INDIVIDUAL" && user.email === "kevin.s.quirk@gmail.com" && (
              <div className="h-10 w-10" />
            )}
            <div className="h-10 w-10" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 border-b border-gray-300 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1920px] items-center justify-between px-2 sm:px-4 gap-1 sm:gap-2">
          {/* Left: Logo and Search */}
          <div className="flex items-center gap-1 sm:gap-2 lg:w-80 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative h-10 w-10">
                <Image
                  src="/logos/BL-Connect-Trans.png"
                  alt="BL Connect"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search Burton Latimer Connect"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-60 rounded-full bg-gray-100 pl-10 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Center: Navigation Icons */}
          <nav className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-10 w-10 sm:h-12 sm:w-16 md:w-20 rounded-lg hover:bg-gray-100 ${currentPage === 'dashboard' ? 'border-b-4 border-accent' : ''}`}
                  >
                    <Home className={`h-5 w-5 sm:h-6 sm:w-6 ${currentPage === 'dashboard' ? 'text-accent' : 'text-gray-600'}`} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/groups">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-10 w-10 sm:h-12 sm:w-16 md:w-20 rounded-lg hover:bg-gray-100 ${currentPage === 'groups' ? 'border-b-4 border-accent' : ''}`}
                  >
                    <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${currentPage === 'groups' ? 'text-accent' : 'text-gray-600'}`} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Groups</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/contacts">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-10 w-10 sm:h-12 sm:w-16 md:w-20 rounded-lg hover:bg-gray-100 ${currentPage === 'contacts' ? 'border-b-4 border-accent' : ''}`}
                  >
                    <UserCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${currentPage === 'contacts' ? 'text-accent' : 'text-gray-600'}`} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Contacts</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/messages">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`relative h-10 w-10 sm:h-12 sm:w-16 md:w-20 rounded-lg hover:bg-gray-100 ${currentPage === 'messages' ? 'border-b-4 border-accent' : ''}`}
                  >
                    <MessageCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${currentPage === 'messages' ? 'text-accent' : 'text-gray-600'}`} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Messages</p>
              </TooltipContent>
            </Tooltip>
          </nav>

          {/* Right: User Menu and Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:w-80 lg:justify-end flex-shrink-0">
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 lg:flex">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Menu</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-1">
                  <h3 className="mb-3 font-semibold">Menu</h3>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">View your profile</p>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        <Home className="h-5 w-5" />
                      </div>
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/groups">
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        <Users className="h-5 w-5" />
                      </div>
                      <span>Groups</span>
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <span>Messages</span>
                    </Button>
                  </Link>
                  <div className="my-2 border-t" />
                  <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hidden h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 lg:flex">
                      <MessageSquare className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Messenger</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-96">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Messages</h3>
                    <Link href="/messages">
                      <Button variant="ghost" size="sm">See all</Button>
                    </Link>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {recentMessages.length > 0 ? (
                        recentMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            onClick={() => openMessagePopup(msg)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start gap-3 rounded-lg p-3 hover:bg-gray-100">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-accent text-white">
                                  {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-sm">
                                  {msg.sender.firstName} {msg.sender.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {msg.content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(msg.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {!msg.read && (
                                <div className="h-2 w-2 rounded-full bg-accent" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
                          <p className="text-sm">No messages yet</p>
                          <Link href="/messages">
                            <Button variant="link" size="sm">Start a conversation</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 hover:bg-gray-200">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-96">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <Button variant="ghost" size="sm">Mark all as read</Button>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                        <p className="text-xs mt-1">We&apos;ll notify you when something happens</p>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            {user.accountType === "INDIVIDUAL" && user.email === "kevin.s.quirk@gmail.com" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin">
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 hover:bg-gray-200">
                      <Shield className="h-5 w-5 text-accent" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Admin Dashboard</p>
                </TooltipContent>
              </Tooltip>
            )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer border-2 border-transparent hover:border-gray-300">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={`${user.firstName} ${user.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-accent text-sm font-semibold text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-accent text-white">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    {/* Message Popup Dialog */}
    <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
      <DialogContent className="max-w-2xl max-h-[600px]">
        <DialogHeader>
          <DialogTitle>
            {selectedConversation && (
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback className="bg-accent text-white">
                    {selectedConversation.firstName[0]}{selectedConversation.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedConversation.firstName} {selectedConversation.lastName}</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {conversationMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.senderId === user.id
                      ? 'bg-accent text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-white/70' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendReply} className="flex gap-2 border-t pt-4">
          <Input
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1"
          />
          <Button type="submit" disabled={!replyMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}
