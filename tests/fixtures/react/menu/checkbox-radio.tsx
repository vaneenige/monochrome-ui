import { Menu } from "monochrome/react"

export default () => (
  <>
    <style>{`
      [role="menu"] {
        position: fixed;
        inset: auto;
        margin: 0;
        top: var(--bottom);
        left: var(--left);
      }
    `}</style>
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Menu.Root>
      <Menu.Trigger data-testid="trigger">Open Menu</Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.CheckboxItem data-testid="checkbox-1" checked={false}>
          Bold
        </Menu.CheckboxItem>
        <Menu.CheckboxItem data-testid="checkbox-2" checked>
          Italic
        </Menu.CheckboxItem>
        <Menu.CheckboxItem data-testid="checkbox-disabled" checked={false} disabled>
          Strikethrough
        </Menu.CheckboxItem>
        <Menu.Separator data-testid="separator-1" />
        <Menu.RadioItem data-testid="radio-a1" checked>
          Small
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-a2" checked={false}>
          Medium
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-a3" checked={false}>
          Large
        </Menu.RadioItem>
        <Menu.Separator data-testid="separator-2" />
        <Menu.RadioItem data-testid="radio-b1" checked>
          Red
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-b2" checked={false}>
          Blue
        </Menu.RadioItem>
        <Menu.Item data-testid="regular-item">Regular Action</Menu.Item>
      </Menu.Popover>
    </Menu.Root>
    <button type="button" data-testid="focus-after">
      Focus after
    </button>
  </>
)
