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
    <div id="output" data-testid="output" />
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: test fixture click tracking
      dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', (e) => {
            const item = e.target.closest('[data-action]')
            if (item) document.getElementById('output').textContent = item.dataset.action
          })
        `,
      }}
    />
    <Menu.Root>
      <Menu.Trigger data-testid="trigger" data-action="trigger-clicked">
        Open Menu
      </Menu.Trigger>
      <Menu.Popover data-testid="list">
        <Menu.Item data-testid="item" data-action="item-clicked">
          Action
        </Menu.Item>
        <Menu.CheckboxItem data-testid="checkbox" data-action="checkbox-clicked" checked={false}>
          Bold
        </Menu.CheckboxItem>
        <Menu.RadioItem data-testid="radio-1" data-action="radio-1-clicked" checked>
          Light
        </Menu.RadioItem>
        <Menu.RadioItem data-testid="radio-2" data-action="radio-2-clicked" checked={false}>
          Dark
        </Menu.RadioItem>
      </Menu.Popover>
    </Menu.Root>
  </>
)
