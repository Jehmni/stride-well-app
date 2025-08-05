import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TimeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  defaultTime?: string;
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, defaultTime = "08:00", value, ...props }, ref) => {
    return (
      <Input
        type="time"
        ref={ref}
        defaultValue={value ? undefined : defaultTime}
        value={value}
        className={cn("w-full", className)}
        {...props}
      />
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput }; 