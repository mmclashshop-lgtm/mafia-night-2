import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Check, Upload } from 'lucide-react';

const AVATAR_ICONS = [
  { id: 'mask', emoji: '🎭', label: 'القناع' },
  { id: 'crown', emoji: '👑', label: 'التاج' },
  { id: 'detective', emoji: '🔍', label: 'المحقق' },
  { id: 'skull', emoji: '☠️', label: 'الجمجمة' },
  { id: 'ghost', emoji: '👻', label: 'الشبح' },
  { id: 'knife', emoji: '🔪', label: 'الخنجر' },
  { id: 'gun', emoji: '🔫', label: 'المسدس' },
  { id: 'heart', emoji: '❤️‍🔥', label: 'القلب' },
  { id: 'spy', emoji: '🕵️', label: 'الجاسوس' },
  { id: 'vampire', emoji: '🧛', label: 'المصاص' },
  { id: 'wolf', emoji: '🐺', label: 'الذئب' },
  { id: 'fox', emoji: '🦊', label: 'الثعلب' },
  { id: 'owl', emoji: '🦉', label: 'البومة' },
  { id: 'raven', emoji: '🐦‍⬛', label: 'الغراب' },
  { id: 'moon', emoji: '🌙', label: 'القمر' },
  { id: 'star', emoji: '⭐', label: 'النجمة' },
  { id: 'crystal', emoji: '🔮', label: 'البلورة' },
  { id: 'clown', emoji: '🤡', label: 'المهرج' },
  { id: 'angel', emoji: '👼', label: 'الملاك' },
  { id: 'devil', emoji: '😈', label: 'الشيطان' },
];

interface AvatarPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);

  const getDiceBearUrl = (name: string) =>
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&backgroundType=gradientLinear&backgroundRotation=0`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedAvatar(dataUrl);
      onChange(`upload:${dataUrl}`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-[#8B0000]/30 flex items-center justify-center">
          {value.startsWith('upload:') ? (
            <img src={value.replace('upload:', '')} alt="Avatar" className="w-full h-full object-cover" />
          ) : value.startsWith('icon:') ? (
            <span className="text-3xl">{AVATAR_ICONS.find(i => `icon:${i.id}` === value)?.emoji || '🎭'}</span>
          ) : (
            <img
              src={getDiceBearUrl(value)}
              alt="Avatar"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Upload className="w-4 h-4" />
          {t('avatar.upload', 'رفع صورة')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <p className="text-xs text-gray-500">{t('avatar.pickIcon', 'أو اختر أيقونة')}</p>

      <div className="flex flex-wrap gap-2">
        {AVATAR_ICONS.map((icon) => (
          <button
            key={icon.id}
            onClick={() => {
              setUploadedAvatar(null);
              onChange(`icon:${icon.id}`);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200 ${
              value === `icon:${icon.id}`
                ? 'bg-[#8B0000]/30 ring-2 ring-[#8B0000] scale-110'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={icon.label}
          >
            {icon.emoji}
            {value === `icon:${icon.id}` && (
              <Check className="absolute w-3 h-3 text-white -top-0.5 -right-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
