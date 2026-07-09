import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/common/PageTransition';
import { ArrowLeft, ShoppingBag, Coins, Check, Loader2 } from 'lucide-react';
import { useShopStore } from '../store/shopStore';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { EmptyState } from '../components/common/EmptyState';
import { SHOP_ITEMS } from '@mafia/shared';

export function Store() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const playerId = useGameStore((s) => s.playerId);
  const { inventory, coins, setInventory, setCoins } = useShopStore();
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!playerId) return;
    fetch(`/api/store/inventory/${playerId}`)
      .then((r) => r.json())
      .then((data) => setInventory(data.inventory ?? [], data.coins ?? 0))
      .catch(() => {});
  }, [playerId]);

  const handleBuy = async (itemId: string, price: number) => {
    if (!playerId) return;
    setBuying(itemId);
    setError('');
    try {
      const res = await fetch('/api/store/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: playerId, itemId }),
      });
      const data = await res.json();
      if (data.success) {
        setCoins(data.coins);
        useShopStore.getState().addToInventory(itemId);
      } else {
        setError(data.error ?? t('store.failed'));
      }
    } catch {
      setError(t('store.failed'));
    }
    setBuying(null);
  };

  const categories = [
    { id: 'avatar_frame', label: t('store.frames') },
    { id: 'title', label: t('store.titles') },
    { id: 'icon', label: t('store.icons') },
  ] as const;

  return (
    <PageTransition>
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#8B0000]" />
            {t('store.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{coins}</span>
            <span className="text-gray-500">{t('store.coins')}</span>
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('store.back')}
        </button>
      </div>

      {error && (
        <div className="card-glass p-3 border-red-800/30 bg-red-950/20 text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      {categories.map((cat) => {
        const catItems = SHOP_ITEMS.filter((i) => i.category === cat.id);
        if (catItems.length === 0) return null;
        return (
          <div key={cat.id} className="card-glass p-4 space-y-3 card-shine">
            <h2 className="section-title">{cat.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catItems.map((item) => {
                const owned = inventory.includes(item.id);
                return (
                  <div key={item.id} className={`card-hover p-3 rounded-lg border ${owned ? 'border-green-800/30 bg-green-950/10' : 'border-gray-800/30 bg-white/[0.02]'} transition-colors`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-[11px] text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {owned ? (
                          <span className="badge badge-green text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 flex items-center gap-1 border-green-800/30">
                            <Check className="w-3 h-3" /> {t('store.owned')}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleBuy(item.id, item.price)}
                            disabled={buying === item.id}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            {buying === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <><Coins className="w-3 h-3" /> {item.price}</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
    </PageTransition>
  );
}
