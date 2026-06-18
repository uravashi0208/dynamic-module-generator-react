import {
  Type, Mail, Lock, Hash, AlignLeft, CheckSquare,
  Circle, ChevronDown, Calendar, CalendarClock,
  Paperclip, Link, Phone, Palette, Sliders
} from 'lucide-react';

export const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type, category: 'Basic' },
  { value: 'email', label: 'Email', icon: Mail, category: 'Basic' },
  { value: 'password', label: 'Password', icon: Lock, category: 'Basic' },
  { value: 'number', label: 'Number', icon: Hash, category: 'Basic' },
  { value: 'textarea', label: 'Textarea', icon: AlignLeft, category: 'Basic' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, category: 'Choice' },
  { value: 'radio', label: 'Radio', icon: Circle, category: 'Choice' },
  { value: 'select', label: 'Dropdown', icon: ChevronDown, category: 'Choice' },
  { value: 'date', label: 'Date', icon: Calendar, category: 'Date & Time' },
  { value: 'datetime-local', label: 'Date & Time', icon: CalendarClock, category: 'Date & Time' },
  { value: 'file', label: 'File Upload', icon: Paperclip, category: 'Advanced' },
  { value: 'url', label: 'URL', icon: Link, category: 'Advanced' },
  { value: 'tel', label: 'Phone', icon: Phone, category: 'Advanced' },
  { value: 'color', label: 'Color Picker', icon: Palette, category: 'Advanced' },
  { value: 'range', label: 'Range Slider', icon: Sliders, category: 'Advanced' },
];

export const FIELD_TYPE_MAP = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t]));

export const getFieldTypeIcon = (type) => {
  const fieldType = FIELD_TYPE_MAP[type];
  return fieldType ? fieldType.icon : Type;
};

export const ICON_OPTIONS = [
  'cube', 'layers', 'database', 'grid', 'package', 'box',
  'file', 'folder', 'settings', 'tool', 'cpu', 'server',
  'shield', 'star', 'zap', 'code',
];
