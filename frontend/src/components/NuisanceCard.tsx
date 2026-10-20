import { useState } from "react";

import TrashIcon from "./TrashIcon";
import {
  addCallLog,
  formatPhone,
  getSavedReceiverName,
  lastCalledAt,
  type NuisanceNumber,
} from "../nuisance/nuisanceApi";

/*
 * 迷惑番号のカード（番号検索の結果と、迷惑番号一覧で共通）
 *
 * 閉じた状態では「電話番号」と「会社名」だけを見せる。
 * 開くと、着信回数・最終着信・メモ・着信ログと、
 * 「今回の着信を記録する」を表示する。
 */

type Props = {
  item: NuisanceNumber;
  defaultOpen?: boolean;
  onUpdated: (updated: NuisanceNumber) => void;
  onEdit?: (item: NuisanceNumber) => void;
  onDelete?: (item: NuisanceNumber) => void;
};

const LOG_LIMIT = 5;

function NuisanceCard({
  item,
  defaultOpen = false,
  onUpdated,
  onEdit,
  onDelete,
}: Props) {

  const [open, setOpen] = useState(defaultOpen);

  const [receiverName, setReceiverName] =
    useState(getSavedReceiverName());

  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");

  const handleAddLog = async () => {

    let updated: NuisanceNumber | null = null;

    try {

      updated = await addCallLog(
        item.phoneNumber,
        { receiverName, note }
      );

    } catch (error) {

      console.error(error);

    }

    if (!updated) {

      setMessage("記録に失敗しました");

      return;
    }

    setNote("");

    setMessage(
      `記録しました（通算${updated.logs.length}回目）`
    );

    onUpdated(updated);

  };

  const logs = [...item.logs].reverse();

  return (

    <details
      className="ncard"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >

      <summary className="ncard-summary">

        <span className="ncard-phone">
          {formatPhone(item.phoneNumber)}
        </span>

        <span className="ncard-company">
          {item.companyName || "（会社名不明）"}
        </span>

        <span className="ncard-chevron" aria-hidden="true" />

      </summary>

      <div className="ncard-body">

        <div className="memo-paper">

          <div className="ncard-facts">

            <div className="ncard-fact">
              <span className="memo-label">着信回数</span>
              <span className="ncard-value">
                {item.logs.length}回
              </span>
            </div>

            <div className="ncard-fact">
              <span className="memo-label">最終着信</span>
              <span className="ncard-value">
                {lastCalledAt(item)}
              </span>
            </div>

          </div>

          <div className="ncard-fact">
            <span className="memo-label">メモ</span>
            <span className="ncard-value">
              {item.memo || "（なし）"}
            </span>
          </div>

          {logs.length > 0 && (

            <div className="ncard-fact">

              <span className="memo-label">着信ログ</span>

              <ul className="nuisance-log-list">

                {logs.slice(0, LOG_LIMIT).map((log, index) => (

                  <li key={`${log.calledAt}-${index}`}>
                    {log.calledAt}
                    {" / "}
                    {log.receiverName || "対応者不明"}
                    {log.note && `：${log.note}`}
                  </li>

                ))}

              </ul>

              {logs.length > LOG_LIMIT && (

                <span className="memo-label">
                  ほか{logs.length - LOG_LIMIT}件
                </span>

              )}

            </div>

          )}

          <div className="nuisance-log-form">

            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="対応者"
              aria-label="対応者"
            />

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモ（任意）例：お断りした"
              aria-label="メモ"
            />

          </div>

          <div className="nuisance-actions">

            <button
              type="button"
              className="btn btn-amber btn-sm"
              onClick={handleAddLog}
            >
              今回の着信を記録する
            </button>

            {onEdit && (

              <button
                type="button"
                className="small-button secondary"
                onClick={() => onEdit(item)}
              >
                編集
              </button>

            )}

            {onDelete && (

              <button
                type="button"
                className="delete-button"
                aria-label="この番号を削除"
                title="削除"
                onClick={() => onDelete(item)}
              >
                <TrashIcon />
              </button>

            )}

          </div>

          {message && (

            <p className="nuisance-hint" role="status">
              {message}
            </p>

          )}

        </div>

      </div>

    </details>
  );
}

export default NuisanceCard;
