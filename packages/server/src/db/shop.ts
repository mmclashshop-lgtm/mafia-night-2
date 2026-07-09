import { readProfiles, writeProfiles } from './profiles';

export function getPlayerInventory(userId: string): string[] {
  const profiles = readProfiles();
  for (const [, profile] of profiles) {
    if (profile.userId === userId) return profile.inventory ?? [];
  }
  return [];
}

export function getPlayerCoins(userId: string): number {
  const profiles = readProfiles();
  for (const [, profile] of profiles) {
    if (profile.userId === userId) return profile.coins ?? 0;
  }
  return 0;
}

export function addCoins(userId: string, amount: number): boolean {
  const profiles = readProfiles();
  for (const [, profile] of profiles) {
    if (profile.userId === userId) {
      profile.coins = (profile.coins ?? 0) + amount;
      writeProfiles(profiles);
      return true;
    }
  }
  return false;
}

export function buyItem(userId: string, itemId: string, price: number): { success: boolean; error?: string } {
  const profiles = readProfiles();
  for (const [, profile] of profiles) {
    if (profile.userId === userId) {
      if ((profile.inventory ?? []).includes(itemId)) {
        return { success: false, error: 'Already owned' };
      }
      if ((profile.coins ?? 0) < price) {
        return { success: false, error: 'Not enough coins' };
      }
      profile.coins -= price;
      if (!profile.inventory) profile.inventory = [];
      profile.inventory.push(itemId);
      writeProfiles(profiles);
      return { success: true };
    }
  }
  return { success: false, error: 'Profile not found' };
}
