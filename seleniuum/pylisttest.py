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

    # 登録画面表示
    driver.get(
        "https://d11xxeftrnkpe5.cloudfront.net"
    )

    # 一覧ボタン押下
    list_button = wait.until(
        EC.element_to_be_clickable(
            (
                By.CLASS_NAME,
                "list-button"
            )
        )
    )

    list_button.click()

    # 検索ボックス取得
    search_box = wait.until(
        EC.visibility_of_element_located(
            (
                By.CSS_SELECTOR,
                "input[placeholder='キーワード検索']"
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
