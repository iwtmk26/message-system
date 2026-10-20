/* 小さな線画のアイコン（色は、まわりの文字の色になる） */

type Props = { size?: number };

function Svg({
  size = 18,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ✓ 登録・問題なし */
export function CheckIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Svg>
  );
}

/* ✓ を丸で囲んだもの（登録なし） */
export function CheckCircleIcon(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.8 12.4l3 3 5.4-6" />
    </Svg>
  );
}

/* 禁止（迷惑番号） */
export function BanIcon(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </Svg>
  );
}

/* 注意（三角にびっくりマーク） */
export function WarnIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5L2.8 19.5h18.4L12 3.5z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.2h.01" />
    </Svg>
  );
}

/* 閉じる（×） */
export function CloseIcon(props: Props) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}
