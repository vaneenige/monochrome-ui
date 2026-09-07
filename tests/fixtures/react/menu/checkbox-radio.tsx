import { Menu } from "monochrome/react";

export default () => (
  <>
    <button type="button" data-testid="focus-before">
      Focus before
    </button>
    <Menu.Root>
      <Menu.Trigger data-testid="trigger">Open Menu</Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.CheckboxItem data-testid="checkbox-1" defaultChecked={false}>
          Bold
        </Menu.CheckboxItem>
        <Menu.CheckboxItem data-testid="checkbox-2" defaultChecked>
          Italic
        </Menu.CheckboxItem>
        <Menu.CheckboxItem data-testid="checkbox-disabled" defaultChecked={false} disabled>
          Strikethrough
        </Menu.CheckboxItem>
        <Menu.Separator data-testid="separator-1" />
        <Menu.RadioItem data-testid="radio-a1" defaultChecked>
          Small
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-a2" defaultChecked={false}>
          Medium
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-a3" defaultChecked={false}>
          Large
        </Menu.RadioItem>
        <Menu.Separator data-testid="separator-2" />
        <Menu.RadioItem data-testid="radio-b1" defaultChecked>
          Red
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-b2" defaultChecked={false}>
          Blue
        </Menu.RadioItem>
        <Menu.Item data-testid="regular-item">Regular Action</Menu.Item>
      </Menu.Popover>
    </Menu.Root>
    <button type="button" data-testid="focus-after">
      Focus after
    </button>
  </>
);
