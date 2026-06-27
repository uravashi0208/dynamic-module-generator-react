export const FIELD_TYPES = [
  { value: 'text',           label: 'Text',         icon: 'ti-cursor-text', category: 'Basic'      },
  { value: 'email',          label: 'Email',        icon: 'ti-mail',        category: 'Basic'      },
  { value: 'password',       label: 'Password',     icon: 'ti-lock',        category: 'Basic'      },
  { value: 'number',         label: 'Number',       icon: 'ti-hash',        category: 'Basic'      },
  { value: 'textarea',       label: 'Textarea',     icon: 'ti-align-left',  category: 'Basic'      },
  { value: 'checkbox',       label: 'Checkbox',     icon: 'ti-checkbox',    category: 'Choice'     },
  { value: 'radio',          label: 'Radio',        icon: 'ti-circle-dot',  category: 'Choice'     },
  { value: 'select',         label: 'Dropdown',     icon: 'ti-chevron-down',category: 'Choice'     },
  { value: 'date',           label: 'Date',         icon: 'ti-calendar',    category: 'Date & Time'},
  { value: 'datetime-local', label: 'Date & Time',  icon: 'ti-calendar-time',category:'Date & Time'},
  { value: 'file',           label: 'File Upload',  icon: 'ti-paperclip',   category: 'Advanced'   },
  { value: 'url',            label: 'URL',          icon: 'ti-link',        category: 'Advanced'   },
  { value: 'tel',            label: 'Phone',        icon: 'ti-phone',       category: 'Advanced'   },
  { value: 'color',          label: 'Color Picker', icon: 'ti-palette',     category: 'Advanced'   },
  { value: 'range',          label: 'Range Slider', icon: 'ti-adjustments', category: 'Advanced'   },
];

export const FIELD_TYPE_MAP = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t]));

/** Returns a Tabler icon class string, e.g. "ti ti-cursor-text" */
export const getFieldTypeIcon = (type) => {
  const ft = FIELD_TYPE_MAP[type];
  return ft ? `ti ${ft.icon}` : 'ti ti-cursor-text';
};

/**
 * Module icon palette — the most commonly used icons for business modules
 * (forms, CRMs, inventories, HR tools, etc). Shown as colorful emoji swatches
 * on the "Create / Edit Module" screen.
 */
export const MODULE_ICON_OPTIONS = [
  { value: 'cube',          emoji: '🧊', label: 'Cube' },
  { value: 'layers',        emoji: '📚', label: 'Layers' },
  { value: 'grid',          emoji: '⊞',  label: 'Grid' },
  { value: 'package',       emoji: '📦', label: 'Package' },
  { value: 'database',      emoji: '🗄️', label: 'Database' },
  { value: 'file',          emoji: '📄', label: 'File' },
  { value: 'folder',        emoji: '📁', label: 'Folder' },
  { value: 'clipboard',     emoji: '📋', label: 'Clipboard' },
  { value: 'list',          emoji: '📝', label: 'List' },
  { value: 'users',         emoji: '👥', label: 'Users' },
  { value: 'user',          emoji: '👤', label: 'User' },
  { value: 'building',      emoji: '🏢', label: 'Building' },
  { value: 'briefcase',     emoji: '💼', label: 'Briefcase' },
  { value: 'calendar',      emoji: '📅', label: 'Calendar' },
  { value: 'chart',         emoji: '📊', label: 'Chart' },
  { value: 'trending',      emoji: '📈', label: 'Trending' },
  { value: 'tag',           emoji: '🏷️', label: 'Tag' },
  { value: 'bell',          emoji: '🔔', label: 'Bell' },
  { value: 'mail',          emoji: '✉️', label: 'Mail' },
  { value: 'phone',         emoji: '📞', label: 'Phone' },
  { value: 'map-pin',       emoji: '📍', label: 'Location' },
  { value: 'globe',         emoji: '🌐', label: 'Globe' },
  { value: 'link',          emoji: '🔗', label: 'Link' },
  { value: 'credit-card',   emoji: '💳', label: 'Payments' },
  { value: 'cart',          emoji: '🛒', label: 'Cart' },
  { value: 'truck',         emoji: '🚚', label: 'Shipping' },
  { value: 'home',          emoji: '🏠', label: 'Home' },
  { value: 'book',          emoji: '📖', label: 'Book' },
  { value: 'camera',        emoji: '📷', label: 'Camera' },
  { value: 'image',         emoji: '🖼️', label: 'Image' },
  { value: 'heart',         emoji: '❤️', label: 'Favorites' },
  { value: 'bookmark',      emoji: '🔖', label: 'Bookmark' },
  { value: 'flag',          emoji: '🚩', label: 'Flag' },
  { value: 'lock',          emoji: '🔒', label: 'Lock' },
  { value: 'key',           emoji: '🔑', label: 'Key' },
  { value: 'gift',          emoji: '🎁', label: 'Gift' },
  { value: 'settings',      emoji: '⚙️', label: 'Settings' },
  { value: 'tool',          emoji: '🛠️', label: 'Tools' },
  { value: 'shield',        emoji: '🛡️', label: 'Shield' },
  { value: 'star',          emoji: '⭐', label: 'Star' },
  { value: 'zap',           emoji: '⚡', label: 'Zap' },
  { value: 'rocket',        emoji: '🚀', label: 'Rocket' },
  { value: 'target',        emoji: '🎯', label: 'Target' },
  { value: 'trophy',        emoji: '🏆', label: 'Trophy' },
  { value: 'puzzle',        emoji: '🧩', label: 'Puzzle' },
];

// Backward-compatible plain-value list (kept in case anything still imports this name)
export const ICON_OPTIONS = MODULE_ICON_OPTIONS.map((i) => i.value);
