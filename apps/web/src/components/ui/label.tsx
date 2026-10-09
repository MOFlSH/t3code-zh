"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "~/lib/utils";
import { useI18n } from "~/i18n/i18n";

function Label({ className, render, ...props }: useRender.ComponentProps<"label">) {
  const { tText } = useI18n();
  const localizedProps = {
    ...props,
    ...(typeof props.children === "string" ? { children: tText(props.children) } : {}),
    ...(typeof props["aria-label"] === "string"
      ? { "aria-label": tText(props["aria-label"]) }
      : {}),
  };
  const defaultProps = {
    className: cn(
      "inline-flex items-center gap-2 text-base/4.5 sm:text-sm/4 font-medium text-foreground",
      className,
    ),
    "data-slot": "label",
  };

  return useRender({
    defaultTagName: "label",
    props: mergeProps<"label">(defaultProps, localizedProps),
    render,
  });
}

export { Label };
