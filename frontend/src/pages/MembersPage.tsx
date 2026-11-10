import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isGroup } from "../memberOrder";
import {
  isRetired,
  listAllMembers,
  setMemberRetired,
  type ManagedMember,
} from "../membersApi";

/*
 * 社員の管理。
 * 退職した人などを「非表示」にする（データは消さない）。
 * 非表示の人は、登録フォームの入力候補・伝言先に出ない。
 * 非表示の人は、下の折りたたみの中にあり、「表示に戻す」で戻せる。
 */
function MembersPage() {

  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {

    try {

      setMembers(await listAllMembers());
      setErrorMessage("");

    } catch (error) {

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "社員の一覧を取得できませんでした"
      );

    } finally {

      setLoaded(true);
    }
  };

  // 最初の読み込み（setState は、通信が終わったあとの処理の中で行う）
  useEffect(() => {

    let cancelled = false;

    listAllMembers()
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((error) => {
        if (!cancelled)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "社員の一覧を取得できませんでした"
          );
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };

  }, []);

  const change = async (member: ManagedMember, retired: boolean) => {

    // 取り違え防止。非表示にするときだけ確認する（戻すのは、いつでもできる）
    if (
      retired &&
      !window.confirm(
        `「${member.memberName}」を非表示にしますか？\n` +
          "伝言先と入力候補に出なくなります（過去の伝言は、そのまま残ります。あとで戻せます）。"
      )
    ) {
      return;
    }

    setBusyId(member.memberId);
    setErrorMessage("");

    try {

      await setMemberRetired(member.memberId, retired);
      await load();

    } catch (error) {

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "更新できませんでした。もう一度お試しください"
      );

    } finally {

      setBusyId("");
    }
  };

  const active = members.filter((m) => !isRetired(m));
  const retiredList = members.filter(isRetired);

  const row = (member: ManagedMember, retired: boolean) => (

    <li key={member.memberId} className="member-row">

      <span className="member-name">
        {member.memberName}
        {isGroup(member) && (
          <span className="member-tag">グループ</span>
        )}
      </span>

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={busyId === member.memberId}
        onClick={() => change(member, !retired)}
      >
        {retired ? "表示に戻す" : "非表示にする"}
      </button>

    </li>
  );

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>社員の管理</h1>

        </div>

      </div>

      <div className="form-area">

        <p className="form-description">
          退職した人などを「非表示」にします。データは消えません。
        </p>

        {errorMessage && (

          <p className="error-message" role="alert">
            {errorMessage}
          </p>

        )}

        {!loaded && <p>読み込んでいます…</p>}

        {loaded && (

          <>
            <h2 className="members-heading">
              表示中（{active.length}人）
            </h2>

            <ul className="member-list">
              {active.map((m) => row(m, false))}
            </ul>

            {/* 普段は収納（折りたたみ）。非表示の人がいるときだけ出す */}
            {retiredList.length > 0 && (

              <details className="members-retired">

                <summary>
                  非表示の人（{retiredList.length}人）
                </summary>

                <ul className="member-list">
                  {retiredList.map((m) => row(m, true))}
                </ul>

              </details>

            )}
          </>

        )}

        <p className="members-back">
          <Link to="/register">← 登録フォームへ戻る</Link>
        </p>

      </div>

    </div>
  );
}

export default MembersPage;
