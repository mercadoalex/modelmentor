import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const calculateStrength = (pwd: string): { score: number; criteria: PasswordCriteria[] } => {
    const criteria: PasswordCriteria[] = [
      {
        label: 'At least 8 characters',
        met: pwd.length >= 8
      },
      {
        label: 'Contains uppercase letter',
        met: /[A-Z]/.test(pwd)
      },
      {
        label: 'Contains lowercase letter',
        met: /[a-z]/.test(pwd)
      },
      {
        label: 'Contains number',
        met: /[0-9]/.test(pwd)
      },
      {
        label: 'Contains special character',
        met: /[^A-Za-z0-9]/.test(pwd)
      }
    ];

    const score = criteria.filter(c => c.met).length;
    return { score, criteria };
  };

  const { score, criteria } = calculateStrength(password);

  const getStrengthLabel = (score: number): string => {
    if (score < 3) return 'Weak';
    if (score < 5) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score < 3) return 'bg-red-600';
    if (score < 5) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getStrengthTextColor = (score: number): string => {
    if (score < 3) return 'text-red-600';
    if (score < 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Password Strength</span>
          <span className={`text-sm font-semibold ${getStrengthTextColor(score)}`}>
            {getStrengthLabel(score)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(score)}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {criterion.met ? (
              <Check className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={criterion.met ? 'text-foreground' : 'text-muted-foreground'}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
