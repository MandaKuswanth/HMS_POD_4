/** Standard HMS Material dialog options — light theme, consistent sizing */
export const HMS_DIALOG_CONFIG = {
  width: '720px',
  maxWidth: '95vw',
  maxHeight: '88vh',
  panelClass: 'hms-dialog-panel',
  autoFocus: false,
} as const;

export const HMS_DIALOG_CONFIG_WIDE = {
  ...HMS_DIALOG_CONFIG,
  width: '820px',
} as const;

export const HMS_DIALOG_CONFIG_NARROW = {
  ...HMS_DIALOG_CONFIG,
  width: '560px',
} as const;
