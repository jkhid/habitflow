const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const Avatar = ({ src, alt, name, size = 'md', className = '' }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizes[size]} rounded-full bg-indigo-100 text-indigo-600
        flex items-center justify-center font-medium
        ${className}
      `}
    >
      {initials}
    </div>
  );
};

export default Avatar;
