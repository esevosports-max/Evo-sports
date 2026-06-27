import { db } from "@/lib/db"

// Define football-specific roles in French
export const ROLES = {
  MANAGER_EVO_SPORTS: "MANAGER_EVO_SPORTS", // Le Manager EVO Sports (SaaS Super Admin)
  PRESIDENT: "PRESIDENT", // Le Président de club
  DIRECTEUR_SPORTIF: "DIRECTEUR_SPORTIF", // Le Directeur Sportif
  SECRETAIRE_GENERAL: "SECRETAIRE_GENERAL", // Le Secrétaire Général
  ENTRAINEUR_PRINCIPAL: "ENTRAINEUR_PRINCIPAL", // L'Entraîneur Principal
  ENTRAINEUR_ADJOINT: "ENTRAINEUR_ADJOINT", // L'Entraîneur Adjoint
  PREPARATEUR_PHYSIQUE: "PREPARATEUR_PHYSIQUE", // Le Préparateur Physique
  ENTRAINEUR_GARDIENS: "ENTRAINEUR_GARDIENS", // L'Entraîneur des Gardiens
  MEDECIN: "MEDECIN", // Le Médecin du Club
  JOUEUR: "JOUEUR", // Les Joueurs
} as const

// Human-readable labels in French
export const ROLE_LABELS: Record<keyof typeof ROLES, string> = {
  MANAGER_EVO_SPORTS: "Le Manager EVO Sports",
  PRESIDENT: "Le Président de club",
  DIRECTEUR_SPORTIF: "Le Directeur Sportif",
  SECRETAIRE_GENERAL: "Le Secrétaire Général",
  ENTRAINEUR_PRINCIPAL: "L'Entraîneur Principal",
  ENTRAINEUR_ADJOINT: "L'Entraîneur Adjoint",
  PREPARATEUR_PHYSIQUE: "Le Préparateur Physique",
  ENTRAINEUR_GARDIENS: "L'Entraîneur des Gardiens",
  MEDECIN: "Le Médecin du Club",
  JOUEUR: "Les Joueurs (Joueur)",
}

// Define football-specific permission actions
export const PERMISSIONS = {
  // Planning (Page: Planning)
  PLANNING_READ: "planning:read",
  PLANNING_WRITE: "planning:write",

  // Messagerie (Page: Messagerie)
  MESSAGERIE_READ: "messagerie:read",
  MESSAGERIE_WRITE: "messagerie:write",

  // Sondages (Page: Sondages)
  SONDAGE_READ: "sondage:read",
  SONDAGE_WRITE: "sondage:write",

  // Club & Équipes (Page: Mon Club & Équipes)
  CLUB_READ: "club:read",
  CLUB_WRITE: "club:write",

  // Staff Technique (Page: Staff)
  STAFF_READ: "staff:read",
  STAFF_WRITE: "staff:write",

  // Effectifs (Page: Effectifs)
  EFFECTIFS_READ: "effectifs:read",
  EFFECTIFS_WRITE: "effectifs:write",

  // Composition Tactique (Page: Composition)
  COMPOSITION_READ: "composition:read",
  COMPOSITION_WRITE: "composition:write",

  // Entraînements (Page: Entraînements)
  ENTRAINEMENT_READ: "entrainement:read",
  ENTRAINEMENT_WRITE: "entrainement:write",

  // Matchs (Page: Matchs)
  MATCH_READ: "match:read",
  MATCH_WRITE: "match:write",

  // Suivi Blessures (Page: Suivi Blessures)
  BLESSURE_READ: "blessure:read",
  BLESSURE_WRITE: "blessure:write",

  // Dossier Médical (Page: Dossier Médical)
  MEDICAL_READ: "medical:read",
  MEDICAL_WRITE: "medical:write",

  // Tests Physiques (Page: Tests Physiques)
  TEST_READ: "test:read",
  TEST_WRITE: "test:write",

  // Fiche Quotidienne (Page: Fiche Quotidienne)
  QUOTIDIENNE_READ: "quotidienne:read",
  QUOTIDIENNE_WRITE: "quotidienne:write",

  // Rôles & Permissions (Page: Rôles & Permissions)
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
} as const

export type RoleName = keyof typeof ROLES
export type PermissionAction = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * Check if the current session user has a specific permission.
 */
export function hasPermission(
  session: { user?: { role?: { name: string; permissions: string[] } } } | null,
  requiredPermission: string
): boolean {
  if (!session?.user?.role) return false
  
  const { name, permissions } = session.user.role

  // PRESIDENT and MANAGER_EVO_SPORTS bypass all permission checks (master administrators)
  if (name === ROLES.PRESIDENT || name === ROLES.MANAGER_EVO_SPORTS) return true

  return permissions.includes(requiredPermission)
}

/**
 * Helper to check if user has a specific role directly.
 */
export function hasRole(
  session: { user?: { role?: { name: string } } } | null,
  roleName: string
): boolean {
  return session?.user?.role?.name === roleName
}

/**
 * Seed football roles and permissions into the database.
 */
export async function seedRBAC() {
  console.log("Starting Football-specific RBAC seeding...")

  // 1. Create all permissions sequentially to avoid SQLite concurrent write locks
  const actions = Object.values(PERMISSIONS)
  const permissionRecords = []
  for (const action of actions) {
    const rec = await db.permission.upsert({
      where: { action },
      update: {},
      create: {
        action,
        description: `Permission to perform ${action} operations`,
      },
    })
    permissionRecords.push(rec)
  }
  console.log(`Seeded ${permissionRecords.length} football permissions.`)

  // 2. Create roles and connect appropriate permissions
  
  // PRESIDENT - Full Master Access
  await db.role.upsert({
    where: { name: ROLES.PRESIDENT },
    update: {
      permissions: {
        set: Object.values(PERMISSIONS).map((action) => ({ action })),
      },
    },
    create: {
      name: ROLES.PRESIDENT,
      description: "Le Président de club - Full Master administrative access",
      permissions: {
        connect: Object.values(PERMISSIONS).map((action) => ({ action })),
      },
    },
  })

  // MANAGER EVO SPORTS - Platform Master Access
  await db.role.upsert({
    where: { name: ROLES.MANAGER_EVO_SPORTS },
    update: {
      permissions: {
        set: Object.values(PERMISSIONS).map((action) => ({ action })),
      },
    },
    create: {
      name: ROLES.MANAGER_EVO_SPORTS,
      description: "Le Manager EVO Sports - Application Platform Administrator",
      permissions: {
        connect: Object.values(PERMISSIONS).map((action) => ({ action })),
      },
    },
  })

  // DIRECTEUR SPORTIF
  await db.role.upsert({
    where: { name: ROLES.DIRECTEUR_SPORTIF },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.SONDAGE_WRITE },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.CLUB_WRITE },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.STAFF_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.COMPOSITION_WRITE },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.MATCH_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.MEDICAL_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.DIRECTEUR_SPORTIF,
      description: "Le Directeur Sportif - Direction sportive et administrative",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.SONDAGE_WRITE },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.CLUB_WRITE },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.STAFF_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.COMPOSITION_WRITE },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.MATCH_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.MEDICAL_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
  })

  // SECRETAIRE GENERAL
  await db.role.upsert({
    where: { name: ROLES.SECRETAIRE_GENERAL },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.CLUB_WRITE },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.STAFF_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.MEDICAL_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.SECRETAIRE_GENERAL,
      description: "Le Secrétaire Général - Administration et planification des matchs",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.CLUB_WRITE },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.STAFF_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.MEDICAL_WRITE },
        ],
      },
    },
  })

  // ENTRAINEUR PRINCIPAL
  await db.role.upsert({
    where: { name: ROLES.ENTRAINEUR_PRINCIPAL },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.SONDAGE_WRITE },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.COMPOSITION_WRITE },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.MATCH_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.ENTRAINEUR_PRINCIPAL,
      description: "L'Entraîneur Principal - Gestion tactique et technique complète",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.SONDAGE_WRITE },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.COMPOSITION_WRITE },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.MATCH_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
  })

  // ENTRAINEUR ADJOINT
  await db.role.upsert({
    where: { name: ROLES.ENTRAINEUR_ADJOINT },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.SONDAGE_WRITE },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.COMPOSITION_WRITE },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.MATCH_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.ENTRAINEUR_ADJOINT,
      description: "L'Entraîneur Adjoint - Assistant technique",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.PLANNING_WRITE },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.SONDAGE_WRITE },
          { action: PERMISSIONS.CLUB_READ },
          { action: PERMISSIONS.STAFF_READ },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.EFFECTIFS_WRITE },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.COMPOSITION_WRITE },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.MATCH_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
  })

  // PREPARATEUR PHYSIQUE
  await db.role.upsert({
    where: { name: ROLES.PREPARATEUR_PHYSIQUE },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.PREPARATEUR_PHYSIQUE,
      description: "Le Préparateur Physique - Préparation physique et athlétique",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
          { action: PERMISSIONS.QUOTIDIENNE_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
  })

  // ENTRAINEUR GARDIENS
  await db.role.upsert({
    where: { name: ROLES.ENTRAINEUR_GARDIENS },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.ENTRAINEUR_GARDIENS,
      description: "L'Entraîneur des Gardiens - Spécifique gardiens de but",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.ENTRAINEMENT_WRITE },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.TEST_WRITE },
        ],
      },
    },
  })

  // MEDECIN
  await db.role.upsert({
    where: { name: ROLES.MEDECIN },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.MEDICAL_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.MEDECIN,
      description: "Le Médecin du Club - Suivi de santé et infirmerie",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.BLESSURE_WRITE },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.MEDICAL_WRITE },
        ],
      },
    },
  })

  // JOUEUR
  await db.role.upsert({
    where: { name: ROLES.JOUEUR },
    update: {
      permissions: {
        set: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
    create: {
      name: ROLES.JOUEUR,
      description: "Les Joueurs - Consultation et soumission de fiche quotidienne",
      permissions: {
        connect: [
          { action: PERMISSIONS.PLANNING_READ },
          { action: PERMISSIONS.MESSAGERIE_READ },
          { action: PERMISSIONS.MESSAGERIE_WRITE },
          { action: PERMISSIONS.SONDAGE_READ },
          { action: PERMISSIONS.EFFECTIFS_READ },
          { action: PERMISSIONS.COMPOSITION_READ },
          { action: PERMISSIONS.ENTRAINEMENT_READ },
          { action: PERMISSIONS.MATCH_READ },
          { action: PERMISSIONS.BLESSURE_READ },
          { action: PERMISSIONS.MEDICAL_READ },
          { action: PERMISSIONS.TEST_READ },
          { action: PERMISSIONS.QUOTIDIENNE_WRITE },
        ],
      },
    },
  })

  console.log("Football RBAC seeding completed successfully.")
}
