"use client";

import type React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolbarButtonProps extends ButtonProps {
  tooltipLabel: string;
  icon: React.ReactNode;
}

export function ToolbarButton({ tooltipLabel, icon, ...props }: ToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" {...props}>
            {icon}
            <span className="sr-only">{tooltipLabel}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
