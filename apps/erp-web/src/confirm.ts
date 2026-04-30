type ConfirmDestructiveOptions = {
  keyword?: string;
  secondaryPrompt?: string;
};

export function confirmDestructiveAction(primaryPrompt: string, options?: ConfirmDestructiveOptions): boolean {
  const keyword = options?.keyword ?? "DELETE";
  const secondaryPrompt =
    options?.secondaryPrompt ?? `Type ${keyword} to confirm this action.`;

  if (!window.confirm(primaryPrompt)) {
    return false;
  }

  const typed = window.prompt(secondaryPrompt)?.trim().toUpperCase();
  return typed === keyword;
}
