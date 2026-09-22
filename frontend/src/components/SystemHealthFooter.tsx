import { Database, Server, Cpu, Radio } from 'lucide-react';
import { HealthState } from '../types';

interface SystemHealthFooterProps {
  health: HealthState;
}

export function SystemHealthFooter({ health }: SystemHealthFooterProps) {
  const isOnline = health.status === 'ONLINE';

  const services = [
    {
      name: 'PostgreSQL',
      role: 'Inventory Source of Truth',
      status: isOnline ? 'ONLINE' : 'AWAITING_CONNECTION',
      icon: Database,
      detail: isOnline ? 'Connected (HikariCP pool)' : 'Awaiting backend connection',
    },
    {
      name: 'Redis',
      role: 'Streams & Caching',
      status: isOnline ? 'ONLINE' : 'AWAITING_CONNECTION',
      icon: Server,
      detail: isOnline ? 'Connected (Port 6379)' : 'Awaiting backend connection',
    },
    {
      name: 'Order Processor',
      role: 'ThreadPool (5/10/100)',
      status: isOnline ? 'STANDBY' : 'AWAITING_CONNECTION',
      icon: Cpu,
      detail: isOnline ? 'Worker threads initialized' : 'Awaiting backend connection',
    },
    {
      name: 'SSE Telemetry',
      role: 'Real-Time Pipeline',
      status: isOnline ? 'STANDBY' : 'AWAITING_CONNECTION',
      icon: Radio,
      detail: isOnline ? 'Ready for event broadcast' : 'Awaiting backend connection',
    },
  ];

  return (
    <footer className="h-10 bg-[#060913] border-t border-slate-800 px-6 flex items-center justify-between text-xs font-mono shrink-0">
      <div className="flex items-center space-x-6 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          INFRASTRUCTURE:
        </span>
        {services.map((svc) => {
          const Icon = svc.icon;
          const isSvcOnline = svc.status === 'ONLINE';
          const isStandby = svc.status === 'STANDBY';

          return (
            <div key={svc.name} className="flex items-center space-x-2 text-[11px]" title={`${svc.role}: ${svc.detail}`}>
              <Icon className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-slate-300 font-medium">{svc.name}</span>
              <span className="flex items-center space-x-1">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  isSvcOnline 
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                    : isStandby
                    ? 'bg-sky-400'
                    : 'bg-amber-400'
                }`} />
                <span className={`text-[10px] ${
                  isSvcOnline 
                    ? 'text-emerald-400' 
                    : isStandby
                    ? 'text-sky-400'
                    : 'text-amber-400'
                }`}>
                  {svc.status === 'AWAITING_CONNECTION' ? 'Awaiting backend' : svc.status}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-600 hidden md:block">
        ORDERFLOW MONOLITH • JAVA 17 / SPRING BOOT 3
      </div>
    </footer>
  );
}
