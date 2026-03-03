import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react"

export type BaseProps = HTMLAttributes<HTMLElement> & { children: ReactNode }

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base)

export const HiddenUntilFound = (): ReactElement =>
  createElement("script", {
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static string, no user input
    dangerouslySetInnerHTML: {
      __html: "document.currentScript.parentNode.setAttribute('hidden','until-found')",
    },
  })
