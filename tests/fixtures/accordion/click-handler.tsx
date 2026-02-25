import { Accordion } from "monochrome/react"

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
    <Accordion.Root type="single">
      <Accordion.Item>
        <Accordion.Header>
          <Accordion.Trigger data-testid="trigger" data-action="trigger-clicked">
            Section 1
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel data-testid="content">
          <p>Content</p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  </>
)
