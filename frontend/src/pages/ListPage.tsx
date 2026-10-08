import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

type Message = {
  messageId: string;
  messageBody: string;
  receiverName: string;
  destination: string;
  registeredAt: string;
};

function ListPage() {

  const navigate = useNavigate();

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [keyword, setKeyword] =
    useState("");

  useEffect(() => {

    const fetchMessages = async () => {

      try {

        const response = await fetch(
          "https://kn3somrtp6.execute-api.ap-northeast-1.amazonaws.com/messages"
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

      const response = await fetch(
        `https://kn3somrtp6.execute-api.ap-northeast-1.amazonaws.com/messages?messageId=${encodeURIComponent(messageId)}`,
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

  const handleDetail = (
    messageId: string
  ) => {

    navigate(
      `/detail/${messageId}`
    );

  };

  const getMessagePreview = (
    messageBody: string
  ) => {

    if (messageBody.length > 20) {

      return (
        messageBody.slice(0, 20) + "..."
      );

    }

    return messageBody;
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
            placeholder="キーワード検索"
          />

        </div>

        <div className="list-header">

          <Link
            to="/"
            className="new-message-button"
          >
            新規登録
          </Link>

        </div>

        <table className="message-table">

          <thead>

            <tr>

              <th>
                受電日時
              </th>

              <th>
                伝言先
              </th>

              <th>
                伝言内容
              </th>

              <th>
                削除
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredMessages.map(
              (message) => (

                <tr
                  key={message.messageId}
                >

                  <td>
                    {message.registeredAt}
                  </td>

                  <td>
                    {message.destination}
                  </td>

                  <td>

                    <button
                      type="button"
                      className="message-preview-button"
                      onClick={() =>
                        handleDetail(
                          message.messageId
                        )
                      }
                      title="詳細を表示"
                    >
                      {getMessagePreview(
                        message.messageBody
                      )}
                    </button>

                  </td>

                  <td>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDelete(
                          message.messageId
                        )
                      }
                    >
                      削除
                    </button>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}

export default ListPage;