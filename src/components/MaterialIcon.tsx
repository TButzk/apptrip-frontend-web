type MaterialIconProps = {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
};

export function MaterialIcon({ name, filled = false, size = 24, className = "" }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined${filled ? " filled" : ""}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
