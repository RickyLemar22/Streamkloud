import { useEffect, useState } from 'react';
import { Check, Crown, Zap, Star, ShieldCheck, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthModal } from '@/store/useAuthModal';

type StoredUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  email?: string;
  subscription?: any;
};

const getStoredUser = (): StoredUser | null => {
  try {
    const admin = localStorage.getItem('admin');
    const user = localStorage.getItem('user');
    return admin ? JSON.parse(admin) : user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const updateStoredUser = (subscription: any) => {
  try {
    const admin = localStorage.getItem('admin');
    const key = admin ? 'admin' : 'user';
    const current = localStorage.getItem(key);
    if (!current) return;

    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(current), subscription }));
    window.dispatchEvent(new Event('auth-change'));
  } catch {
    // Keep the UI usable even if localStorage parsing fails.
  }
};

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'UGX 0',
    period: 'forever',
    description: 'Ad-supported listening',
    features: ['Standard quality audio', 'Ad-supported', 'Limited skips'],
    icon: Info,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10'
  },
  {
    id: 'lite',
    name: 'Lite',
    price: 'UGX 1,000',
    period: '24hrs',
    description: 'Ideal for students and low-bandwidth users',
    features: ['Everything in Free', 'Ad-free for 24h', 'Better bandwidth usage'],
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'UGX 4,000',
    period: 'month',
    description: 'The standard music experience',
    features: ['Ad-free listening', 'High quality audio', 'Unlimited skips', 'Offline mode'],
    icon: Star,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    popular: true
  },
  {
    id: 'family',
    name: 'Family / Group',
    price: 'UGX 10,000',
    period: 'month',
    description: 'Share the music with your tribe',
    features: ['Up to 6 accounts', 'Individual profiles', 'Parental controls'],
    icon: Users,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 'UGX 52,000',
    period: '3 months',
    description: 'Best for long-term listeners',
    features: ['Everything in Standard', '3 months coverage', 'Priority support'],
    icon: Crown,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10'
  },
  {
    id: 'annual',
    name: 'Annually',
    price: 'UGX 105,000',
    period: 'year',
    description: 'Ultimate value for true fans',
    features: ['Everything in Standard', '12 months coverage', 'VIP experience', 'Exclusive badges'],
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  }
];

export function Subscription() {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<string | null>(null);
  const { open: openAuth } = useAuthModal();

  useEffect(() => {
    const syncAuth = () => setUser(getStoredUser());

    window.addEventListener('auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const handleSubscribe = async (planId: string) => {
    const token = localStorage.getItem('token');
    const currentUser = getStoredUser();

    if (!token || !currentUser) {
      try {
        openAuth();
      } catch {
        window.dispatchEvent(new Event('open-auth-modal'));
      }
      return;
    }

    setUser(currentUser);

    setLoading(planId);

    try {
      const expiryDate = new Date();
      if (planId === 'free') expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      if (planId === 'lite') expiryDate.setDate(expiryDate.getDate() + 1);
      if (planId === 'standard' || planId === 'family') expiryDate.setMonth(expiryDate.getMonth() + 1);
      if (planId === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
      if (planId === 'annual') expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const subscription = {
        plan: planId,
        status: 'active',
        expiryDate: expiryDate.toISOString()
      };

      const response = await fetch('/api/users/subscription', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription, plan: planId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update subscription.');
      }

      updateStoredUser(data.subscription || subscription);
      alert(`Successfully subscribed to ${planId} plan!`);
    } catch (error) {
      console.error('Error subscribing:', error);
      alert(error instanceof Error ? error.message : 'Failed to update subscription.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">
            Choose Your <span className="text-orange-500">Rhythm</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Unlock the full potential of StreamKloud. Ad-free music, offline listening, and exclusive content await.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300",
                plan.popular 
                  ? "bg-zinc-900 border-orange-500/50 shadow-2xl shadow-orange-500/10 scale-105 z-10" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", plan.bg)}>
                <plan.icon className={cn("w-6 h-6", plan.color)} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-x-1 mb-4">
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <span className="text-zinc-500">/{plan.period}</span>
              </div>
              <p className="text-zinc-400 text-sm mb-8">{plan.description}</p>

              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-x-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className="w-full h-12 rounded-xl font-bold transition-all bg-orange-500 hover:bg-orange-600 text-black disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading === plan.id ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
