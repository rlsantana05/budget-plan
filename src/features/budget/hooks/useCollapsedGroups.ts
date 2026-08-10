import { useCallback, useState } from 'react';

export function useCollapsedGroups() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isCollapsed = useCallback(
    (id: string) => collapsed[id] ?? false,
    [collapsed],
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  }, []);

  return { isCollapsed, toggleCollapse };
}