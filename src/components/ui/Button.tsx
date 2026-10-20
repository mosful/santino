"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { buttonStyles, type ButtonSize, type ButtonVariant } from "./buttonStyles";

export { buttonStyles };
export type { ButtonSize, ButtonVariant };

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 只放一個圖示時設為 true，按鈕變正方形；務必同時給 aria-label。 */
  iconOnly?: boolean;
  /** 分頁／篩選鈕的選取狀態；會同步寫入 aria-pressed。 */
  selected?: boolean;
  fullWidth?: boolean;
};

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    type?: "button" | "submit" | "reset";
  };

/** 預設 `type="button"`：原型內多數按鈕在表單中，預設 submit 會整頁重新整理。 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, iconOnly, selected, fullWidth, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-pressed={selected ?? rest["aria-pressed"]}
      className={buttonStyles({ variant, size, iconOnly, selected, fullWidth, className })}
    />
  );
});

export default Button;

export type ButtonLinkProps = CommonProps &
  React.ComponentProps<typeof Link> & { className?: string };

/** 外觀與 Button 一致的導覽連結（Next.js Link）。 */
export function ButtonLink({
  variant,
  size,
  iconOnly,
  selected,
  fullWidth,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      {...rest}
      className={buttonStyles({ variant, size, iconOnly, selected, fullWidth, className })}
    />
  );
}
