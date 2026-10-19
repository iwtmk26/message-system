import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import NuisanceCard from "./NuisanceCard";
import {
  MIN_PHONE_DIGITS,
  findNuisance,
  formatPhone,
  normalizePhone,
  type NuisanceNumber,
} from "../nuisance/nuisanceApi";

/*
 * 電話番号を入力すると、自動で迷惑番号かどうかを確認して、結果を出す。
 * 登録フォームの電話番号の下に置く。
 *
 * ・番号が8桁以上になったら、入力が止まって0.5秒後に確認する
 * ・登録されている → 赤い札と、迷惑番号のカード（着信の記録もできる）
 * ・登録なし → 緑の表示と、「迷惑番号として登録する」
 */

const WAIT_MS = 500;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; digits: string; hit: NuisanceNumber | null };

type Props = {
  phone: string;
};

function NuisanceCheck({ phone }: Props) {

  const navigate = useNavigate();

  const [state, setState] = useState<State>({ kind: "idle" });

  // 古い確認の結果が、新しい入力の結果を上書きしないための番号
  const requestNo = useRef(0);

  const digits = normalizePhone(phone);

  useEffect(() => {

    requestNo.current += 1;

    const mine = requestNo.current;

    if (digits.length < MIN_PHONE_DIGITS) {

      // 番号が短くなったら、結果を消す
      const clear = setTimeout(
        () => setState({ kind: "idle" }),
        0
      );

      return () => clearTimeout(clear);
    }

    const timer = setTimeout(async () => {

      setState({ kind: "loading" });

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

          <button
            type="button"
            className="small-button secondary"
            onClick={() =>
              navigate("/nuisance/list", {
                state: { newPhone: state.digits },
              })
            }
          >
            迷惑番号として登録する
          </button>

        </div>

      )}

    </div>
  );
}

export default NuisanceCheck;
