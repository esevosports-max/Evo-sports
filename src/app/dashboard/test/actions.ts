"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPhysicalTest(
  playerId: string,
  vma: number,
  vo2Max: number,
  sprint10m: number,
  sprint30m: number,
  cmj: number,
  sj: number,
  illinois: number,
  fat: number
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Action réservée aux gestionnaires (Staff)")
    }

    // Verify player exists and belongs to the same club
    const player = await db.player.findUnique({
      where: { id: playerId }
    })

    if (!player) {
      throw new Error("Joueur introuvable")
    }

    const staff = await db.staff.findUnique({
      where: { userId }
    })
    const club = await db.club.findFirst({
      where: {
        OR: [
          { presidentId: userId },
          { staff: { some: { userId } } }
        ]
      }
    })
    const clubId = club?.id || staff?.clubId

    if (!clubId || player.clubId !== clubId) {
      throw new Error("Le joueur n'appartient pas à votre club")
    }

    const newTest = await db.physicalTest.create({
      data: {
        playerId,
        vma,
        vo2Max,
        sprint10m,
        sprint30m,
        cmj,
        sj,
        illinois,
        fat
      }
    })

    revalidatePath("/dashboard/test")
    return { success: true, testId: newTest.id }
  } catch (e: any) {
    console.error("Error creating physical test:", e)
    return { success: false, error: e.message || "Erreur de création du test physique" }
  }
}

export async function deletePhysicalTest(id: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Action réservée aux gestionnaires (Staff)")
    }

    // Verify test exists and belongs to the staff's club
    const test = await db.physicalTest.findUnique({
      where: { id },
      include: { player: true }
    })

    if (!test) {
      throw new Error("Test physique introuvable")
    }

    const staff = await db.staff.findUnique({
      where: { userId }
    })
    const club = await db.club.findFirst({
      where: {
        OR: [
          { presidentId: userId },
          { staff: { some: { userId } } }
        ]
      }
    })
    const clubId = club?.id || staff?.clubId

    if (!clubId || test.player.clubId !== clubId) {
      throw new Error("Vous n'avez pas l'autorisation de supprimer ce test")
    }

    await db.physicalTest.delete({
      where: { id }
    })

    revalidatePath("/dashboard/test")
    return { success: true }
  } catch (e: any) {
    console.error("Error deleting physical test:", e)
    return { success: false, error: e.message || "Erreur de suppression" }
  }
}
