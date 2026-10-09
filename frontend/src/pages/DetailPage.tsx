import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import { splitBody } from "../messageFormat";
import { apiFetch } from "../api";

type Message = {
  messageId: string;
  messageBody: string;
  receiverName: string;
  destination: string;
  registeredAt: string;
};

function DetailPage() {

  const { messageId } =
    useParams<{ messageId: string }>();

  const [message, setMessage] =
    useState<Message | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {

    const fetchMessage = async () => {

      if (!messageId) {

        setErrorMessage(
          "伝言IDが見つかりません"
        );

        setIsLoading(false);

        return;
      }

      try {

        const response = await apiFetch(
          `/messages/${encodeURIComponent(messageId)}`
        );

        /*
         * APIレスポンスを一旦テキストで取得
         */
        const responseText =
          await response.text();

        /*
         * デバッグ用
         */
        console.log(
          "API HTTP STATUS:",
          response.status
        );

        console.log(
          "API RESPONSE:",
          responseText
        );

        /*
         * JSONへ変換
         */
        let data;

        try {

          data =
            JSON.parse(responseText);

        } catch {

          /*
           * JSONではない場合は
           * APIから返ってきた内容をそのまま表示
           */
          throw new Error(
            responseText ||
            "APIから不正なレスポンスが返されました"
          );

        }

        /*
         * HTTPエラー
         */
        if (!response.ok) {

          throw new Error(
            data?.message ||
            "伝言の取得に失敗しました"
          );

        }

        /*
         * 伝言が存在しない
         */
        if (
          !data ||
          data === "NOT_FOUND"
        ) {

          throw new Error(
            "伝言が見つかりません"
          );

        }

        /*
         * 伝言データをセット
         */
        setMessage(data);

      } catch (error) {

        console.error(
          "伝言詳細取得失敗",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "伝言の取得に失敗しました"
        );

      } finally {

        setIsLoading(false);

      }

    };

    fetchMessage();

  }, [messageId]);

  /*
   * ============================
   * 読み込み中
   * ============================
   */
  if (isLoading) {

    return (

      <div className="container">

        <div className="header">

          <div className="header-content">

            <h1>
              伝言詳細
            </h1>

          </div>

        </div>

        <div className="form-area">

          <p>
            読み込み中...
          </p>

        </div>

      </div>

    );

  }

  /*
   * ============================
   * エラー
   * ============================
   */
  if (
    errorMessage ||
    !message
  ) {

    return (

      <div className="container">

        <div className="header">

          <div className="header-content">

            <h1>
              伝言詳細
            </h1>

            <Link
              to="/list"
              className="list-button"
            >
              一覧へ
            </Link>

          </div>

        </div>

        <div className="form-area">

          <p className="error-message">

            {errorMessage ||
              "伝言が見つかりません"}

          </p>

          <div className="detail-back-area">

            <Link
              to="/list"
              className="detail-list-button"
            >
              一覧へ戻る
            </Link>

          </div>

        </div>

      </div>

    );

  }

  const { company, body } =
    splitBody(message.messageBody);

  /*
   * ============================
   * 詳細表示
   * ============================
   */
  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>
            伝言詳細
          </h1>

          <Link
            to="/list"
            className="list-button"
          >
            一覧へ
          </Link>

        </div>

      </div>

      <div className="form-area">

        <div className="detail-message">

          {/*
           * 受電日時・伝言先・受電者を
           * 横並びのメタ情報として表示
           */}
          <div className="detail-meta">

            <div>
              <span className="detail-meta-label">
                受電日時
              </span>
              <span className="detail-meta-value">
                {message.registeredAt}
              </span>
            </div>

            {company && (

              <div>
                <span className="detail-meta-label">
                  電話先
                </span>
                <span className="detail-meta-value">
                  {company}
                </span>
              </div>

            )}

            <div>
              <span className="detail-meta-label">
                伝言先
              </span>
              <span className="detail-meta-value">
                {message.destination}
              </span>
            </div>

            <div>
              <span className="detail-meta-label">
                受電者
              </span>
              <span className="detail-meta-value">
                {message.receiverName}
              </span>
            </div>

          </div>

          {/*
           * 伝言内容は主役として
           * 見出し＋アクセント枠で目立たせる
           */}
          <div className="detail-section-title">
            伝言内容
          </div>

          <div className="detail-body">
            {body}
          </div>

        </div>

        <div className="detail-back-area">

          <Link
            to="/list"
            className="detail-list-button"
          >
            一覧へ戻る
          </Link>

        </div>

      </div>

    </div>

  );

}

export default DetailPage;