import { NavLink, Outlet } from "react-router";

export default function SettingsLayout() {
  return (
    <div className="bg-background flex min-h-[calc(100vh-8rem)] w-full items-start gap-12 px-8 py-14 lg:px-16 xl:px-20">
      <aside className="flex w-[220px] flex-col gap-5">
        <h2 className="text-foreground text-base font-semibold tracking-tight">Settings</h2>
        <nav className="text-muted-foreground flex flex-col gap-1 text-sm font-medium">
          <NavLink
            to="/settings"
            end
            className={({ isActive }) =>
              `rounded-md px-3 py-2 no-underline transition-colors ${isActive ? "bg-secondary text-foreground" : "hover:bg-accent hover:text-foreground"}`
            }
          >
            Connectors
          </NavLink>
        </nav>
      </aside>
      <section className="flex-1">
        <Outlet />
      </section>
    </div>
  );
}
