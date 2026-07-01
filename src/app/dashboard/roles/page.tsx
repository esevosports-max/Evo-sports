import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import RolesManagerClient from "@/components/RolesManagerClient"

export const dynamic = "force-dynamic"

export default async function RolesPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const user = session.user
  const roleName = user.role?.name || ""
  const isAuthorized = roleName === "MANAGER_EVO_SPORTS" || roleName === "PRESIDENT"
  const isManager = roleName === "MANAGER_EVO_SPORTS"

  let presidentClub = null
  if (roleName === "PRESIDENT") {
    presidentClub = await db.club.findUnique({
      where: { presidentId: user.id }
    })
  }

  // Fetch all roles with their connected permissions
  const roles = isAuthorized ? await db.role.findMany({
    include: {
      permissions: {
        select: {
          action: true,
        },
      },
    },
    orderBy: { name: "asc" },
  }) : []

  // Fetch all permissions in the system
  const permissions = isAuthorized ? await db.permission.findMany({
    orderBy: { action: "asc" },
  }) : []

  // Fetch users based on the role (Manager sees everyone; President sees only their club's staff)
  let users: any[] = []
  if (roleName === "MANAGER_EVO_SPORTS") {
    users = await db.user.findMany({
      where: {
        NOT: [
          { id: user.id },
          { role: { name: "MANAGER_EVO_SPORTS" } }
        ]
      },
      include: {
        role: true,
      },
      orderBy: { name: "asc" },
    })
  } else if (roleName === "PRESIDENT" && presidentClub) {
    users = await db.user.findMany({
      where: {
        staff: {
          clubId: presidentClub.id
        },
        NOT: [
          { id: user.id }
        ]
      },
      include: {
        role: true,
      },
      orderBy: { name: "asc" },
    })
  }

  // Server Action to update user role
  async function updateUserRoleAction(userId: string, roleId: string) {
    "use server"
    
    const actionSession = await auth()
    if (!actionSession || !actionSession.user) {
      throw new Error("Unauthorized")
    }

    const actionUserRole = actionSession.user.role?.name || ""
    
    if (actionUserRole === "MANAGER_EVO_SPORTS") {
      await db.user.update({
        where: { id: userId },
        data: { roleId },
      })
    } else if (actionUserRole === "PRESIDENT") {
      const pClub = await db.club.findUnique({
        where: { presidentId: actionSession.user.id }
      })
      if (!pClub) {
        throw new Error("Club not found")
      }

      // Verify target user is staff in president's club
      const staffMember = await db.staff.findFirst({
        where: {
          userId: userId,
          clubId: pClub.id
        }
      })

      if (!staffMember) {
        throw new Error("Target user is not a staff member of your club")
      }

      await db.user.update({
        where: { id: userId },
        data: { roleId },
      })
    } else {
      throw new Error("Unauthorized")
    }
  }

  // Server Action to toggle role permission
  async function toggleRolePermissionAction(roleId: string, permissionAction: string, enable: boolean) {
    "use server"
    
    const actionSession = await auth()
    if (!actionSession || !actionSession.user) {
      throw new Error("Unauthorized")
    }

    const actionUserRole = actionSession.user.role?.name || ""
    if (actionUserRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Only the platform manager can modify the global permissions matrix.")
    }

    if (enable) {
      await db.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            connect: { action: permissionAction },
          },
        },
      })
    } else {
      await db.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            disconnect: { action: permissionAction },
          },
        },
      })
    }
  }

  return (
    <RolesManagerClient
      isAuthorized={isAuthorized}
      isManager={isManager}
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialRoles={JSON.parse(JSON.stringify(roles))}
      allPermissions={JSON.parse(JSON.stringify(permissions))}
      updateUserRoleAction={updateUserRoleAction}
      toggleRolePermissionAction={toggleRolePermissionAction}
    />
  )
}
