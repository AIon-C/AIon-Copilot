import type { LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons/lib';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarButtonProps {
  icon: LucideIcon | IconType;
  label: string;
  isActive?: boolean;
}

export const SidebarButton = ({ icon: Icon, label, isActive = false }: SidebarButtonProps) => {
  return (
    <div className="group flex cursor-pointer flex-col items-center justify-center gap-y-0.5">
      <Button variant="transparent" className={cn('size-9 p-2 group-hover:bg-cyan-400/20', isActive && 'bg-cyan-400/20')}>
        <Icon className="size-5 text-slate-100 transition-all group-hover:scale-110 group-hover:text-cyan-200" />
      </Button>

      <span className="text-[11px] text-slate-300 group-hover:text-cyan-200">{label}</span>
    </div>
  );
};
