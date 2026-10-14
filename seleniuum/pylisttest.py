from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()

try:

    wait = WebDriverWait(driver, 10)

    # 検索キーワード入力
    keyword = input(
        "検索キーワードを入力してください: "
    )

    # 伝言一覧を直接開く（画面の最初は「迷惑電話チェック」になったため）
    driver.get(
        "https://d11xxeftrnkpe5.cloudfront.net/list"
    )

    # 検索ボックス取得
    search_box = wait.until(
        EC.visibility_of_element_located(
            (
                By.CSS_SELECTOR,
                "input[placeholder^='キーワード検索']"
            )
        )
    )

    # キーワード入力
    search_box.send_keys(keyword)

    print(
        f"検索キーワード: {keyword}"
    )

    input(
        "確認後 Enter キーを押してください..."
    )

finally:

    driver.quit()
