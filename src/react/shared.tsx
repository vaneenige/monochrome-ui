"use client"

import type { HTMLAttributes, ReactNode } from "react"

export type BaseProps = HTMLAttributes<HTMLElement> & { children: ReactNode }

export const buildId = (base: string, id?: string) => (id ? `${base}:${id}` : base)

export const HiddenUntilFound = () => (
  <script
    // biome-ignore lint/security/noDangerouslySetInnerHtml: SSR hydration
    dangerouslySetInnerHTML={{
      __html: "document.currentScript.parentNode.setAttribute('hidden','until-found')",
    }}
  />
)
