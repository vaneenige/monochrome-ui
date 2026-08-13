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
  TriggerDialog = "mct:dialog-o",
  TriggerDialogClose = "mct:dialog-c",
  TriggerMenu = "mct:m",
  TriggerPopover = "mct:p",
  TriggerTabs = "mct:ta",
  TriggerTooltip = "mct:to",
  Content = "mcc:",
  ContentDialog = "mcc:d",
  ContentMenu = "mcc:m",
  ContentPopover = "mcc:p",
  ContentTooltip = "mcc:to",
  RootAccordion = "mcr:a",
}

if (typeof document !== "undefined") {
  let shouldPreventDefault: boolean | null = null;
  let shouldMatchLetter: string | null = null;
  let shouldResetRadio: HTMLElement | null = null;
  let radioHeadDone: boolean | null = null;
  let radioTailChain: HTMLElement[] = [];

  const menuPopovers: HTMLElement[] = [];
  let rovingBoundary: Element | null = null;

  let safeGroup: HTMLElement | null = null;
  let safeRect: DOMRect | null = null;
  let safeContent: HTMLElement | null = null;
  let safePopoverRect: DOMRect | null = null;

  let popoverOpen: HTMLElement | null = null;
  let dialogContent: HTMLDialogElement | null = null;
  let dialogTrigger: HTMLElement | null = null;

  let pointerTarget: EventTarget | null = null;
  let tooltipHovered: HTMLElement | null = null;
  let tooltipFocused: HTMLElement | null = null;
  let tooltipShown: HTMLElement | null = null;
  let tooltipSuppressed: HTMLElement | null = null;

  type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null;
  type RovingFocusCallback = (
    node: Element | null | undefined,
    fallback: RovingNavigator,
  ) => HTMLElement | null;
  type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator];

  const isElement = (el: unknown): el is HTMLElement => el instanceof HTMLElement;
  const isTrigger = (el: unknown, prefix?: string): el is HTMLButtonElement =>
    el instanceof HTMLButtonElement && (!prefix || el.id.startsWith(prefix));
  const isDialog = (el: unknown): el is HTMLDialogElement => el instanceof HTMLDialogElement;
  const isMenuItem = (el: unknown): el is HTMLElement =>
    isElement(el) && el.role?.startsWith("menuitem") === true && el.ariaDisabled !== "true";

  const getContent = (el: HTMLElement, attr: string) => {
    const id = el.getAttribute(attr);
    return id ? document.getElementById(id) : null;
  };

  const findAncestor = (el: HTMLElement | null, prefix: string): HTMLElement | null => {
    while (el) {
      if (el.id.startsWith(prefix)) return el;
      el = el.parentElement;
    }
    return null;
  };

  const position = (trigger: HTMLElement, content: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    content.style.setProperty("--top", `${rect.top}px`);
    content.style.setProperty("--right", `${rect.right}px`);
    content.style.setProperty("--bottom", `${rect.bottom}px`);
    content.style.setProperty("--left", `${rect.left}px`);
    content.style.setProperty("--pw", `${content.offsetWidth}px`);
    content.style.setProperty("--ph", `${content.offsetHeight}px`);
    return rect;
  };

  const roving: Roving = (focus) => {
    const next: RovingNavigator = (origin) =>
      origin
        ? focus(origin.nextElementSibling || origin.parentElement?.firstElementChild, next)
        : null;
    const previous: RovingNavigator = (origin) =>
      origin
        ? focus(origin.previousElementSibling || origin.parentElement?.lastElementChild, previous)
        : null;
    return [next, previous];
  };

  const menuRoving: RovingFocusCallback = (element, fallback) => {
    if (isElement(element)) {
      const menuitem = element.firstElementChild;
      if (shouldResetRadio) {
        if (rovingBoundary === element) {
          rovingBoundary = null;
          return null;
        }
        if (!rovingBoundary) rovingBoundary = element;
        if (isElement(menuitem)) {
          if (menuitem === shouldResetRadio) {
            for (const item of radioTailChain) item.ariaChecked = "false";
            return menuitem;
          }
          if (menuitem.role === "menuitemradio") {
            if (!radioHeadDone) {
              menuitem.ariaChecked = "false";
            } else {
              radioTailChain.push(menuitem);
            }
            return fallback(element);
          }
        }
        radioHeadDone = true;
        radioTailChain = [];
        return fallback(element);
      }
      if (
        isMenuItem(menuitem) &&
        (!shouldMatchLetter ||
          menuitem.textContent?.trim().toLowerCase().startsWith(shouldMatchLetter))
      ) {
        menuitem.focus();
        shouldPreventDefault = true;
        return menuitem;
      } else if (rovingBoundary !== element) {
        if (!rovingBoundary) rovingBoundary = element;
        return fallback(element);
      } else {
        rovingBoundary = null;
      }
    }
    return null;
  };

  const accordionRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) return null;
      if (!rovingBoundary) rovingBoundary = node;
      const trigger = node.firstElementChild?.firstElementChild;
      if (isTrigger(trigger, Prefix.TriggerAccordion)) {
        if (trigger.ariaDisabled === "true") return fallback(node);
        shouldPreventDefault = true;
        trigger.focus();
        return trigger;
      }
    }
    return fallback(node);
  };

  const tabsRoving: RovingFocusCallback = (node, fallback) => {
    if (isTrigger(node, Prefix.TriggerTabs)) {
      if (rovingBoundary === node) return null;
      if (!rovingBoundary) rovingBoundary = node;
      if (node.ariaDisabled === "true") return fallback(node);
      shouldPreventDefault = true;
      node.focus();
      return node;
    } else {
      return fallback(node);
    }
  };

  const [menuNext, menuPrevious] = roving(menuRoving);
  const [accordionNext, accordionPrevious] = roving(accordionRoving);
  const [tabNext, tabPrevious] = roving(tabsRoving);

  const collapsible = (trigger: HTMLElement) => {
    const content = getContent(trigger, "aria-controls");
    if (content) {
      const isOpen = trigger.ariaExpanded !== "true";
      trigger.ariaExpanded = isOpen ? "true" : "false";
      content.ariaHidden = isOpen ? "false" : "true";
      content.hidden = !isOpen;
    }
  };

  const accordion = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled === "true") return;
    if (trigger.ariaExpanded === "true") {
      collapsible(trigger);
    } else {
      const root = findAncestor(trigger, Prefix.RootAccordion);
      if (!root || root.getAttribute("data-mode") !== "single") {
        collapsible(trigger);
      } else {
        let item = root.firstElementChild;
        while (item) {
          const itemTrigger = item.firstElementChild?.firstElementChild;
          if (
            isElement(itemTrigger) &&
            (itemTrigger === trigger || itemTrigger.ariaExpanded === "true")
          ) {
            collapsible(itemTrigger);
          }
          item = item.nextElementSibling;
        }
      }
    }
  };

  const tabs = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled !== "true" && trigger.ariaSelected !== "true") {
      let tab = trigger.parentElement?.firstElementChild;
      while (tab) {
        if (isElement(tab) && (tab === trigger || tab.ariaSelected === "true")) {
          const content = getContent(tab, "aria-controls");
          if (content) {
            const isSelected = tab.ariaSelected !== "true";
            tab.ariaSelected = isSelected ? "true" : "false";
            tab.tabIndex = isSelected ? 0 : -1;
            content.ariaHidden = isSelected ? "false" : "true";
            if (content.hasAttribute("tabindex")) content.tabIndex = isSelected ? 0 : -1;
            content.hidden = !isSelected;
          }
        }
        tab = tab.nextElementSibling;
      }
    }
  };

  const menu = (trigger: HTMLElement | undefined, mode = Focus.Trigger) => {
    if (trigger?.id.startsWith(Prefix.TriggerMenu)) {
      const content = getContent(trigger, "aria-controls");
      if (content) {
        if (trigger.ariaExpanded === "true") {
          if (safeGroup) safeGroup.removeAttribute("data-safe");
          safeGroup = null;
          safeContent = null;
          safePopoverRect = null;
          if (mode !== Focus.None) trigger.focus();
          content.hidePopover();
          trigger.ariaExpanded = "false";
          content.ariaHidden = "true";
        } else if (trigger.ariaDisabled !== "true") {
          menuPopovers.push(trigger);
          content.showPopover();
          trigger.ariaExpanded = "true";
          content.ariaHidden = "false";
          const rect = position(trigger, content);
          const group = trigger.parentElement;
          if (group) {
            safeGroup = group;
            safeRect = rect;
            safeContent = content;
            safePopoverRect = null;
          }
          if (mode === Focus.Trigger) {
            trigger.focus();
          } else if (mode === Focus.First) {
            menuRoving(content.firstElementChild, menuNext);
          } else if (mode === Focus.Last) {
            menuRoving(content.lastElementChild, menuPrevious);
          }
        }
      }
    }
  };

  const menuHideAll = (keep = 0) => {
    while (menuPopovers[keep]) menu(menuPopovers.pop(), Focus.None);
  };

  const menuItemAction = (el: HTMLElement) => {
    if (el.role === "menuitemcheckbox") {
      el.ariaChecked = el.ariaChecked === "true" ? "false" : "true";
    } else if (el.role === "menuitemradio") {
      shouldResetRadio = el;
      radioHeadDone = null;
      radioTailChain = [];
      menuNext(el.parentElement);
      shouldResetRadio = null;
      el.ariaChecked = "true";
    } else {
      menuHideAll();
    }
  };

  const popover = (trigger: HTMLElement, show: boolean) => {
    if ((trigger.ariaExpanded === "true") === show) return;
    const content = getContent(trigger, "aria-controls");
    if (content) {
      if (show) {
        if (popoverOpen && popoverOpen !== trigger) popover(popoverOpen, false);
        content.showPopover();
        trigger.ariaExpanded = "true";
        content.ariaHidden = "false";
        position(trigger, content);
        popoverOpen = trigger;
      } else {
        content.hidePopover();
        trigger.ariaExpanded = "false";
        content.ariaHidden = "true";
        if (popoverOpen === trigger) popoverOpen = null;
      }
    }
  };

  const tooltip = (trigger: HTMLElement, show: boolean) => {
    const content = getContent(trigger, "aria-describedby");
    if (content) {
      if (show) {
        content.showPopover();
        position(trigger, content);
      } else {
        content.hidePopover();
      }
    }
  };

  const tooltipSync = () => {
    if (
      tooltipSuppressed &&
      tooltipSuppressed !== tooltipHovered &&
      tooltipSuppressed !== tooltipFocused
    ) {
      tooltipSuppressed = null;
    }
    const active = tooltipHovered ?? tooltipFocused;
    const next = active && active !== tooltipSuppressed ? active : null;
    if (next !== tooltipShown) {
      if (tooltipShown) tooltip(tooltipShown, false);
      if (next) tooltip(next, true);
      tooltipShown = next;
    }
  };

  const dialogOpenFor = (trigger: HTMLElement) => {
    if (dialogContent?.open) return;
    const content = getContent(trigger, "aria-controls");
    if (!isDialog(content)) return;
    dialogContent = content;
    dialogTrigger = trigger;
    content.showModal();
  };

  const dialogClose = () => {
    if (!dialogContent?.open || !dialogTrigger) return;
    const content = dialogContent;
    const trigger = dialogTrigger;
    dialogContent = null;
    dialogTrigger = null;
    content.close();
    trigger.focus();
  };

  addEventListener("click", (event: MouseEvent) => {
    shouldPreventDefault = null;
    rovingBoundary = null;
    const keyboard = event.detail === 0;
    const start: HTMLElement | null = isElement(event.target)
      ? event.target
      : event.target instanceof Element
        ? event.target.parentElement
        : null;
    if (start) {
      let target: HTMLElement | null = start;
      while (target) {
        const id = target.id;
        if (id.startsWith(Prefix.Trigger)) {
          if (id.startsWith(Prefix.TriggerMenu)) {
            if (popoverOpen) popover(popoverOpen, false);
            const focusMode = keyboard ? Focus.First : Focus.None;
            const inPopover = findAncestor(target.parentElement, Prefix.ContentMenu);
            if (inPopover) {
              if (!menuPopovers.includes(target)) menu(target, focusMode);
            } else {
              if (menuPopovers[0]) {
                const openTarget = target !== menuPopovers[0];
                menuHideAll();
                if (openTarget) menu(target, focusMode);
              } else {
                menu(target, focusMode);
              }
            }
          } else {
            if (menuPopovers[0]) menuHideAll();
            if (id.startsWith(Prefix.TriggerAccordion)) accordion(target);
            else if (id.startsWith(Prefix.TriggerCollapsible)) collapsible(target);
            else if (id.startsWith(Prefix.TriggerTabs)) tabs(target);
            else if (id.startsWith(Prefix.TriggerDialogClose)) dialogClose();
            else if (id.startsWith(Prefix.TriggerDialog) && target.ariaDisabled !== "true") {
              if (popoverOpen) popover(popoverOpen, false);
              if (tooltipShown) {
                tooltipSuppressed = tooltipShown;
                tooltipSync();
              }
              dialogOpenFor(target);
            } else if (id.startsWith(Prefix.TriggerPopover) && target.ariaDisabled !== "true") {
              const isOpen = target.ariaExpanded === "true";
              popover(target, !isOpen);
              if (isOpen) {
                target.focus();
              } else {
                getContent(target, "aria-controls")?.focus();
              }
            } else if (id.startsWith(Prefix.TriggerTooltip) && tooltipShown) {
              tooltipSuppressed = tooltipShown;
              tooltipSync();
            }
          }
          break;
        } else if (id.startsWith(Prefix.ContentMenu) && menuPopovers[0]) {
          let el: HTMLElement | null = start;
          while (el && el !== target) {
            if (isMenuItem(el) && !isTrigger(el, Prefix.TriggerMenu)) {
              menuItemAction(el);
              break;
            }
            el = el.parentElement;
          }
          break;
        } else if (id.startsWith(Prefix.ContentPopover)) {
          break;
        } else if (id.startsWith(Prefix.ContentTooltip)) {
          break;
        } else if (id.startsWith(Prefix.ContentDialog)) {
          break;
        }
        target = target.parentElement;
      }
      if (!target) {
        if (menuPopovers[0]) menuHideAll();
        if (popoverOpen) popover(popoverOpen, false);
      }
    }
    if (shouldPreventDefault) event.preventDefault();
  });

  addEventListener("pointermove", (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    if (event.target === pointerTarget && !menuPopovers[0]) return;
    pointerTarget = event.target;
    if (isElement(event.target) && !findAncestor(event.target, Prefix.ContentTooltip)) {
      const nextHover = findAncestor(event.target, Prefix.TriggerTooltip);
      if (nextHover !== tooltipHovered) {
        tooltipHovered = nextHover;
        tooltipSync();
      }
    }
    if (menuPopovers[0]) {
      if (menuPopovers[1] && safeGroup && safeRect && safeContent) {
        if (
          event.clientX >= safeRect.left &&
          event.clientX <= safeRect.right &&
          event.clientY >= safeRect.top &&
          event.clientY <= safeRect.bottom
        ) {
          safePopoverRect = safeContent.getBoundingClientRect();
          safeGroup.style.setProperty("--left", `${safePopoverRect.left}px`);
          safeGroup.style.setProperty("--right", `${safePopoverRect.right}px`);
          safeGroup.style.setProperty("--top", `${safePopoverRect.top}px`);
          safeGroup.style.setProperty("--bottom", `${safePopoverRect.bottom}px`);
          safeGroup.style.setProperty("--x", `${event.clientX}px`);
          safeGroup.style.setProperty("--y", `${event.clientY}px`);
          if (!safeGroup.hasAttribute("data-safe")) safeGroup.setAttribute("data-safe", "");
        } else if (
          safeGroup.hasAttribute("data-safe") &&
          safePopoverRect &&
          (event.target !== safeGroup ||
            (safePopoverRect.left - safeRect.right) * event.movementX < 0)
        ) {
          safeGroup.removeAttribute("data-safe");
        }
      }
      const el = event.target;
      if (isElement(el)) {
        const popoverTriggers: HTMLButtonElement[] = [];
        let target: HTMLElement | null = el;
        let bail = false;
        let foundItem = false;
        while (target) {
          if (isMenuItem(target)) {
            foundItem = true;
          }
          if (!foundItem && target.id.startsWith(Prefix.Content)) {
            bail = true;
            break;
          }
          if (isTrigger(target, Prefix.TriggerMenu)) {
            popoverTriggers.unshift(target);
          } else if (target.id.startsWith(Prefix.ContentMenu)) {
            const trigger = getContent(target, "aria-labelledby");
            if (isTrigger(trigger, Prefix.TriggerMenu)) {
              popoverTriggers.unshift(trigger);
            }
          }
          target = target.parentElement;
        }
        if (!bail && popoverTriggers[0]) {
          let i = 0;
          while (menuPopovers[i] && menuPopovers[i] === popoverTriggers[i]) i++;
          if (
            i === 0 &&
            (popoverTriggers[0].role !== "menuitem" ||
              popoverTriggers[0].parentElement?.parentElement !==
                menuPopovers[0].parentElement?.parentElement)
          )
            return;
          menuHideAll(i);
          menu(popoverTriggers[i], Focus.None);
        }
      }
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    shouldPreventDefault = null;
    shouldMatchLetter = null;
    rovingBoundary = null;
    const target = event.target;
    if (isTrigger(target, Prefix.TriggerAccordion)) {
      const item = target.parentElement?.parentElement;
      if (item) {
        switch (event.key) {
          case "ArrowDown":
            accordionNext(item);
            break;
          case "ArrowUp":
            accordionPrevious(item);
            break;
          case "Home": {
            const root = item.parentElement;
            if (root) accordionRoving(root.firstElementChild, accordionNext);
            break;
          }
          case "End": {
            const root = item.parentElement;
            if (root) accordionRoving(root.lastElementChild, accordionPrevious);
            break;
          }
        }
      }
    } else if (isTrigger(target, Prefix.TriggerTabs)) {
      const vertical = target.parentElement?.ariaOrientation === "vertical";
      switch (event.key) {
        case "ArrowDown":
          if (vertical) tabNext(target);
          break;
        case "ArrowUp":
          if (vertical) tabPrevious(target);
          break;
        case "ArrowRight":
          if (!vertical) tabNext(target);
          break;
        case "ArrowLeft":
          if (!vertical) tabPrevious(target);
          break;
        case "Home":
          tabsRoving(target.parentElement?.firstElementChild, tabNext);
          break;
        case "End":
          tabsRoving(target.parentElement?.lastElementChild, tabPrevious);
          break;
      }
    } else {
      if (isTrigger(target, Prefix.TriggerMenu)) {
        const isRootTrigger = findAncestor(target, Prefix.ContentMenu) === null;
        switch (event.key) {
          case "ArrowDown":
            if (isRootTrigger) {
              if (target.ariaExpanded !== "true") {
                menu(target, Focus.First);
              } else {
                const content = getContent(target, "aria-controls");
                if (content) menuRoving(content.firstElementChild, menuNext);
              }
            }
            break;
          case "ArrowUp":
            if (isRootTrigger) {
              if (target.ariaExpanded !== "true") {
                menu(target, Focus.Last);
              } else {
                const content = getContent(target, "aria-controls");
                if (content) menuRoving(content.lastElementChild, menuPrevious);
              }
            }
            break;
          case "ArrowRight":
            if (!isRootTrigger) menu(target, Focus.First);
            break;
        }
      }
      if (
        !shouldPreventDefault &&
        isElement(target) &&
        target.role?.startsWith("menuitem") &&
        target.parentElement
      ) {
        const parent = target.parentElement;
        const menubarRoot = menuPopovers[0]?.parentElement || parent;
        const inPopover = findAncestor(target.parentElement, Prefix.ContentMenu);
        switch (event.key) {
          case "Tab":
            if (menuPopovers[0]) menuPopovers[0].focus();
            menuHideAll();
            break;
          case "ArrowDown":
            if (inPopover) menuNext(parent);
            break;
          case "ArrowUp":
            if (inPopover) menuPrevious(parent);
            break;
          case "ArrowRight": {
            const nextNode = menuNext(menubarRoot);
            if (nextNode) {
              const hadOpenMenu = menuPopovers[0];
              menuHideAll();
              if (hadOpenMenu && isTrigger(nextNode, Prefix.TriggerMenu)) {
                menu(nextNode, Focus.None);
              }
            }
            break;
          }
          case "ArrowLeft":
            if (menuPopovers[1]) {
              menu(menuPopovers.pop(), Focus.Trigger);
            } else {
              const nextNode = menuPrevious(menubarRoot);
              if (nextNode) {
                const hadOpenMenu = menuPopovers[0];
                menuHideAll();
                if (hadOpenMenu && isTrigger(nextNode, Prefix.TriggerMenu)) {
                  menu(nextNode, Focus.None);
                }
              }
            }
            break;
          case "Home":
            menuRoving(parent.parentElement?.firstElementChild, menuNext);
            break;
          case "End":
            menuRoving(parent.parentElement?.lastElementChild, menuPrevious);
            break;
          default:
            if (/^[a-zA-Z]$/.test(event.key)) {
              shouldMatchLetter = event.key.toLowerCase();
              menuNext(parent);
            }
            break;
        }
      }
    }
    if (event.key === "Escape") {
      if (tooltipShown) {
        tooltipSuppressed = tooltipShown;
        tooltipSync();
        shouldPreventDefault = true;
      } else if (menuPopovers[0]) {
        menu(menuPopovers.pop(), Focus.Trigger);
        shouldPreventDefault = true;
      } else if (popoverOpen) {
        const trigger = popoverOpen;
        popover(trigger, false);
        trigger.focus();
        shouldPreventDefault = true;
      } else if (dialogContent) {
        dialogClose();
      }
    }
    if (shouldPreventDefault) event.preventDefault();
  });

  addEventListener(
    "scroll",
    (event) => {
      if (
        menuPopovers[0] &&
        !(isElement(event.target) && findAncestor(event.target, Prefix.ContentMenu))
      ) {
        menuHideAll();
      }
      if (
        popoverOpen &&
        !(isElement(event.target) && findAncestor(event.target, Prefix.ContentPopover))
      ) {
        popover(popoverOpen, false);
      }
      if (tooltipShown) {
        tooltipHovered = null;
        tooltipFocused = null;
        tooltipSync();
      }
      pointerTarget = null;
    },
    true,
  );

  addEventListener("resize", () => {
    if (menuPopovers[0]) menuHideAll();
    if (popoverOpen) popover(popoverOpen, false);
    if (tooltipShown) {
      tooltipHovered = null;
      tooltipFocused = null;
      tooltipSync();
    }
    pointerTarget = null;
  });

  addEventListener("focusin", (event: FocusEvent) => {
    const target = event.target;
    if (isTrigger(target, Prefix.TriggerTooltip)) {
      if (tooltipFocused !== target) {
        tooltipFocused = target;
        tooltipSync();
      }
    } else if (tooltipFocused) {
      tooltipFocused = null;
      tooltipSync();
    }
  });

  addEventListener("focusout", (event: FocusEvent) => {
    if (
      popoverOpen &&
      isElement(event.relatedTarget) &&
      popoverOpen !== event.relatedTarget &&
      !getContent(popoverOpen, "aria-controls")?.contains(event.relatedTarget)
    ) {
      popover(popoverOpen, false);
    }
    if (tooltipFocused && event.target === tooltipFocused && !event.relatedTarget) {
      tooltipFocused = null;
      tooltipSync();
    }
  });
}
