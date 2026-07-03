import type { RoleId } from '@mafia/shared';

export function getRoleIconPath(roleId: string): string {
  return `${import.meta.env.BASE_URL}roles/${roleId}.svg`;
}

export const ROLE_ICON_MAP: Record<string, string> = {
  mafia: '🔪',
  godfather: '👔',
  doctor: '💊',
  cop: '🔍',
  detective: '🔎',
  medic: '🩹',
  vigilante: '🔫',
  sniper: '🎯',
  mayor: '📜',
  villager: '👤',
  serial_killer: '🩸',
  jester: '🎭',
  spy: '👁️',
  witch: '🧙',
  lovers: '💕',
};
