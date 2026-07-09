export { initDatabase } from './io';
export { getOrCreateUser, getUser } from './users';
export {
  getPlayerProfile,
  getPlayerProfileByUserId,
  getOrCreatePlayerProfile,
  savePlayerProfile,
} from './profiles';
export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendProfiles,
} from './friends';
export { saveGame, getTotalGames, getRecentGames } from './games';
export { getPlayerStats, getLeaderboard } from './stats';
export { getPlayerInventory, getPlayerCoins, addCoins, buyItem } from './shop';
export type {
  StoredPlayer,
  StoredGame,
  DailyQuestProgress,
  PlayerProfile,
  StoredUser,
} from './types';
