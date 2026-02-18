type Props = {
  imageUrl: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

export function TextureSwatch({ imageUrl, label, selected, onClick, size = 'md' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`
        ${SIZE_MAP[size]} rounded-full overflow-hidden transition-all duration-200
        ${selected
          ? 'ring-2 ring-[var(--ev2-gold)] ring-offset-2 ring-offset-[var(--ev2-navy-950)] scale-110'
          : 'opacity-70 hover:opacity-100 hover:scale-105'}
      `}
    >
      <img
        src={imageUrl}
        alt={label}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </button>
  );
}
