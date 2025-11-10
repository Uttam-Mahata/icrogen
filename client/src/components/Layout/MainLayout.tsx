import React, { useState, useEffect } from 'react';
import {
  Menu,
  GraduationCap,
  Building2,
  Users,
  BookOpen,
  DoorOpen,
  Calendar,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/' },
  { text: 'Programmes', icon: <GraduationCap className="h-5 w-5" />, path: '/programmes' },
  { text: 'Departments', icon: <Building2 className="h-5 w-5" />, path: '/departments' },
  { text: 'Teachers', icon: <Users className="h-5 w-5" />, path: '/teachers' },
  { text: 'Subjects', icon: <BookOpen className="h-5 w-5" />, path: '/subjects' },
  { text: 'Rooms', icon: <DoorOpen className="h-5 w-5" />, path: '/rooms' },
  { text: 'Sessions', icon: <CalendarDays className="h-5 w-5" />, path: '/sessions' },
  { text: 'Semester Offerings', icon: <ClipboardList className="h-5 w-5" />, path: '/semester-offerings' },
  { text: 'Routine Generator', icon: <Calendar className="h-5 w-5" />, path: '/routines' },
];

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div className="h-full flex flex-col">
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-xl font-bold">ICRoGen</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.text}>
              <button
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon}
                <span>{item.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center h-16 px-4 border-b bg-background sm:left-60">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDrawerToggle}
          className="sm:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">IIEST Central Routine Generator</h1>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" onClose={() => setMobileOpen(false)} className="p-0 w-60">
          {drawer}
        </SheetContent>
      </Sheet>

      <aside className="hidden sm:block fixed left-0 top-0 h-full w-60 border-r bg-background">
        {drawer}
      </aside>

      <main className="flex-1 overflow-y-auto pt-16 sm:ml-60">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;