type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

const MaterialIcon = ({ name, className, filled = false }: MaterialIconProps) => {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ""}`.trim()}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};

export default MaterialIcon;