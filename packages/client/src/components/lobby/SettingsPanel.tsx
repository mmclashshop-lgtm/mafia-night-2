import { useTranslation } from 'react-i18next';
import type { GameSettings } from '@mafia/shared';
import { Clock, Users, Shield, Eye, Mic, MessageCircle } from 'lucide-react';

interface SettingsPanelProps {
  settings: GameSettings;
  onUpdate: (settings: Partial<GameSettings>) => Promise<void>;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const { t } = useTranslation();

  const handleChange = async (key: keyof GameSettings, value: unknown) => {
    try {
      await onUpdate({ [key]: value });
    } catch {
      // ignore
    }
  };

  return (
    <div className="card p-5 space-y-4 border border-[#8B0000]/15">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#8B0000]" />
        {t('settingsPanel.title')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Night duration */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {t('settingsPanel.night')}
          </label>
          <input
            type="number" min={10} max={120}
            value={settings.nightDuration}
            onChange={e => handleChange('nightDuration', parseInt(e.target.value) || 30)}
            className="input-field w-full text-sm text-center"
          />
        </div>

        {/* Day duration */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {t('settingsPanel.day')}
          </label>
          <input
            type="number" min={15} max={300}
            value={settings.dayDuration}
            onChange={e => handleChange('dayDuration', parseInt(e.target.value) || 60)}
            className="input-field w-full text-sm text-center"
          />
        </div>

        {/* Voting duration */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {t('settingsPanel.voting')}
          </label>
          <input
            type="number" min={10} max={120}
            value={settings.votingDuration}
            onChange={e => handleChange('votingDuration', parseInt(e.target.value) || 30)}
            className="input-field w-full text-sm text-center"
          />
        </div>

        {/* Role preset */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> {t('settingsPanel.rolePreset')}
          </label>
          <select
            value={settings.rolePreset}
            onChange={e => handleChange('rolePreset', e.target.value)}
            className="input-field w-full text-sm"
          >
            <option value="classic">{t('settingsPanel.classic')}</option>
            <option value="advanced">{t('settingsPanel.advanced')}</option>
            <option value="chaos">{t('settingsPanel.chaos')}</option>
          </select>
        </div>

        {/* Max players */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> {t('settingsPanel.maxPlayers')}
          </label>
          <input
            type="number" min={4} max={12}
            value={settings.maxPlayers}
            onChange={e => handleChange('maxPlayers', parseInt(e.target.value) || 12)}
            className="input-field w-full text-sm text-center"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#8B0000]/10">
        <label className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A]/50">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> {t('settingsPanel.spectators')}
          </span>
          <input
            type="checkbox" checked={settings.allowSpectators}
            onChange={e => handleChange('allowSpectators', e.target.checked)}
            className="toggle"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A]/50">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Mic className="w-3.5 h-3.5" /> {t('settingsPanel.voiceChat')}
          </span>
          <input
            type="checkbox" checked={settings.enableVoiceChat}
            onChange={e => handleChange('enableVoiceChat', e.target.checked)}
            className="toggle"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A]/50">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" /> {t('settingsPanel.textChat')}
          </span>
          <input
            type="checkbox" checked={settings.enableTextChat}
            onChange={e => handleChange('enableTextChat', e.target.checked)}
            className="toggle"
          />
        </label>
      </div>
    </div>
  );
}
