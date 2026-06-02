"use client";

type ProfileAvatarProps = {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function ProfileAvatar({
  src,
  name,
  size = "md",
  className = "",
}: ProfileAvatarProps) {
  const initials = name?.slice(0, 2).toUpperCase() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name} avatar` : "Profile"}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-indigo-500 font-bold text-white ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
