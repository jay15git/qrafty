import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Fill } from "@/components/ui/fill-picker/public-api";
import { SettingsFillPicker } from "@/features/shell/settings/FillPicker";
import {
  SettingsAccordionPopoverOverlay,
  useSettingsAccordionPopover,
} from "@/features/shell/settings/SettingsAccordionPopoverContext";
import { SettingsPopoverChrome } from "@/features/shell/settings/settings-ui/PopoverChrome";
import { useSettingsTheme } from "@/features/shell/settings/settings-ui/Shared";
import { settingsPortalClass } from "@/features/shell/settings/settings-ui/utils";
import { cn } from "@/lib/utils";

export function SettingsTilePopover({
  title,
  children,
  content,
  contentClassName,
}: {
  title: string;
  children: ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>;
  content: ReactNode;
  contentClassName?: string;
}) {
  const theme = useSettingsTheme();
  const accordion = useSettingsAccordionPopover();
  const popoverKey = useId();
  const [radixOpen, setRadixOpen] = useState(false);

  const accordionPanelClassName = settingsPortalClass(
    theme,
    cn(
      "ds-fill-popover ds-popover-content w-full border-0 bg-transparent p-0 shadow-none outline-none",
      contentClassName,
    ),
  );

  const attachTrigger = (onClick: React.MouseEventHandler<HTMLElement>) => {
    if (!isValidElement(children)) {
      return children;
    }

    return cloneElement(children, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        onClick(event);
      },
    });
  };

  if (accordion) {
    const isOpen = accordion.openKey === popoverKey;

    return (
      <>
        {attachTrigger(() => accordion.setOpenKey(isOpen ? null : popoverKey))}
        <SettingsAccordionPopoverOverlay
          className={accordionPanelClassName}
          openKey={popoverKey}
          theme={theme}
        >
          <SettingsPopoverChrome
            bodyClassName="ds-settings-popover-body-fill"
            title={title}
            onClose={() => accordion.setOpenKey(null)}
          >
            {content}
          </SettingsPopoverChrome>
        </SettingsAccordionPopoverOverlay>
      </>
    );
  }

  return (
    <Popover open={radixOpen} onOpenChange={setRadixOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className={settingsPortalClass(
          theme,
          cn(
            "ds-fill-popover ds-portal-surface w-[var(--popover-width-fill)] border-0 bg-transparent p-0 shadow-none outline-none",
            contentClassName,
          ),
        )}
        data-theme={theme}
        side="right"
        sideOffset={10}
      >
        <SettingsPopoverChrome
          bodyClassName="ds-settings-popover-body-fill"
          title={title}
          onClose={() => setRadixOpen(false)}
        >
          {content}
        </SettingsPopoverChrome>
      </PopoverContent>
    </Popover>
  );
}

export function SettingsAccordionColorPicker({
  title,
  value,
  onValueChange,
  children,
}: {
  title: string;
  value: string;
  onValueChange: (fill: Fill, css: string) => void;
  children: ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>;
}) {
  return (
    <SettingsTilePopover
      title={title}
      content={<SettingsFillPicker solidOnly value={value} onValueChange={onValueChange} />}
    >
      {children}
    </SettingsTilePopover>
  );
}
