import { Collapsible } from "monochrome/react"

export default () => (
  <>
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
    <Collapsible.Root>
      <Collapsible.Trigger data-testid="trigger" data-action="trigger-clicked">
        Toggle
      </Collapsible.Trigger>
      <Collapsible.Panel data-testid="content">
        <p>Content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  </>
)
