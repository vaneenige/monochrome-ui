enum Focus {
  Trigger,
  First,
  Last,
  None,
}

enum Prefix {
  Trigger = "mct:",
  TriggerAccordion = "mct:a",
  TriggerCollapsible = "mct:c",
  TriggerMenu = "mct:m",
  TriggerTabs = "mct:t",
  Content = "mcc:",
  ContentMenu = "mcc:m",
  RootAccordion = "mcr:a",
}

if (typeof document !== "undefined") {
  let shouldPreventDefault: boolean | null = null
  let shouldMatchLetter: string | null = null
  let shouldResetRadio: HTMLElement | null = null
  let radioHeadDone: boolean | null = null
  let radioTailChain: HTMLElement[] = []
  const menuPopovers: HTMLElement[] = []
  let rovingBoundary: Element | null = null
  let safeGroup: HTMLElement | null = null
  let safeRect: DOMRect | null = null
  let safeDir = 0

  type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null
  type RovingFocusCallback = (
    node: Element | null | undefined,
    fallback: RovingNavigator,
  ) => HTMLElement | null
  type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator]

  const isElement = (el: unknown): el is HTMLElement => el instanceof HTMLElement

  const isTrigger = (el: unknown, prefix?: string): el is HTMLButtonElement =>
    el instanceof HTMLButtonElement && (!prefix || el.id.startsWith(prefix))

  const isMenuItem = (el: unknown): el is HTMLElement =>
    isElement(el) && el.role?.startsWith("menuitem") === true && el.ariaDisabled !== "true"

  const getContent = (el: HTMLElement): HTMLElement | null =>
    document.getElementById(el.getAttribute("aria-controls") || "")

  const findAncestor = (el: HTMLElement | null, prefix: string): HTMLElement | null => {
    while (el) {
      if (el.id.startsWith(prefix)) return el
      el = el.parentElement
    }
    return null
  }

  const roving: Roving = (focus) => {
    const next: RovingNavigator = (origin) =>
      origin
        ? focus(origin.nextElementSibling || origin.parentElement?.firstElementChild, next)
        : null
    const previous: RovingNavigator = (origin) =>
      origin
        ? focus(origin.previousElementSibling || origin.parentElement?.lastElementChild, previous)
        : null
    return [next, previous]
  }

  const menuRoving: RovingFocusCallback = (element, fallback) => {
    if (isElement(element)) {
      const menuitem = element.firstElementChild
      if (shouldResetRadio) {
        if (isElement(menuitem)) {
          if (menuitem === shouldResetRadio) {
            for (const item of radioTailChain) item.ariaChecked = "false"
            return menuitem
          }
          if (menuitem.role === "menuitemradio") {
            if (!radioHeadDone) {
              menuitem.ariaChecked = "false"
            } else {
              radioTailChain.push(menuitem)
            }
            return fallback(element)
          }
        }
        radioHeadDone = true
        radioTailChain = []
        return fallback(element)
      }
      if (
        isMenuItem(menuitem) &&
        (!shouldMatchLetter || menuitem.textContent?.toLowerCase().startsWith(shouldMatchLetter))
      ) {
        menuitem.focus()
        shouldPreventDefault = true
        return menuitem
      } else if (rovingBoundary !== element) {
        if (!rovingBoundary) rovingBoundary = element
        return fallback(element)
      } else {
        rovingBoundary = null
      }
    }
    return null
  }

  const accordionRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) return null
      if (!rovingBoundary) rovingBoundary = node
      const trigger = node.firstElementChild?.firstElementChild
      if (isTrigger(trigger, Prefix.TriggerAccordion)) {
        if (trigger.ariaDisabled === "true") return fallback(node)
        shouldPreventDefault = true
        trigger.focus()
        return trigger
      }
    }
    return fallback(node)
  }

  const tabsRoving: RovingFocusCallback = (node, fallback) => {
    if (isTrigger(node, Prefix.TriggerTabs)) {
      if (rovingBoundary === node) return null
      if (!rovingBoundary) rovingBoundary = node
      if (node.ariaDisabled === "true") return fallback(node)
      shouldPreventDefault = true
      node.focus()
      return node
    } else {
      return fallback(node)
    }
  }

  const [menuNext, menuPrevious] = roving(menuRoving)
  const [accordionNext, accordionPrevious] = roving(accordionRoving)
  const [tabNext, tabPrevious] = roving(tabsRoving)

  const collapsible = (trigger: HTMLElement) => {
    const content = getContent(trigger)
    if (content) {
      const isOpen = trigger.ariaExpanded !== "true"
      trigger.ariaExpanded = isOpen ? "true" : "false"
      content.ariaHidden = isOpen ? "false" : "true"
      isOpen ? content.removeAttribute("hidden") : content.setAttribute("hidden", "until-found")
    }
  }

  const accordion = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled === "true") return
    if (trigger.ariaExpanded === "true") {
      collapsible(trigger)
    } else {
      const root = findAncestor(trigger, Prefix.RootAccordion)
      if (!root || root.getAttribute("data-mode") !== "single") {
        collapsible(trigger)
      } else {
        let item = root.firstElementChild
        while (item) {
          const itemTrigger = item.firstElementChild?.firstElementChild
          if (
            isElement(itemTrigger) &&
            (itemTrigger === trigger || itemTrigger.ariaExpanded === "true")
          ) {
            collapsible(itemTrigger)
          }
          item = item.nextElementSibling
        }
      }
    }
  }

  const tabs = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled !== "true" && trigger.ariaSelected !== "true") {
      let tab = trigger.parentElement?.firstElementChild
      while (isElement(tab)) {
        if (tab === trigger || tab.ariaSelected === "true") {
          const content = getContent(tab)
          if (content) {
            const isSelected = tab.ariaSelected !== "true"
            tab.ariaSelected = isSelected ? "true" : "false"
            tab.tabIndex = isSelected ? 0 : -1
            content.ariaHidden = isSelected ? "false" : "true"
            if (content.hasAttribute("tabindex")) content.tabIndex = isSelected ? 0 : -1
            isSelected
              ? content.removeAttribute("hidden")
              : content.setAttribute("hidden", "until-found")
          }
        }
        tab = tab.nextElementSibling
      }
    }
  }

  const menu = (trigger: HTMLElement | undefined, mode = Focus.Trigger) => {
    if (trigger?.id.startsWith(Prefix.TriggerMenu)) {
      const content = getContent(trigger)
      if (content) {
        if (trigger.ariaExpanded === "true") {
          if (safeGroup) safeGroup.removeAttribute("data-safe")
          safeGroup = null
          if (mode !== Focus.None) trigger.focus()
          content.hidePopover()
          trigger.ariaExpanded = "false"
          content.ariaHidden = "true"
        } else {
          menuPopovers.push(trigger)
          content.showPopover()
          trigger.ariaExpanded = "true"
          content.ariaHidden = "false"
          const rect = trigger.getBoundingClientRect()
          content.style.setProperty("--top", `${rect.top}px`)
          content.style.setProperty("--right", `${rect.right}px`)
          content.style.setProperty("--bottom", `${rect.bottom}px`)
          content.style.setProperty("--left", `${rect.left}px`)
          const group = trigger.parentElement
          if (group) {
            const cr = content.getBoundingClientRect()
            const right = cr.left > rect.right
            const sx = right ? cr.left : cr.right
            safeGroup = group
            safeRect = rect
            safeDir = right ? -4 : 4
            group.style.setProperty("--right", `${sx}px`)
            group.style.setProperty("--top", `${cr.top}px`)
            group.style.setProperty("--bottom", `${cr.bottom}px`)
          }
          if (mode === Focus.Trigger) {
            trigger.focus()
          } else if (mode === Focus.First) {
            menuRoving(content.firstElementChild, menuNext)
          } else if (mode === Focus.Last) {
            menuRoving(content.lastElementChild, menuPrevious)
          }
        }
      }
    }
  }

  const menuHideAll = (keep = 0) => {
    while (menuPopovers[keep]) menu(menuPopovers.pop(), Focus.None)
  }

  const menuItemAction = (el: HTMLElement) => {
    if (el.role === "menuitemcheckbox") {
      el.ariaChecked = el.ariaChecked === "true" ? "false" : "true"
    } else if (el.role === "menuitemradio") {
      shouldResetRadio = el
      radioHeadDone = null
      radioTailChain = []
      menuNext(el.parentElement)
      shouldResetRadio = null
      el.ariaChecked = "true"
    } else {
      menuHideAll()
    }
  }

  addEventListener("click", (event: MouseEvent) => {
    shouldPreventDefault = null
    const keyboard = event.detail === 0

    const start: HTMLElement | null = isElement(event.target)
      ? event.target
      : event.target instanceof Element
        ? event.target.parentElement
        : null

    if (start) {
      let target: HTMLElement | null = start

      while (target) {
        const id = target.id

        if (id.startsWith(Prefix.Trigger)) {
          if (id.startsWith(Prefix.TriggerMenu)) {
            const focusMode = keyboard ? Focus.First : Focus.None
            const inPopover = findAncestor(target.parentElement, Prefix.ContentMenu)
            if (inPopover) {
              if (!menuPopovers.includes(target)) menu(target, focusMode)
            } else {
              if (menuPopovers[0]) {
                const openTarget = target !== menuPopovers[0]
                menuHideAll()
                if (openTarget) menu(target, focusMode)
              } else {
                menu(target, focusMode)
              }
            }
          } else {
            if (menuPopovers[0]) menuHideAll()
            if (id.startsWith(Prefix.TriggerAccordion)) accordion(target)
            else if (id.startsWith(Prefix.TriggerCollapsible)) collapsible(target)
            else if (id.startsWith(Prefix.TriggerTabs)) tabs(target)
          }
          break
        } else if (id.startsWith(Prefix.ContentMenu) && menuPopovers[0]) {
          let el: HTMLElement | null = start
          while (el && el !== target) {
            if (isMenuItem(el) && !isTrigger(el, Prefix.TriggerMenu)) {
              menuItemAction(el)
              break
            }
            el = el.parentElement
          }
          break
        }

        target = target.parentElement
      }

      if (!target && menuPopovers[0]) menuHideAll()
    }

    if (shouldPreventDefault) event.preventDefault()
  })

  addEventListener("pointermove", (event: PointerEvent) => {
    if (event.pointerType === "touch") return
    if (menuPopovers[0]) {
      if (menuPopovers[1] && safeGroup && safeRect) {
        if (
          event.clientX >= safeRect.left &&
          event.clientX <= safeRect.right &&
          event.clientY >= safeRect.top &&
          event.clientY <= safeRect.bottom
        ) {
          safeGroup.style.setProperty("--left", `${event.clientX + safeDir}px`)
          safeGroup.style.setProperty("--center", `${event.clientY}px`)
          if (!safeGroup.hasAttribute("data-safe")) safeGroup.setAttribute("data-safe", "")
        } else if (
          safeGroup.hasAttribute("data-safe") &&
          (event.target !== safeGroup || safeDir * event.movementX > 0)
        ) {
          safeGroup.removeAttribute("data-safe")
        }
      }
      const el = event.target

      if (isElement(el)) {
        const popoverTriggers: HTMLButtonElement[] = []
        let target: HTMLElement | null = el
        let bail = false
        let foundItem = false

        while (target) {
          if (isMenuItem(target)) {
            foundItem = true
          }
          if (!foundItem && target.id.startsWith(Prefix.Content)) {
            bail = true
            break
          }
          const firstChild = target.firstElementChild
          if (isTrigger(firstChild, Prefix.TriggerMenu)) {
            popoverTriggers.unshift(firstChild)
          }
          target = target.parentElement
        }

        if (!bail && popoverTriggers[0]) {
          let i = 0
          while (menuPopovers[i] && menuPopovers[i] === popoverTriggers[i]) i++
          if (i === 0 && popoverTriggers[0].role !== "menuitem") return
          menuHideAll(i)
          menu(popoverTriggers[i], Focus.None)
        }
      }
    }
  })

  addEventListener("keydown", (event: KeyboardEvent) => {
    shouldPreventDefault = null
    shouldMatchLetter = null
    rovingBoundary = null

    const target = event.target

    if (isTrigger(target, Prefix.TriggerAccordion)) {
      const item = target.parentElement?.parentElement
      if (item) {
        switch (event.key) {
          case "ArrowDown":
            accordionNext(item)
            break
          case "ArrowUp":
            accordionPrevious(item)
            break
          case "Home": {
            const root = item.parentElement
            if (root) accordionRoving(root.firstElementChild, accordionNext)
            break
          }
          case "End": {
            const root = item.parentElement
            if (root) accordionRoving(root.lastElementChild, accordionPrevious)
            break
          }
        }
      }
    } else if (isTrigger(target, Prefix.TriggerTabs)) {
      const vertical = target.parentElement?.ariaOrientation === "vertical"
      switch (event.key) {
        case "ArrowDown":
          if (vertical) tabNext(target)
          break
        case "ArrowUp":
          if (vertical) tabPrevious(target)
          break
        case "ArrowRight":
          if (!vertical) tabNext(target)
          break
        case "ArrowLeft":
          if (!vertical) tabPrevious(target)
          break
        case "Home":
          tabsRoving(target.parentElement?.firstElementChild, tabNext)
          break
        case "End":
          tabsRoving(target.parentElement?.lastElementChild, tabPrevious)
          break
      }
    } else {
      if (isTrigger(target, Prefix.TriggerMenu)) {
        const isRootTrigger = findAncestor(target, Prefix.ContentMenu) === null

        switch (event.key) {
          case "ArrowDown":
            if (isRootTrigger) {
              if (target.ariaExpanded !== "true") {
                menu(target, Focus.First)
              } else {
                const content = getContent(target)
                if (content) menuRoving(content.firstElementChild, menuNext)
              }
            }
            break
          case "ArrowUp":
            if (isRootTrigger) {
              if (target.ariaExpanded !== "true") {
                menu(target, Focus.Last)
              } else {
                const content = getContent(target)
                if (content) menuRoving(content.lastElementChild, menuPrevious)
              }
            }
            break
          case "ArrowRight":
            if (!isRootTrigger) menu(target, Focus.First)
            break
        }
      }

      if (
        !shouldPreventDefault &&
        isElement(target) &&
        target.role?.startsWith("menuitem") &&
        target.parentElement
      ) {
        const parent = target.parentElement
        const menubarRoot = menuPopovers[0]?.parentElement || parent

        const inPopover = findAncestor(target.parentElement, Prefix.ContentMenu)

        switch (event.key) {
          case "Tab":
            if (menuPopovers[0]) menuPopovers[0].focus()
            menuHideAll()
            break
          case "ArrowDown":
            if (inPopover) menuNext(parent)
            break
          case "ArrowUp":
            if (inPopover) menuPrevious(parent)
            break
          case "ArrowRight": {
            const nextNode = menuNext(menubarRoot)
            if (nextNode) {
              const hadOpenMenu = menuPopovers[0]
              menuHideAll()
              if (hadOpenMenu && isTrigger(nextNode, Prefix.TriggerMenu)) {
                menu(nextNode, Focus.None)
              }
            }
            break
          }
          case "ArrowLeft":
            if (menuPopovers[1]) {
              menu(menuPopovers.pop(), Focus.Trigger)
            } else {
              const nextNode = menuPrevious(menubarRoot)
              if (nextNode) {
                const hadOpenMenu = menuPopovers[0]
                menuHideAll()
                if (hadOpenMenu && isTrigger(nextNode, Prefix.TriggerMenu)) {
                  menu(nextNode, Focus.None)
                }
              }
            }
            break
          case "Home":
            menuRoving(parent.parentElement?.firstElementChild, menuNext)
            break
          case "End":
            menuRoving(parent.parentElement?.lastElementChild, menuPrevious)
            break
          default:
            if (/^[a-zA-Z]$/.test(event.key)) {
              shouldMatchLetter = event.key.toLowerCase()
              menuNext(parent)
            }
            break
        }
      }
    }

    if (event.key === "Escape" && menuPopovers[0]) {
      menu(menuPopovers.pop(), Focus.Trigger)
    }

    if (shouldPreventDefault) event.preventDefault()
  })

  addEventListener(
    "scroll",
    (event) => {
      if (
        menuPopovers[0] &&
        (!isElement(event.target) || !event.target.id.startsWith(Prefix.ContentMenu))
      ) {
        menuHideAll()
      }
    },
    true,
  )

  addEventListener("resize", () => {
    if (menuPopovers[0]) menuHideAll()
  })

  addEventListener("beforematch", (event) => {
    if (isElement(event.target)) {
      let target: HTMLElement | null = event.target
      while (target) {
        const triggerId = target.getAttribute("aria-labelledby")
        if (triggerId) {
          const trigger = document.getElementById(triggerId)
          if (isTrigger(trigger, Prefix.TriggerAccordion)) {
            if (trigger.ariaExpanded !== "true") accordion(trigger)
          } else if (isTrigger(trigger, Prefix.TriggerCollapsible)) {
            if (trigger.ariaExpanded !== "true") collapsible(trigger)
          } else if (isTrigger(trigger, Prefix.TriggerTabs)) {
            tabs(trigger)
          }
        }
        target = target.parentElement
      }
    }
  })
}
