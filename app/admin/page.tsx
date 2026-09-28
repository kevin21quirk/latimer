import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAuthSecret } from "@/lib/auth-secret";

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return null;
  }

  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token.value, secret);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
    });

    if (!user || !user.isAdmin) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export default async function AdminPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.post.count(),
    prisma.group.count(),
    prisma.message.count(),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.helpRequest.count(),
    prisma.localService.count(),
    prisma.wellbeingResource.count(),
    prisma.alert.count({ where: { isActive: true } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      accountType: true,
      createdAt: true,
      isAdmin: true,
    },
  });

  const recentPosts = await prisma.post.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  const allGroups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      creatorId: true,
      interests: true,
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
  });

  const recentMessages = await prisma.message.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      receiver: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const recentComments = await prisma.comment.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          content: true,
        },
      },
    },
  });

  const usersByType = await prisma.user.groupBy({
    by: ['accountType'],
    _count: true,
  });

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      reported: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const helpRequests = await prisma.helpRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      helper: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const localServices = await prisma.localService.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const wellbeingResources = await prisma.wellbeingResource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return (
    <AdminDashboard
      user={user}
      stats={{
        totalUsers: stats[0],
        totalPosts: stats[1],
        totalGroups: stats[2],
        totalMessages: stats[3],
        totalComments: stats[4],
        totalLikes: stats[5],
        totalHelpRequests: stats[6],
        totalLocalServices: stats[7],
        totalWellbeingResources: stats[8],
        totalAlerts: stats[9],
      }}
      recentUsers={recentUsers}
      recentPosts={recentPosts}
      groups={allGroups}
      messages={recentMessages}
      comments={recentComments}
      usersByType={usersByType}
      reports={reports}
      helpRequests={helpRequests}
      localServices={localServices}
      wellbeingResources={wellbeingResources}
      alerts={alerts}
    />
  );
}
