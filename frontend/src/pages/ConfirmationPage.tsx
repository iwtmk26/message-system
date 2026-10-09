import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function ConfirmationPage() {

  const location = useLocation();
  const navigate = useNavigate();

  const { messageBody, receiverName, destination } =
    location.state || {};

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async () => {

    try {

      setIsSubmitting(true);

      const response = await apiFetch(
        "/messages",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            messageBody,
            receiverName,
            destination,
          }),
        }
      );

      const result = await response.text();

      console.log("status=", response.status);
      console.log("result=", result);

      if (response.ok) {
        navigate("/complete", {
          state: {
            receiverName,
            destination,
          },
        });
      }

    } catch (error) {

      console.error(error);
      alert("通信エラー");

    } finally {

      setIsSubmitting(false);

    }
  };

  return (
    <div className="container">

      <div className="header">
        <h1>確認画面</h1>
      </div>

      <div className="confirm-area">

        <p className="confirm-message">
          以下の内容でよろしいですか？
        </p>

        <div className="confirm-card">

          <div className="confirm-item">
            <p className="label">伝言内容</p>
            <p>{messageBody}</p>
          </div>

          <div className="confirm-item">
            <p className="label">受電者</p>
            <p>{receiverName}</p>
          </div>

          <div className="confirm-item">
            <p className="label">伝言先</p>
            <p className="destination">
              {destination}
            </p>
          </div>

        </div>

        <div className="button-area">

          <button
            className="back-button"
            onClick={() =>
              navigate("/", {
                state: {
                  messageBody,
                  receiverName,
                  destination,
                },
              })
            }
            disabled={isSubmitting}
          >
            ← 修正する
          </button>

          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "送信中..."
              : "最終OK →"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default ConfirmationPage;