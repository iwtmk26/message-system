import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Member = {
  memberId: string;
  memberName: string;
};

function RegistrationPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const [messageBody, setMessageBody] = useState(
    location.state?.messageBody ?? ""
  );

  const [receiverName, setReceiverName] = useState(
    location.state?.receiverName ?? ""
  );

  const [members, setMembers] =
    useState<Member[]>([]);

  const [destination, setDestination] = useState(
    location.state?.destination ?? ""
  );

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {

    const savedName =
      localStorage.getItem(
        "receiverName"
      );

    if (
      savedName &&
      !location.state?.receiverName
    ) {

      setReceiverName(
        savedName
      );

    }

  }, [location.state]);

  useEffect(() => {

    const fetchMembers = async () => {

      const response = await fetch(
        "https://kn3somrtp6.execute-api.ap-northeast-1.amazonaws.com/members"
      );

      const data = await response.json();

      setMembers(data);

    };

    fetchMembers();

  }, []);

  const handleSubmit = () => {

    if (!messageBody) {
      setErrorMessage(
        "伝言内容を入力してください"
      );
      return;
    }

    if (!receiverName) {
      setErrorMessage(
        "自分の名前を入力してください"
      );
      return;
    }

    if (!destination) {
      setErrorMessage(
        "伝言先を選択してください"
      );
      return;
    }

    setErrorMessage("");

    navigate("/confirm", {
      state: {
        messageBody,
        receiverName,
        destination,
      },
    });

  };

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>登録フォーム</h1>

          <div className="header-actions">

            <button
              className="list-button"
              onClick={() =>
                navigate("/nuisance")
              }
            >
              番号検索
            </button>

            <button
              className="list-button"
              onClick={() =>
                navigate("/list")
              }
            >
              一覧
            </button>

          </div>

        </div>

      </div>

      <div className="form-area">

        <p className="form-description">
          採用・営業電話の伝言内容を入力してください。
        </p>

        <div className="form-group">

          <label>
            伝言内容
            <span className="required">
              必須
            </span>
          </label>

          <textarea
            value={messageBody}
            onChange={(e) =>
              setMessageBody(
                e.target.value
              )
            }
            placeholder={`例：
株式会社〇〇 田中様より入電

採用代行サービスの件で連絡あり。
担当者からの折り返し希望。

TEL：03-XXXX-XXXX`}
          />

        </div>

        <div className="form-group">

          <label>
            自分の名前
            <span className="required">
              必須
            </span>
          </label>

          <select
            value={receiverName}
            onChange={(e) => {

              setReceiverName(
                e.target.value
              );

              localStorage.setItem(
                "receiverName",
                e.target.value
              );

            }}
          >

            <option value="">
              選択してください
            </option>

            {members.map((member) => (

              <option
                key={member.memberId}
                value={member.memberName}
              >
                {member.memberName}
              </option>

            ))}

          </select>

        </div>

        <div className="form-group">

          <label>
            伝言先
            <span className="required">
              必須
            </span>
          </label>

          <select
            value={destination}
            onChange={(e) =>
              setDestination(
                e.target.value
              )
            }
          >

            <option value="">
              選択してください
            </option>

            {members.map((member) => (

              <option
                key={member.memberId}
                value={member.memberName}
              >
                {member.memberName}
              </option>

            ))}

          </select>

        </div>

        {errorMessage && (

          <p className="error-message">
            {errorMessage}
          </p>

        )}

        <button
          className="register-button"
          onClick={handleSubmit}
        >
          登録する →
        </button>

      </div>

    </div>

  );
}

export default RegistrationPage;