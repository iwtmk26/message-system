import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { composeBody, splitBody } from "../messageFormat";
import { apiFetch } from "../api";
import NuisanceCheck from "../components/NuisanceCheck";
import { postMessage } from "../messageApi";
import {
  formatPhone,
  normalizePhone,
  MIN_PHONE_DIGITS,
} from "../nuisance/nuisanceApi";

/* 本文に、電話番号がなければ、最後に「TEL：番号」の1行を足す */
function withPhone(body: string, phone: string): string {

  const digits = normalizePhone(phone);

  if (digits.length < MIN_PHONE_DIGITS) {
    return body;
  }

  // 本文に、同じ番号がすでに書いてあれば、足さない
  if (normalizePhone(body).includes(digits)) {
    return body;
  }

  return `${body.trimEnd()}\nTEL：${formatPhone(digits)}`;
}

type Member = {
  memberId: string;
  memberName: string;
};

function RegistrationPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const initial = splitBody(
    location.state?.messageBody ?? ""
  );

  const [phone, setPhone] = useState(
    location.state?.phone ?? ""
  );

  const [companyName, setCompanyName] =
    useState(initial.company);

  const [messageBody, setMessageBody] =
    useState(initial.body);

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

      const response = await apiFetch(
        "/members"
      );

      const data = await response.json();

      setMembers(data);

    };

    fetchMembers();

  }, []);

  /* 必須項目の確認。足りないときは、その文言を返す */
  const validate = (): string => {

    if (!messageBody) {
      return "伝言内容を入力してください";
    }

    if (!receiverName) {
      return "自分の名前を入力してください";
    }

    if (!destination) {
      return "伝言先を選択してください";
    }

    return "";
  };

  const [registering, setRegistering] = useState(false);
  const [directError, setDirectError] = useState("");

  /* 「このまま伝言を登録する」：確認画面を通らずに、登録して、伝言一覧へ */
  const handleDirectRegister = async () => {

    setDirectError("");

    const problem = validate();

    if (problem) {
      setDirectError(problem);
      return;
    }

    setRegistering(true);

    try {

      await postMessage({
        messageBody: composeBody(
          companyName,
          withPhone(messageBody, phone)
        ),
        receiverName,
        destination,
      });

      localStorage.setItem("receiverName", receiverName);

      navigate("/list", {
        state: { registered: { destination, receiverName } },
      });

    } catch (error) {

      setDirectError(
        error instanceof Error
          ? error.message
          : "伝言を登録できませんでした。もう一度お試しください"
      );

    } finally {

      setRegistering(false);
    }

  };

  const handleSubmit = () => {

    const problem = validate();

    if (problem) {
      setErrorMessage(problem);
      return;
    }

    setErrorMessage("");

    navigate("/confirm", {
      state: {
        messageBody: composeBody(
          companyName,
          withPhone(messageBody, phone)
        ),
        receiverName,
        destination,
        phone,
      },
    });

  };

  return (

    <div className="container">

      <div className="header">

        <div className="header-content">

          <h1>伝言を入力する</h1>

        </div>

      </div>

      <div className="form-area">

        <p className="form-description">
          <span className="phrase">採用・営業電話の</span>
          <span className="phrase">伝言内容を</span>
          <span className="phrase">入力してください。</span>
        </p>

        <div className="form-group">

          <label htmlFor="phone-input">
            電話番号
            <span className="optional">
              入力すると、迷惑番号か自動で確認します
            </span>
          </label>

          <input
            id="phone-input"
            type="tel"
            inputMode="tel"
            autoFocus
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="例：03-1234-5678"
          />

          <NuisanceCheck
            phone={phone}
            receiverName={receiverName}
            companyName={companyName}
            onRegisterMessage={handleDirectRegister}
            registeringMessage={registering}
            messageError={directError}
          />

        </div>

        <div className="form-group">

          <label>
            電話先（企業名）
            <span className="optional">
              任意
            </span>
          </label>

          <input
            type="text"
            value={companyName}
            onChange={(e) =>
              setCompanyName(e.target.value)
            }
            placeholder="例：株式会社〇〇"
          />

        </div>

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
          登録する
        </button>

      </div>

    </div>

  );
}

export default RegistrationPage;