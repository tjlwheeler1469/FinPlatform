// Reusable circular Retirement Readiness Score dial.
import { classify } from "@/engine/retirementReadinessEngine";

const ReadinessDial = ({ score, size = 160, strokeWidth = 14, label = true, testId = "readiness-dial" }) => {
  const cls = classify(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(circumference, (score / 100) * circumference));

  return (
    <div className="inline-flex flex-col items-center" data-testid={testId}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={cls.color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: cls.color }}>{score}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
        </div>
      </div>
      {label && (
        <span
          className="mt-2 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ backgroundColor: `${cls.color}15`, color: cls.color }}
        >
          {cls.label}
        </span>
      )}
    </div>
  );
};

export default ReadinessDial;
