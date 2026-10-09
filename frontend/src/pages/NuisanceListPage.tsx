import { type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TrashIcon from "../components/TrashIcon";

import {
  createNuisance,
  deleteNuisance,
  formatPhone,
  getSavedReceiverName,
  lastCalledAt,
  listNuisance,
  normalizePhone,
  updateNuisance,
  type NuisanceNumber,
} from "../nuisance/nuisanceApi";

type FormState = {
  mode: "create" | "edit";
  phone: string;
  companyName: string;
  memo: string;
  recordCall: boolean;
};

function NuisanceListPage() {

  const navigate = useNavigate();
  const location = useLocation();

  /*
   * 検索画面の「迷惑番号として登録する」から来た場合は
   * 番号を入力済みで登録フォームを開く
   */
  const newPhone: string | undefined =
    location.state?.newPhone;

  const [items, setItems] =
    useState<NuisanceNumber[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const [form, setForm] =
    useState<FormState | null>(
      newPhone
        ? {
            mode: "create",
            phone: newPhone,
            companyName: "",
            memo: "",
            recordCall: true,
          }
        : null
    );

  const [errorMessage, setErrorMessage] =
    useState("");

  const [openLogs, setOpenLogs] =
    useState<string[]>([]);

  const reload = async () => {
    setItems(await listNuisance());
  };

  useEffect(() => {

    const load = async () => {
      setItems(await listNuisance());
    };

    load();

  }, []);

  const keywordDigits =
    normalizePhone(keyword);

  const filteredItems = items.filter((item) =>

    keyword === "" ||

    (keywordDigits !== "" &&
      item.phoneNumber.includes(keywordDigits)) ||

    item.companyName.includes(keyword) ||

    item.memo.includes(keyword)

  );

  const openCreateForm = () => {

    setErrorMessage("");

    setForm({
      mode: "create",
      phone: "",
      companyName: "",
      memo: "",
      recordCall: true,
    });

  };

  const openEditForm = (
    item: NuisanceNumber
  ) => {

    setErrorMessage("");

    setForm({
      mode: "edit",
      phone: item.phoneNumber,
      companyName: item.companyName,
      memo: item.memo,
      recordCall: false,
    });

  };

  const closeForm = () => {
    setForm(null);
    setErrorMessage("");
  };

  const handleSubmit = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    if (!form) {
      return;
    }

    try {

      if (form.mode === "edit") {

        await updateNuisance(
          form.phone,
          {
            companyName: form.companyName,
            memo: form.memo,
          }
        );

      } else {

        await createNuisance({
          phoneNumber: form.phone,
          companyName: form.companyName,
          memo: form.memo,
          recordCall: form.recordCall,
          receiverName: getSavedReceiverName(),
        });

      }

      await reload();

      closeForm();

    } catch (error) {

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "保存に失敗しました"
      );

    }

  };

  const handleDelete = async (
    item: NuisanceNumber
  ) => {

    const result = window.confirm(
      `${formatPhone(item.phoneNumber)} を迷惑番号リストから削除しますか？`
    );

    if (!result) {
      return;
    }

    await deleteNuisance(item.phoneNumber);

    await reload();

  };

  const toggleLogs = (
    phoneNumber: string
  ) => {

    setOpenLogs((prev) =>
      prev.includes(phoneNumber)
        ? prev.filter((p) => p !== phoneNumber)
        : [...prev, phoneNumber]
    );

  };

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>迷惑番号一覧</h1>

          <div className="header-actions">

            <button
              className="list-button"
              onClick={() =>
                navigate("/nuisance")
              }
            >
              迷惑電話チェック
            </button>

          </div>

        </div>

      </div>

      <div className="form-area">

        <div className="nuisance-search-row">

          <input
            type="text"
            value={keyword}
            onChange={(e) =>
              setKeyword(e.target.value)
            }
            placeholder="番号・会社名・メモで絞り込み"
          />

          <button
            type="button"
            onClick={openCreateForm}
          >
            新規登録
          </button>

        </div>

        {form && (

          <form
            className="nuisance-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group nuisance-first">

              <label>
                電話番号
                <span className="required">
                  必須
                </span>
              </label>

              <input
                type="tel"
                inputMode="tel"
                value={
                  form.mode === "edit"
                    ? formatPhone(form.phone)
                    : form.phone
                }
                disabled={form.mode === "edit"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                placeholder="例：03-1234-5678"
              />

            </div>

            <div className="form-group">

              <label>
                会社名・名称
              </label>

              <input
                type="text"
                value={form.companyName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyName: e.target.value,
                  })
                }
                placeholder="分かる範囲で"
              />

            </div>

            <div className="form-group">

              <label>
                メモ
              </label>

              <textarea
                value={form.memo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    memo: e.target.value,
                  })
                }
                placeholder="例：オフィス用品の営業。しつこい"
              />

            </div>

            {form.mode === "create" && (

              <label className="nuisance-check">

                <input
                  type="checkbox"
                  checked={form.recordCall}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recordCall: e.target.checked,
                    })
                  }
                />

                今回の着信としてログに記録する

              </label>

            )}

            {errorMessage && (

              <p className="error-message">
                {errorMessage}
              </p>

            )}

            <div className="nuisance-actions">

              <button
                type="submit"
                className="small-button"
              >
                {form.mode === "edit"
                  ? "更新する"
                  : "登録する"}
              </button>

              <button
                type="button"
                className="small-button secondary"
                onClick={closeForm}
              >
                キャンセル
              </button>

            </div>

          </form>

        )}

        {filteredItems.length === 0 && (

          <p className="form-description">
            該当する迷惑番号はありません。
          </p>

        )}

        {filteredItems.map((item) => (

          <div
            className="nuisance-card"
            key={item.phoneNumber}
          >

            <div className="nuisance-card-head">

              <span className="nuisance-phone">
                {formatPhone(item.phoneNumber)}
              </span>

              <span className="nuisance-count">
                {item.logs.length}回
              </span>

            </div>

            <p className="nuisance-company">
              {item.companyName || "（会社名不明）"}
            </p>

            {item.memo && (

              <p className="nuisance-memo">
                {item.memo}
              </p>

            )}

            <p className="nuisance-meta">
              最終着信：{lastCalledAt(item)}
            </p>

            <div className="nuisance-actions">

              <button
                type="button"
                className="small-button secondary"
                onClick={() =>
                  toggleLogs(item.phoneNumber)
                }
              >
                着信ログ（{item.logs.length}）
              </button>

              <button
                type="button"
                className="small-button secondary"
                onClick={() =>
                  openEditForm(item)
                }
              >
                編集
              </button>

              <button
                type="button"
                className="delete-button"
                aria-label="この番号を削除"
                title="削除"
                onClick={() =>
                  handleDelete(item)
                }
              >
                <TrashIcon />
              </button>

            </div>

            {openLogs.includes(item.phoneNumber) && (

              <ul className="nuisance-log-list">

                {item.logs.length === 0 && (
                  <li>ログはまだありません</li>
                )}

                {[...item.logs]
                  .reverse()
                  .map((log, index) => (

                    <li key={`${log.calledAt}-${index}`}>
                      {log.calledAt}
                      {" / "}
                      {log.receiverName || "対応者不明"}
                      {log.note && `：${log.note}`}
                    </li>

                  ))}

              </ul>

            )}

          </div>

        ))}

        <p className="nuisance-hint">
          ※ 現在は仮データです。登録した内容は、このブラウザの中だけに保存されます。
        </p>

      </div>

    </div>

  );
}

export default NuisanceListPage;
