import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import NuisanceCard from "../components/NuisanceCard";
import {
  MIN_PHONE_DIGITS,
  findNuisance,
  formatPhone,
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

    try {

      const hit =
        await findNuisance(digits);

      setResult({ digits, hit });

    } catch (error) {

      setResult(null);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "検索に失敗しました。もう一度お試しください"
      );

    }

  };

  const hit = result?.hit ?? null;

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>番号を確認する</h1>

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
          <span className="phrase">電話番号を入力して、</span>
          <span className="phrase">迷惑番号リストにあるか確認します。</span>
          <br className="sentence-break" />
          <span className="phrase">ハイフンの有無や</span>
          <span className="phrase">全角でも検索できます。</span>
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
                  navigate("/register", {
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

          <div className="nuisance-hit">

            <p className="nuisance-badge is-hit">
              迷惑番号に登録されています
            </p>

            <NuisanceCard
              key={hit.phoneNumber}
              item={hit}
              defaultOpen
              onUpdated={(updated) =>
                setResult({
                  digits: result.digits,
                  hit: { ...updated },
                })
              }
            />

          </div>

        )}

      </div>

    </div>

  );
}

export default NuisanceSearchPage;
