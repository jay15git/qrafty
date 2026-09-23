import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function inspectorPortalClass(theme: "light" | "dark", className?: string) {
  return cn(className, theme === "dark" && "dark");
}

function mapMobileDetailCloseChildren(children: ReactNode, onClose: () => void): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    if (typeof child.type === "string") {
      const childProps = child.props as { children?: ReactNode };

      if (childProps.children === undefined) {
        return child;
      }

      return cloneElement(
        child,
        undefined,
        mapMobileDetailCloseChildren(childProps.children, onClose),
      );
    }

    const childProps = child.props as {
      onClose?: () => void;
      children?: ReactNode;
    };

    const patchedProps: {
      onClose?: () => void;
      children?: ReactNode;
    } = {};

    if (childProps.onClose) {
      patchedProps.onClose = () => {
        childProps.onClose?.();
        onClose();
      };
    }

    if (childProps.children !== undefined) {
      patchedProps.children = mapMobileDetailCloseChildren(childProps.children, onClose);
    }

    if (Object.keys(patchedProps).length === 0) {
      return child;
    }

    return cloneElement(
      child as ReactElement<{
        onClose?: () => void;
        children?: ReactNode;
      }>,
      patchedProps,
    );
  });
}

export function mergeMobileDetailChildClose(children: ReactNode, onClose: () => void): ReactNode {
  return mapMobileDetailCloseChildren(children, onClose);
}
