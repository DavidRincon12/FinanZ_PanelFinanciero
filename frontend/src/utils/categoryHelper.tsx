import React from 'react';
import { 
  Home, 
  Coffee, 
  Car, 
  Heart, 
  Zap, 
  BookOpen, 
  Gamepad2, 
  Shirt, 
  Laptop, 
  Sparkles, 
  CreditCard, 
  PiggyBank, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  ShoppingCart
} from 'lucide-react';

export interface CategoryStyle {
  icon: React.ReactNode;
  colorClass: string;
  colorHex: string;
  bgOpacityClass: string;
}

const defaultStyle: CategoryStyle = {
  icon: <Tag size={20} />,
  colorClass: 'text-slate-600',
  colorHex: '#475569',
  bgOpacityClass: 'bg-slate-100 text-slate-600'
};

const categoryMap: { [key: string]: Omit<CategoryStyle, 'icon'> & { iconComponent: React.ComponentType<any> } } = {
  'arriendo': {
    iconComponent: Home,
    colorClass: 'text-indigo-600',
    colorHex: '#4D5DFB',
    bgOpacityClass: 'bg-indigo-50 text-indigo-600'
  },
  'alimentación': {
    iconComponent: Coffee,
    colorClass: 'text-emerald-600',
    colorHex: '#10B981',
    bgOpacityClass: 'bg-emerald-50 text-emerald-600'
  },
  'comida': {
    iconComponent: Coffee,
    colorClass: 'text-emerald-600',
    colorHex: '#10B981',
    bgOpacityClass: 'bg-emerald-50 text-emerald-600'
  },
  'transporte': {
    iconComponent: Car,
    colorClass: 'text-amber-600',
    colorHex: '#F59E0B',
    bgOpacityClass: 'bg-amber-50 text-amber-600'
  },
  'salud': {
    iconComponent: Heart,
    colorClass: 'text-rose-600',
    colorHex: '#F43F5E',
    bgOpacityClass: 'bg-rose-50 text-rose-600'
  },
  'servicios': {
    iconComponent: Zap,
    colorClass: 'text-yellow-600',
    colorHex: '#EAB308',
    bgOpacityClass: 'bg-yellow-50 text-yellow-600'
  },
  'educación': {
    iconComponent: BookOpen,
    colorClass: 'text-cyan-600',
    colorHex: '#06B6D4',
    bgOpacityClass: 'bg-cyan-50 text-cyan-600'
  },
  'ocio': {
    iconComponent: Gamepad2,
    colorClass: 'text-purple-600',
    colorHex: '#8B5CF6',
    bgOpacityClass: 'bg-purple-50 text-purple-600'
  },
  'entretenimiento': {
    iconComponent: Gamepad2,
    colorClass: 'text-purple-600',
    colorHex: '#8B5CF6',
    bgOpacityClass: 'bg-purple-50 text-purple-600'
  },
  'ropa': {
    iconComponent: Shirt,
    colorClass: 'text-fuchsia-600',
    colorHex: '#D946EF',
    bgOpacityClass: 'bg-fuchsia-50 text-fuchsia-600'
  },
  'tecnología': {
    iconComponent: Laptop,
    colorClass: 'text-blue-600',
    colorHex: '#3B82F6',
    bgOpacityClass: 'bg-blue-50 text-blue-600'
  },
  'mascotas': {
    iconComponent: Sparkles,
    colorClass: 'text-orange-600',
    colorHex: '#F97316',
    bgOpacityClass: 'bg-orange-50 text-orange-600'
  },
  'deudas': {
    iconComponent: CreditCard,
    colorClass: 'text-red-600',
    colorHex: '#EF4444',
    bgOpacityClass: 'bg-red-50 text-red-600'
  },
  'ahorros': {
    iconComponent: PiggyBank,
    colorClass: 'text-teal-600',
    colorHex: '#0D9488',
    bgOpacityClass: 'bg-teal-50 text-teal-600'
  },
  'salario': {
    iconComponent: DollarSign,
    colorClass: 'text-emerald-600',
    colorHex: '#10B981',
    bgOpacityClass: 'bg-emerald-50 text-emerald-600'
  },
  'freelance': {
    iconComponent: DollarSign,
    colorClass: 'text-emerald-500',
    colorHex: '#10B981',
    bgOpacityClass: 'bg-emerald-50 text-emerald-500'
  },
  'inversiones': {
    iconComponent: TrendingUp,
    colorClass: 'text-violet-600',
    colorHex: '#7C3AED',
    bgOpacityClass: 'bg-violet-50 text-violet-600'
  },
  'compras': {
    iconComponent: ShoppingCart,
    colorClass: 'text-red-600',
    colorHex: '#EF4444',
    bgOpacityClass: 'bg-red-50 text-red-600'
  },
  'otros': {
    iconComponent: Tag,
    colorClass: 'text-slate-600',
    colorHex: '#475569',
    bgOpacityClass: 'bg-slate-50 text-slate-600'
  }
};

export const getCategoryStyle = (categoryName: string, iconSize = 20): CategoryStyle => {
  if (!categoryName) return defaultStyle;
  
  const normalized = categoryName.toLowerCase().trim();
  const matched = categoryMap[normalized];
  
  if (matched) {
    const Icon = matched.iconComponent;
    return {
      icon: <Icon size={iconSize} />,
      colorClass: matched.colorClass,
      colorHex: matched.colorHex,
      bgOpacityClass: matched.bgOpacityClass
    };
  }
  
  return defaultStyle;
};
