/**
 * @file Combined core entry.
 *
 * Side-effect imports every component so `import "monochrome"`
 * registers all listeners. Components do not import each other.
 * Overlay exclusivity (menu vs popover, tooltip Escape before
 * menu) falls out of ordinary pointer, click, and capture
 * keydown, not a named stack in this file.
 */
import "./accordion.js";
import "./collapsible.js";
import "./dialog.js";
import "./menu.js";
import "./popover.js";
import "./tabs.js";
import "./tooltip.js";
