import { User, Users, RefreshCcw, Timer, Laptop, VenetianMask, Star, Shield, Flame, Swords, Bot, Moon, Brain, Zap, Skull, Library, Crown, Target, Activity, BarChart2, Bug, Medal, Diamond, Hexagon, Trophy } from 'lucide-react';
import { HtmlIcon, CssIcon, JsIcon, PythonIcon, JavaIcon } from './TechIcons';
import { Swords3DIcon } from './ModeIcons';

export const TridentIcon = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 4px ${color}80)` }}>
    <path d="M12 22V4M12 4L9 7M12 4L15 7M5 12V8C5 6.89543 5.89543 6 7 6H8M19 12V8C19 6.89543 18.1046 6 17 6H16M5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PremiumIcon = ({ name, size = 20, color = '#ffffff', style = {} }) => {
  const glowStyle = { filter: `drop-shadow(0 0 8px ${color}80)`, ...style };
  
  switch(name) {
    case '1P': return <User size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case '2P': return <Users size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case '3P': return <TridentIcon size={size} color={color} />;
    case '4P': return <Swords3DIcon size={size} />;
    
    case 'HTML': return <HtmlIcon size={size} />;
    case 'CSS': return <CssIcon size={size} />;
    case 'JavaScript': return <JsIcon size={size} />;
    case 'Python': return <PythonIcon size={size} />;
    case 'Java': return <JavaIcon size={size} />;
    
    case 'Rounds': return <RefreshCcw size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Time': return <Timer size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Language': return <Laptop size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Spectators': return <VenetianMask size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    
    case 'Star': return <Star size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Beginner': return <Star size={size} color={color} strokeWidth={2.5} fill={`${color}40`} style={glowStyle} />;
    case 'Moderate': return <Shield size={size} color={color} strokeWidth={2.5} fill={`${color}40`} style={glowStyle} />;
    case 'Advanced': return <Flame size={size} color={color} strokeWidth={2.5} fill={`${color}40`} style={glowStyle} />;
    
    case 'Swords': return <Swords size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    
    case 'Bot': return <Bot size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Moon': return <Moon size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Brain': return <Brain size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Zap': return <Zap size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Skull': return <Skull size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    
    case 'Library': return <Library size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Crown': return <Crown size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Target': return <Target size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Activity': return <Activity size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'BarChart2': return <BarChart2 size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Bug': return <Bug size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Medal': return <Medal size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Diamond': return <Diamond size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Hexagon': return <Hexagon size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    case 'Trophy': return <Trophy size={size} color={color} strokeWidth={2.5} style={glowStyle} />;
    
    default: return null;
  }
};
