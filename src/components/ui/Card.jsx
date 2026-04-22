import React from "react";
export default function Card({ title, subtitle, icon: Icon, children, right }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
