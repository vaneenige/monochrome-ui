<script setup lang="ts">
import { Menubar } from "monochrome/vue"
</script>

<template>
  <Menubar.Root data-testid="menubar-list">
    <Menubar.Menu>
      <Menubar.Trigger data-testid="menubar-trigger-1">
        MenuTrigger 1
      </Menubar.Trigger>
      <Menubar.Popover data-testid="menubar-list-1">
        <Menubar.Item data-testid="menubar-item-1-1">
          MenuItem 1.1
        </Menubar.Item>
        <Menubar.Item>
          MenuItem 1.2
        </Menubar.Item>
        <Menubar.Item>
          MenuItem 1.3
        </Menubar.Item>
        <Menubar.Group>
          <Menubar.Trigger data-testid="menubar-submenu-trigger-1">
            Submenu 1
          </Menubar.Trigger>
          <Menubar.Popover data-testid="menubar-submenu-list-1">
            <Menubar.Item data-testid="menubar-submenu-item-1-1">
              Submenu Item 1.1
            </Menubar.Item>
            <Menubar.Item>
              Submenu Item 1.2
            </Menubar.Item>
          </Menubar.Popover>
        </Menubar.Group>
      </Menubar.Popover>
    </Menubar.Menu>
    <Menubar.Item data-testid="menubar-item-1">
      MenuItem 1
    </Menubar.Item>
    <Menubar.Menu>
      <Menubar.Trigger data-testid="menubar-trigger-2">
        MenuTrigger 2
      </Menubar.Trigger>
      <Menubar.Popover data-testid="menubar-list-2">
        <Menubar.Item data-testid="menubar-item-2-1">
          MenuItem 2.1
        </Menubar.Item>
        <Menubar.Item>
          MenuItem 2.2
        </Menubar.Item>
        <Menubar.Item>
          MenuItem 2.3
        </Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
    <Menubar.Menu>
      <Menubar.Trigger data-testid="menubar-trigger-3">
        MenuTrigger 3
      </Menubar.Trigger>
      <Menubar.Popover data-testid="menubar-list-3">
        <Menubar.Item>
          MenuItem 3.1
        </Menubar.Item>
        <Menubar.Item>
          MenuItem 3.2
        </Menubar.Item>
        <Menubar.Item>
          MenuItem 3.3
        </Menubar.Item>
      </Menubar.Popover>
    </Menubar.Menu>
  </Menubar.Root>
</template>
