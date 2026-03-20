import { useQueryState } from 'nuqs';

export const useWorkspaceSidebarToggle = () => {
  const [workspaceSidebar, setWorkspaceSidebar] = useQueryState('workspaceSidebar');
  const workspaceSidebarOpen = workspaceSidebar !== '0';

  const onOpenWorkspaceSidebar = () => {
    setWorkspaceSidebar(null);
  };

  const onCloseWorkspaceSidebar = () => {
    setWorkspaceSidebar('0');
  };

  const onToggleWorkspaceSidebar = () => {
    if (workspaceSidebarOpen) {
      onCloseWorkspaceSidebar();
      return;
    }

    onOpenWorkspaceSidebar();
  };

  return {
    workspaceSidebarOpen,
    onOpenWorkspaceSidebar,
    onCloseWorkspaceSidebar,
    onToggleWorkspaceSidebar,
  };
};
