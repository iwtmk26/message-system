import { NavLink, useLocation } from "react-router-dom";

/*
 * 画面上部の移動タブ。
 * 登録の途中（確認・完了）の画面には出さない。
 */

const TABS = [
  {
    to: "/nuisance",
    label: "迷惑電話チェック",
    match: (p: string) => p.startsWith("/nuisance"),
  },
  { to: "/", label: "登録フォーム", match: (p: string) => p === "/" },
  {
    to: "/list",
    label: "伝言一覧",
    match: (p: string) =>
      p === "/list" || p.startsWith("/detail/"),
  },
];

function NavTabs() {

  const { pathname } = useLocation();

  if (pathname === "/confirm" || pathname === "/complete") {
    return null;
  }

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
