import { API_ENV } from "../api";

/*
 * 接続先を示す帯。
 * 本番の画面（CloudFront）を使う人には出さない。
 * 本番ビルドを自分のPCで開いたとき（localhost）だけ、赤い帯で警告する。
 */

const BANNERS = {
  mock: {
    className: "env-banner env-banner-mock",
    text: "テストモード（仮データ・どこにも送信されません）",
  },
  test: {
    className: "env-banner env-banner-test",
    text: "テスト環境（テスト用APIに接続・通知は「99_テスト」に届きます）",
  },
  prod: {
    className: "env-banner env-banner-prod",
    text: "本番環境に接続しています（実際に登録・通知されます）",
  },
} as const;

function EnvBanner() {

  if (API_ENV === "prod" && !isLocalhost()) {
    return null;
  }

  const banner = BANNERS[API_ENV];

  return <div className={banner.className}>{banner.text}</div>;
}

function isLocalhost(): boolean {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export default EnvBanner;
