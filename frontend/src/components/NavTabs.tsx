import { NavLink, useLocation } from "react-router-dom";

/* 画面上部の移動タブ（矢印の形）。 */

const TABS = [
  {
    to: "/register",
    label: "登録フォーム",
    match: (p: string) => p === "/register",
  },
  {
    to: "/list",
    label: "伝言一覧",
    match: (p: string) =>
      p === "/list" || p.startsWith("/detail/"),
  },
  {
    to: "/nuisance/list",
    label: "迷惑番号一覧",
    match: (p: string) => p.startsWith("/nuisance"),
  },
];

function NavTabs() {

  const { pathname } = useLocation();

  return (
    <nav className="nav-tabs" aria-label="業務の流れ">

      <ol className="nav-steps">

        {TABS.map((tab) => (

          <li key={tab.to} className="nav-step">

            <NavLink
              to={tab.to}
              className={
                tab.match(pathname)
                  ? "nav-tab nav-tab-active"
                  : "nav-tab"
              }
              aria-current={tab.match(pathname) ? "page" : undefined}
            >
              {tab.label}
            </NavLink>

          </li>

        ))}

      </ol>

    </nav>
  );
}

export default NavTabs;
