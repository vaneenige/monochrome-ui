import { Tooltip } from "@/components/ui/tooltip";

export function SaveTooltip() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>Save</Tooltip.Trigger>
      <Tooltip.Content>Saves a copy to your drive</Tooltip.Content>
    </Tooltip.Root>
  );
}
