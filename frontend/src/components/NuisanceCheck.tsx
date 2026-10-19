import { useEffect, useRef, useState } from "react";

import NuisanceCard from "./NuisanceCard";
import {
  MIN_PHONE_DIGITS,
  createNuisance,
  findNuisance,
  formatPhone,
  getSavedReceiverName,
  normalizePhone,
  type NuisanceNumber,
} from "../nuisance/nuisanceApi";

/*
 * 電話番号を入力すると、自動で迷惑番号かどうかを確認して、結果を出す。
 * 登録フォームの電話番号の下に置く。
 *
 * ・番号が8桁以上になったら、入力が止まって0.5秒後に確認する
 * ・登録されている → 赤い札と、迷惑番号のカード（着信の記録もできる）
 * ・登録なし → 緑の表示と、次の2つ（どちらも、画面を移らずに、その場で行う）
 *     「このまま伝言を登録する」… 確認画面を飛ばして、伝言を登録する
 *     「迷惑番号として登録する」… 会社名・メモを入れて、迷惑番号に登録する
 */

const WAIT_MS = 500;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; digits: string; hit: NuisanceNumber | null };

type Props = {
  phone: string;
  /* 登録フォームで入力中の「自分の名前」「電話先」。迷惑番号の登録に使う */
  receiverName: string;
  companyName: string;
  /* 「このまま伝言を登録する」。登録フォーム側で、入力の確認と送信を行う */
  onRegisterMessage: () => void;
  registeringMessage: boolean;
  messageError: string;
};

function NuisanceCheck({
  phone,
  receiverName,
  companyName,
  onRegisterMessage,
  registeringMessage,
  messageError,
}: Props) {

  const [state, setState] = useState<State>({ kind: "idle" });

  // 古い確認の結果が、新しい入力の結果を上書きしないための番号
  const requestNo = useRef(0);

  // 迷惑番号として登録する小さなフォーム
  const [formOpen, setFormOpen] = useState(false);
  const [formCompany, setFormCompany] = useState("");
  const [formMemo, setFormMemo] = useState("");
  const [formError, setFormError] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const digits = normalizePhone(phone);

  useEffect(() => {

    requestNo.current += 1;

    const mine = requestNo.current;

    if (digits.length < MIN_PHONE_DIGITS) {

      // 番号が短くなったら、結果を消す
      const clear = setTimeout(() => {
        setState({ kind: "idle" });
        setFormOpen(false);
        setNotice("");
      }, 0);

      return () => clearTimeout(clear);
    }

    const timer = setTimeout(async () => {

      setState({ kind: "loading" });
      setFormOpen(false);
      setFormError("");
      setNotice("");

      try {

        const hit = await findNuisance(digits);

        if (mine === requestNo.current) {
          setState({ kind: "result", digits, hit });
        }

      } catch (error) {

        console.error(error);

        if (mine === requestNo.current) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "確認に失敗しました。もう一度お試しください",
          });
        }

      }

    }, WAIT_MS);

    return () => clearTimeout(timer);

  }, [digits]);

  const openForm = () => {
    setFormCompany(companyName);
    setFormMemo("");
    setFormError("");
    setFormOpen(true);
  };

  const registerNuisance = async () => {

    if (state.kind !== "result") {
      return;
    }

    setFormBusy(true);
    setFormError("");

    try {

      await createNuisance({
        phoneNumber: state.digits,
        companyName: formCompany,
        memo: formMemo,
        // いま電話を受けているので、着信も1件、記録する
        recordCall: true,
        receiverName: receiverName || getSavedReceiverName(),
      });

      const created = await findNuisance(state.digits);

      setFormOpen(false);
      setNotice("迷惑番号に登録しました（着信を1件、記録しました）");
      setState({ kind: "result", digits: state.digits, hit: created });

    } catch (error) {

      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "登録できませんでした。もう一度お試しください"
      );

    } finally {

      setFormBusy(false);
    }

  };

  return (

    <div className="nuisance-check-area" aria-live="polite">

      {state.kind === "loading" && (

        <p className="check-status">
          迷惑番号か確認しています…
        </p>

      )}

      {state.kind === "error" && (

        <p className="error-message">
          {state.message}
        </p>

      )}

      {state.kind === "result" && state.hit && (

        <div className="nuisance-hit">

          <p className="nuisance-badge is-hit">
            迷惑番号に登録されています
          </p>

          {notice && (

            <p className="check-status" role="status">
              {notice}
            </p>

          )}

          <p className="check-status">
            カードを開くと、メモ・着信ログの確認と、着信の記録ができます。
          </p>

          <NuisanceCard
            key={state.hit.phoneNumber}
            item={state.hit}
            onUpdated={(updated) =>
              setState({
                kind: "result",
                digits: state.digits,
                hit: { ...updated },
              })
            }
          />

        </div>

      )}

      {state.kind === "result" && !state.hit && (

        <div className="check-clear">

          <p className="check-clear-text">
            <span className="check-clear-mark" aria-hidden="true">
              ✓
            </span>
            {formatPhone(state.digits)} は、迷惑番号には登録されていません
          </p>

          <div className="check-clear-actions">

            <button
              type="button"
              className="small-button"
              onClick={onRegisterMessage}
              disabled={registeringMessage}
            >
              {registeringMessage
                ? "登録しています…"
                : "このまま伝言を登録する"}
            </button>

            <button
              type="button"
              className="small-button secondary"
              onClick={openForm}
              aria-expanded={formOpen}
            >
              迷惑番号として登録する
            </button>

          </div>

          {messageError && (

            <p className="error-message check-clear-error" role="alert">
              {messageError}
            </p>

          )}

          {formOpen && (

            <div className="check-form">

              <p className="check-form-title">
                迷惑番号として登録（着信も1件、記録します）
              </p>

              <input
                type="text"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="会社名（任意）"
                aria-label="会社名（任意）"
              />

              <input
                type="text"
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                placeholder="メモ（任意）例：営業。お断りした"
                aria-label="メモ（任意）"
              />

              {formError && (

                <p className="error-message" role="alert">
                  {formError}
                </p>

              )}

              <div className="check-clear-actions">

                <button
                  type="button"
                  className="small-button"
                  onClick={registerNuisance}
                  disabled={formBusy}
                >
                  {formBusy ? "登録しています…" : "登録する"}
                </button>

                <button
                  type="button"
                  className="small-button secondary"
                  onClick={() => setFormOpen(false)}
                  disabled={formBusy}
                >
                  やめる
                </button>

              </div>

            </div>

          )}

        </div>

      )}

    </div>
  );
}

export default NuisanceCheck;
