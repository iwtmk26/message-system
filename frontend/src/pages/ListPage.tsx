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
            伝言一覧
          </h1>

          <Link
            to="/nuisance"
            className="list-button"
          >
            番号検索
          </Link>

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
            to="/"
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
                className="message-item"
              >

                <Link
                  to={`/detail/${message.messageId}`}
                  className="message-item-main"
                >

                  <span className="message-item-dest">
                    <PersonIcon />
                    {message.destination} 宛
                  </span>

                  {company && (

                    <span className="message-item-company">
                      {company}
                    </span>

                  )}

                  <span className="message-item-body">
                    {body}
                  </span>

                  <span className="message-item-date">
                    {message.registeredAt}
                  </span>

                </Link>

                <button
                  type="button"
                  className="message-item-delete"
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