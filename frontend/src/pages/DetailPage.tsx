import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

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

        const response = await fetch(
          `https://kn3somrtp6.execute-api.ap-northeast-1.amazonaws.com/messages/${encodeURIComponent(messageId)}`
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

          <h1>
            伝言詳細
          </h1>

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

          <h1>
            伝言詳細
          </h1>

        </div>

        <div className="form-area">

          <p className="error-message">

            {errorMessage ||
              "伝言が見つかりません"}

          </p>

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >

            <Link
              to="/list"
              className="new-message-button"
            >
              一覧へ戻る
            </Link>

          </div>

        </div>

      </div>

    );

  }

  /*
   * ============================
   * 詳細表示
   * ============================
   */
  return (

    <div className="container">

      <div className="header">

        <h1>
          伝言詳細
        </h1>

      </div>

      <div className="form-area">

        <div className="complete-card">

          <p>

            <strong>
              受電日時：
            </strong>

            {message.registeredAt}

          </p>

          <p>

            <strong>
              伝言先：
            </strong>

            {message.destination}

          </p>

          <p>

            <strong>
              受電者：
            </strong>

            {message.receiverName}

          </p>

          <div
            style={{
              marginTop: "20px",
            }}
          >

            <strong>
              伝言内容
            </strong>

            <div
              style={{
                marginTop: "10px",
                padding: "15px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >

              {message.messageBody}

            </div>

          </div>

        </div>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >

          <Link
            to="/list"
            className="new-message-button"
          >
            一覧へ戻る
          </Link>

        </div>

      </div>

    </div>

  );

}

export default DetailPage;