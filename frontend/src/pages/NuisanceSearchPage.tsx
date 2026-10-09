import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MIN_PHONE_DIGITS,
  addCallLog,
  findNuisance,
  formatPhone,
  getSavedReceiverName,
  lastCalledAt,
  normalizePhone,
  type NuisanceNumber,
} from "../nuisance/nuisanceApi";

type SearchResult = {
  digits: string;
  hit: NuisanceNumber | null;
};

function NuisanceSearchPage() {

  const navigate = useNavigate();

  const [phoneInput, setPhoneInput] =
    useState("");

  const [result, setResult] =
    useState<SearchResult | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [receiverName, setReceiverName] =
    useState(getSavedReceiverName());

  const [note, setNote] =
    useState("");

  const [logMessage, setLogMessage] =
    useState("");

  const handleSearch = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    const digits =
      normalizePhone(phoneInput);

    if (digits.length < MIN_PHONE_DIGITS) {

      setErrorMessage(
        "電話番号を入力してください"
      );

      setResult(null);

      return;
    }

    setErrorMessage("");
    setNote("");
    setLogMessage("");

    const hit =
      await findNuisance(digits);

    setResult({ digits, hit });

  };

  const handleAddLog = async () => {

    if (!result?.hit) {
      return;
    }

    const updated = await addCallLog(
      result.hit.phoneNumber,
      { receiverName, note }
    );

    if (!updated) {

      setLogMessage(
        "記録に失敗しました"
      );

      return;
    }

    setResult({
      digits: result.digits,
      hit: { ...updated },
    });

    setNote("");

    setLogMessage(
      `記録しました（通算${updated.logs.length}回目）`
    );

  };

  const hit = result?.hit ?? null;

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>迷惑電話チェック</h1>

          <div className="header-actions">

            <button
              className="list-button"
              onClick={() =>
                navigate("/nuisance/list")
              }
            >
              迷惑番号一覧
            </button>

          </div>

        </div>

      </div>

      <div className="form-area">

        <p className="form-description">
          電話番号を入力して、迷惑番号リストにあるか確認します。
          ハイフンの有無や全角でも検索できます。
        </p>

        <form
          className="nuisance-search-row"
          onSubmit={handleSearch}
        >

          <input
            type="tel"
            inputMode="tel"
            autoFocus
            value={phoneInput}
            onChange={(e) =>
              setPhoneInput(e.target.value)
            }
            placeholder="例：03-1234-5678"
          />

          <button type="submit">
            検索
          </button>

        </form>

        {errorMessage && (

          <p className="error-message">
            {errorMessage}
          </p>

        )}

        {result && !hit && (

          <div className="nuisance-result is-clear">

            <p className="nuisance-badge is-clear">
              登録なし
            </p>

            <p className="nuisance-phone">
              {formatPhone(result.digits)}
            </p>

            <p className="nuisance-hint">
              迷惑番号リストにはありません。
              担当者へお繋ぎするか、伝言を登録してください。
            </p>

            <div className="nuisance-actions">

              <button
                type="button"
                className="small-button"
                onClick={() =>
                  navigate("/", {
                    state: {
                      messageBody:
                        `TEL：${formatPhone(result.digits)}\n`,
                    },
                  })
                }
              >
                伝言を登録する
              </button>

              <button
                type="button"
                className="small-button secondary"
                onClick={() =>
                  navigate("/nuisance/list", {
                    state: {
                      newPhone: result.digits,
                    },
                  })
                }
              >
                迷惑番号として登録する
              </button>

            </div>

          </div>

        )}

        {result && hit && (

          <div className="nuisance-result is-hit">

            <p className="nuisance-badge is-hit">
              迷惑番号に登録されています
            </p>

            <p className="nuisance-phone">
              {formatPhone(hit.phoneNumber)}
            </p>

            <div className="nuisance-facts">

              <div>
                <span className="detail-meta-label">
                  会社名
                </span>
                <span className="detail-meta-value">
                  {hit.companyName || "（不明）"}
                </span>
              </div>

              <div>
                <span className="detail-meta-label">
                  着信回数
                </span>
                <span className="detail-meta-value">
                  {hit.logs.length}回
                </span>
              </div>

              <div>
                <span className="detail-meta-label">
                  メモ
                </span>
                <span className="detail-meta-value">
                  {hit.memo || "（なし）"}
                </span>
              </div>

              <div>
                <span className="detail-meta-label">
                  最終着信
                </span>
                <span className="detail-meta-value">
                  {lastCalledAt(hit)}
                </span>
              </div>

            </div>

            {hit.logs.length > 0 && (

              <ul className="nuisance-log-list">

                {[...hit.logs]
                  .reverse()
                  .slice(0, 3)
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

            <div className="nuisance-log-form">

              <input
                type="text"
                value={receiverName}
                onChange={(e) =>
                  setReceiverName(e.target.value)
                }
                placeholder="対応者"
              />

              <input
                type="text"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder="メモ（任意）例：お断りした"
              />

            </div>

            <div className="nuisance-actions">

              <button
                type="button"
                className="small-button"
                onClick={handleAddLog}
              >
                今回の着信を記録する
              </button>

            </div>

            {logMessage && (

              <p className="nuisance-hint">
                {logMessage}
              </p>

            )}

          </div>

        )}

      </div>

    </div>

  );
}

export default NuisanceSearchPage;
