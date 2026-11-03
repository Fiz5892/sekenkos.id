import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid place-items-center bg-header px-4 py-14">
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
