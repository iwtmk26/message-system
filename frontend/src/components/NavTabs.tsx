import { NavLink, useLocation } from "react-router-dom";

/*
 * 画面上部の移動タブ。
 * 登録の途中（確認・完了）の画面には出さない。
 */

const TABS = [
  { to: "/", label: "登録フォーム", match: (p: string) => p === "/" },
  {
    to: "/list",
    label: "伝言一覧",
    match: (p: string) =>
      p === "/list" || p.startsWith("/detail/"),
  },
  {
    to: "/nuisance",
    label: "迷惑電話チェック",
    match: (p: string) => p.startsWith("/nuisance"),
  },
];

function NavTabs() {

  const { pathname } = useLocation();

  if (pathname === "/confirm" || pathname === "/complete") {
    return null;
  }

  return (
    <nav className="nav-tabs" aria-label="画面の切り替え">

      {TABS.map((tab) => (

        <NavLink
          key={tab.to}
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

      ))}

    </nav>
  );
}

export default NavTabs;
