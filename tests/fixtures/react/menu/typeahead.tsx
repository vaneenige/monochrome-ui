import { Menu } from "monochrome/react"

export default () => (
  <>
    <fieldset>
      <legend>Cyclic typeahead</legend>
      <Menu.Root>
        <Menu.Trigger data-testid="typeahead-trigger">MenuTrigger</Menu.Trigger>
        <Menu.Popover data-testid="typeahead-list">
          <Menu.Item data-testid="typeahead-item-1">Apple</Menu.Item>
          <Menu.Item data-testid="typeahead-item-2">Banana</Menu.Item>
          <Menu.Item data-testid="typeahead-item-3">Avocado</Menu.Item>
          <Menu.Item data-testid="typeahead-item-4" disabled>
            Apricot
          </Menu.Item>
          <Menu.Item data-testid="typeahead-item-5">Artichoke</Menu.Item>
        </Menu.Popover>
      </Menu.Root>
    </fieldset>
  </>
)
