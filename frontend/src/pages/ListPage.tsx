import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { splitBody } from "../messageFormat";
import { apiFetch } from "../api";
import TrashIcon from "../components/TrashIcon";
import PersonIcon from "../components/PersonIcon";

type Message = {
  messageId: string;
  messageBody: string;
  receiverName: string;
  destination: string;
  registeredAt: string;
};

function ListPage() {

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {

    const fetchMessages = async () => {

      try {

        const response = await apiFetch(
          "/messages"
        );

        if (!response.ok) {

          throw new Error(
            `HTTP error: ${response.status}`
          );

        }

        const data = await response.json();

        setMessages(data);

      } catch (error) {

        console.error(
          "伝言一覧取得失敗",
          error
        );

      } finally {

        setLoaded(true);

      }

    };

    fetchMessages();

  }, []);

  const filteredMessages =
    messages.filter((message) =>

      message.destination.includes(keyword) ||

      message.receiverName.includes(keyword) ||

      message.messageBody.includes(keyword)

    );

  const handleDelete = async (
    messageId: string
  ) => {

    const result = window.confirm(
      "この伝言を削除しますか？"
    );

    if (!result) {
      return;
    }

    try {

      const response = await apiFetch(
        `/messages?messageId=${encodeURIComponent(messageId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {

        alert(
          "削除に失敗しました"
        );

        return;
      }

      setMessages(
        (prevMessages) =>
          prevMessages.filter(
            (message) =>
              message.messageId !== messageId
          )
      );

    } catch (error) {

      console.error(
        "削除失敗",
        error
      );

      alert(
        "削除中にエラーが発生しました"
      );

    }
  };

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>
            受け取った伝言
          </h1>

        </div>

      </div>

      <div className="form-area">

        <div className="search-area">

          <input
            type="text"
            value={keyword}
            onChange={(e) =>
              setKeyword(e.target.value)
            }
            placeholder="キーワード検索（伝言先・受電者・内容）"
          />

        </div>

        <div className="list-header">

          <span className="list-count">
            {loaded
              ? `${filteredMessages.length}件`
              : "読み込み中..."}
          </span>

          <Link
            to="/register"
            className="new-message-button"
          >
            新規登録
          </Link>

        </div>

        {loaded &&
          filteredMessages.length === 0 && (

          <p className="list-empty">
            {keyword
              ? "条件に合う伝言はありません"
              : "伝言はまだありません"}
          </p>

        )}

        <ul className="message-list">

          {filteredMessages.map(
            (message) => {

              const { company, body } =
                splitBody(message.messageBody);

              return (

              <li
                key={message.messageId}
                className="memo"
              >

                <div className="memo-head">

                  <Link
                    to={`/detail/${message.messageId}`}
                    className="memo-title"
                  >
                    <PersonIcon />
                    {message.destination} 宛
                  </Link>

                  <span className="memo-date">
                    {message.registeredAt}
                  </span>

                  <button
                    type="button"
                    className="memo-delete"
                    aria-label="この伝言を削除"
                    title="削除"
                    onClick={() =>
                      handleDelete(
                        message.messageId
                      )
                    }
                  >
                    <TrashIcon />
                  </button>

                </div>

                <Link
                  to={`/detail/${message.messageId}`}
                  className="memo-body"
                >

                  <span className="memo-paper">

                    <span
                      className={
                        company
                          ? "memo-company"
                          : "memo-company memo-company-empty"
                      }
                    >
                      {company || "（電話先なし）"}
                    </span>

                    <span className="memo-text">
                      {body}
                    </span>

                    {message.receiverName && (

                      <span className="memo-from">
                        受電：{message.receiverName}
                      </span>

                    )}

                  </span>

                </Link>

              </li>

              );
            }
          )}

        </ul>

      </div>

    </div>

  );
}

export default ListPage;