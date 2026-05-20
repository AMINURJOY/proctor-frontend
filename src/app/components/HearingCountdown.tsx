import { useEffect, useState } from 'react';

interface Props {
  date: string;
  time?: string;
  label?: string;
}

function parseTarget(date: string, time?: string): Date | null {
  if (!date) return null;
  let iso = date;
  if (time && !date.includes('T')) {
    iso = `${date}T${time.length === 5 ? time + ':00' : time}`;
  }
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  return { months, days, hours, minutes, seconds, done: false };
}

function Tile({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        {padded.split('').map((d, i) => (
          <div
            key={i}
            className="bg-gray-900 text-amber-50 rounded-sm px-2 py-1 text-xl font-mono font-bold tabular-nums shadow-inner"
            style={{ minWidth: '1.5ch' }}
          >
            {d}
          </div>
        ))}
      </div>
      <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</span>
    </div>
  );
}

export default function HearingCountdown({ date, time, label = 'Time Remaining' }: Props) {
  const target = parseTarget(date, time);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Tick every second so the countdown is visibly counting.
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!target) return null;

  const remaining = diff(target);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = now;

  if (remaining.done) {
    return (
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-red-600">Hearing time has passed</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
      <div className="flex items-end gap-3">
        <Tile value={remaining.months} label="month" />
        <Tile value={remaining.days} label="day" />
        <Tile value={remaining.hours} label="hour" />
        <Tile value={remaining.minutes} label="min" />
        <Tile value={remaining.seconds} label="sec" />
      </div>
    </div>
  );
}
