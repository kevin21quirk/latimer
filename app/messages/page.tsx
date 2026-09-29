import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MessagesClient from "@/components/messages/MessagesClient";

export default async function MessagesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      accountType: true,
      profileImage: true,
      isAdmin: true,
    },
  });

  const conversations = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.userId },
        { receiverId: session.userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          accountType: true,
          profileImage: true,
        },
      },
      receiver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          accountType: true,
          profileImage: true,
        },
      },
    },
  });

  // Get only connected users (accepted connections)
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: session.userId, status: "ACCEPTED" },
        { addresseeId: session.userId, status: "ACCEPTED" },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          accountType: true,
        },
      },
      addressee: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          accountType: true,
        },
      },
    },
  });

  // Extract connected users (the other person in each connection)
  const users = connections.map(conn => 
    conn.requesterId === session.userId ? conn.addressee : conn.requester
  );

  if (!user) {
    redirect("/login");
  }

  return <MessagesClient user={user} conversations={conversations} users={users} />;
}
