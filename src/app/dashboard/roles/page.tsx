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
  const isAuthorized = roleName === "MANAGER_EVO_SPORTS"

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

  // Fetch all users in the system (excluding the current President and Manager)
  const users = isAuthorized ? await db.user.findMany({
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
  }) : []

  // Server Action to update user role
  async function updateUserRoleAction(userId: string, roleId: string) {
    "use server"
    await db.user.update({
      where: { id: userId },
      data: { roleId },
    })
  }

  // Server Action to toggle role permission
  async function toggleRolePermissionAction(roleId: string, permissionAction: string, enable: boolean) {
    "use server"
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
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialRoles={JSON.parse(JSON.stringify(roles))}
      allPermissions={JSON.parse(JSON.stringify(permissions))}
      updateUserRoleAction={updateUserRoleAction}
      toggleRolePermissionAction={toggleRolePermissionAction}
    />
  )
}
