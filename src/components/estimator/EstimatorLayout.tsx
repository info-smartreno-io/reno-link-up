import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { EstimatorSidebar } from "./EstimatorSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarCollapse = () => useContext(SidebarContext);

interface EstimatorLayoutProps {
  children: ReactNode;
}

export function EstimatorLayout({ children }: EstimatorLayoutProps) {
  const [profile, setProfile] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'E';

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen flex w-full bg-background">
        <EstimatorSidebar />
        
        <div 
          className="flex-1 flex flex-col transition-all duration-300" 
          style={{ marginLeft: collapsed ? 56 : 240 }}
        >
          {/* Top Header */}
          <header className="h-14 flex items-center gap-3 border-b bg-background px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2 ml-auto">
              <NotificationBell />
              <SettingsDropdown userRole="estimator" />
              <Avatar className="h-8 w-8 border">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
