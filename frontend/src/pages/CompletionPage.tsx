import { useLocation, Link } from "react-router-dom";

function CompletePage() {

  const location = useLocation();

  const {
    receiverName,
    destination,
  } = location.state || {};

  return (
    <div className="container">

      <div className="header">
        <h1>登録完了</h1>
      </div>

      <div className="complete-area">

        <h2 className="success-title">
          伝言を登録しました
        </h2>

        <div className="complete-card">
          <p>
            <strong>伝言先：</strong>
            {destination}
          </p>

          <p>
            <strong>受電者：</strong>
            {receiverName}
          </p>
        </div>

        <p className="complete-message">
          Teamsへ通知しました。
        </p>

        <a
          href="https://teams.microsoft.com/l/channel/19%3Ae19e8e0947924ee58a069f9aea89d25c%40thread.tacv2/71_%E4%BC%9D%E8%A8%80%E3%83%A1%E3%83%A2?groupId=5f28bedb-2023-4e45-8647-6322dd6db437&tenantId=90d75b8f-615b-463e-9492-5cb3672bad9e"
          target="_blank"
          rel="noopener noreferrer"
          className="teams-link-button"
        >
          Teamsで確認する →
        </a>

        <br />

        <Link
          to="/"
          className="new-message-button"
        >
          新しい伝言を登録する
        </Link>

      </div>

    </div>
  );
}

export default CompletePage;