import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Skull, Shield, Search, Heart, Eye, Swords, FlaskRound as Flask, UserCheck, Ghost, Award, Target, Crosshair, Users } from 'lucide-react';

const roles = [
  { name: 'Villager', team: 'Town', icon: Users, desc: 'No special powers. Use your vote to find and eliminate the Mafia.', color: 'text-green-400' },
  { name: 'Mafia', team: 'Mafia', icon: Skull, desc: 'Kills one player each night. Coordinate with your team to eliminate the Town.', color: 'text-red-400' },
  { name: 'Godfather', team: 'Mafia', icon: Skull, desc: 'The Mafia leader. Immune to night kills. Cannot be killed at night.', color: 'text-red-400' },
  { name: 'Doctor', team: 'Town', icon: Shield, desc: 'Saves one player each night from being killed.', color: 'text-green-400' },
  { name: 'Cop', team: 'Town', icon: Search, desc: 'Investigates one player each night to learn if they are Mafia or Town.', color: 'text-green-400' },
  { name: 'Serial Killer', team: 'Neutral', icon: Crosshair, desc: 'Kills one player each night. Wins by being the last one standing.', color: 'text-purple-400' },
  { name: 'Witch', team: 'Neutral', icon: Flask, desc: 'Has two potions: one to save and one to kill. Each can be used once.', color: 'text-purple-400' },
  { name: 'Vigilante', team: 'Town', icon: Target, desc: 'Can kill one player during the night. Use wisely.', color: 'text-green-400' },
  { name: 'Detective', team: 'Town', icon: Eye, desc: 'Investigates a player to learn their exact role.', color: 'text-green-400' },
  { name: 'Jester', team: 'Neutral', icon: Ghost, desc: 'Wins if they get lynched during the day. The ultimate troll.', color: 'text-purple-400' },
  { name: 'Mayor', team: 'Town', icon: Award, desc: 'Their vote counts as two during the voting phase.', color: 'text-green-400' },
  { name: 'Lovers', team: 'Lovers', icon: Heart, desc: 'Two players bound together. If one dies, both die. Win together.', color: 'text-pink-400' },
  { name: 'Spy', team: 'Town', icon: Eye, desc: 'Can spy on one player each night to learn their role name.', color: 'text-green-400' },
  { name: 'Sniper', team: 'Town', icon: Crosshair, desc: 'A precise killer. Can take out a target at night.', color: 'text-green-400' },
];

export function Tutorial() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">How to Play Mafia</h1>
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">Game Overview</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Mafia is a social deduction game where players are secretly divided into two (or more) teams: 
          the Town and the Mafia. The Town tries to identify and eliminate the Mafia, while the Mafia 
          tries to eliminate the Town without being discovered.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">Game Flow</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <p className="text-gray-300"><strong className="text-white">Night:</strong> Players with night roles secretly perform actions. The Mafia chooses who to kill. The Doctor saves. The Cop investigates. Close your eyes!</p>
          </div>
          <div className="flex gap-3">
            <span className="text-amber-400 font-bold shrink-0">2.</span>
            <p className="text-gray-300"><strong className="text-white">Day:</strong> Everyone discusses who might be Mafia. Share suspicions, make alliances, and try to figure out who to vote for.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-400 font-bold shrink-0">3.</span>
            <p className="text-gray-300"><strong className="text-white">Voting:</strong> Players vote to lynch someone. The player with the most votes is eliminated and their role is revealed.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-green-400 font-bold shrink-0">4.</span>
            <p className="text-gray-300"><strong className="text-white">Repeat:</strong> The cycle continues until one team wins!</p>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">Win Conditions</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-green-400">🏘️ Town</span> - Eliminate all Mafia and Neutral threats.</p>
          <p><span className="text-red-400">🔪 Mafia</span> - Outnumber the Town. Mafia wins when they equal or outnumber the Town.</p>
          <p><span className="text-purple-400">🌀 Neutral</span> - Each Neutral role has its own win condition. Serial Killer must be the last alive.</p>
          <p><span className="text-pink-400">💕 Lovers</span> - Both lovers must survive to the end of the game.</p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">All Roles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => (
            <div key={role.name} className="flex gap-3 p-3 rounded-lg bg-gray-800/50">
              <role.icon className={`w-5 h-5 shrink-0 mt-0.5 ${role.color}`} />
              <div>
                <p className="text-sm font-medium">{role.name} <span className="text-xs text-gray-500">({role.team})</span></p>
                <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">Tips</h2>
        <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
          <li>Pay attention to who talks and what they say - inconsistencies reveal guilt!</li>
          <li>As Mafia, blend in with the Town. Accuse others to avoid suspicion.</li>
          <li>The Doctor and Cop are the Town's most valuable assets - protect them!</li>
          <li>Don't reveal your role too early unless you have a good reason.</li>
          <li>Use the Mafia chat to coordinate with your teammates at night.</li>
        </ul>
      </div>
    </div>
  );
}
