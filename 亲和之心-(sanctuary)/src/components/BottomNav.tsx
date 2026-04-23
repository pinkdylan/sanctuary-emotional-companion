import { useLocation, useNavigate } from 'react-router-dom';
import { House, MessageCircle, FileText } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', Icon: House, label: '首页' },
    { path: '/session', Icon: MessageCircle, label: '聊天' },
    { path: '/summary', Icon: FileText, label: '总结' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-surface/90 backdrop-blur-md z-40 rounded-t-[2rem] shadow-[0_-8px_24px_rgba(47,58,58,0.06)] border-t border-outline-variant/20">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.Icon;
        return (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-14 transition-all duration-300 active:scale-90 ${
              isActive 
                ? 'bg-secondary-container text-primary rounded-[1.25rem]' 
                : 'text-on-surface-variant hover:bg-surface-container-low rounded-2xl'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.6 : 2.2} />
            <span className="text-[11px] leading-none font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
